import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is missing in environment variables" }, { status: 500 });
    }

    // 1. Suwayan og Sign-In ang user gamit ang Firebase REST API
    let authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    let res = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    let authData = await res.json();

    // 2. Kung nag-fail ang sign-in (bisan unsa nga error: email not found o invalid credentials), 
    // suwayan nato og Sign Up (Create Account) kay basin bag-o pa siya!
    if (!res.ok) {
      console.log("Sign-in failed, attempting to sign up...", authData.error?.message);
      
      const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
      const signUpRes = await fetch(signUpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      const signUpData = await signUpRes.json();

      if (!signUpRes.ok) {
        console.error("Firebase SignUp Error:", signUpData);
        return NextResponse.json({ error: signUpData.error?.message || 'Authentication failed' }, { status: 400 });
      }

      authData = signUpData;
    }

    // 3. SUCCESS! I-set ang Cookie (Secure masiguro para sa Local ug Production)
    const expiresIn = 60 * 60 * 24 * 5; // 5 days
    const cookieStore = await cookies();
    
    cookieStore.set('moncher_session_email', email, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // False sa local (HTTP), True sa Netlify (HTTPS)
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, email: authData.email });

  } catch (error: any) {
    console.error("Proxy Login Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}