import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET: Kuhaon ang tanang users presence map
export async function GET(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC9hLtwg7v80haEBoMiLdNDerX1wwysE4I";
    const projectId = "storya-ta-bf5e1";

    const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?key=${apiKey}`;
    const res = await fetch(restUrl);
    const data = await res.json();

    const users: any[] = [];
    if (data && data.documents) {
      data.documents.forEach((doc: any) => {
        const fields = doc.fields || {};
        users.push({
          email: fields.email?.stringValue || "",
          displayName: fields.displayName?.stringValue || "",
          lastActive: Number(fields.lastActive?.integerValue || 0),
          isOnline: fields.isOnline?.booleanValue ?? false
        });
      });
    }

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Heartbeat ping para sa current user
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('moncher_session_email');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserEmail = sessionCookie.value.toLowerCase().trim();
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC9hLtwg7v80haEBoMiLdNDerX1wwysE4I";
    const projectId = "storya-ta-bf5e1";

    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "email" },
            op: "EQUAL",
            value: { stringValue: currentUserEmail }
          }
        }
      }
    };

    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload)
    });
    const queryData = await queryRes.json();
    const nowMs = Date.now();

    if (Array.isArray(queryData) && queryData.length > 0 && queryData[0].document) {
      const docName = queryData[0].document.name;
      const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docName.split('/documents/')[1]}?updateMask.fieldPaths=lastActive&updateMask.fieldPaths=isOnline&key=${apiKey}`;
      
      await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            lastActive: { integerValue: nowMs.toString() },
            isOnline: { booleanValue: true }
          }
        })
      });
    } else {
      const createUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?key=${apiKey}`;
      await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            email: { stringValue: currentUserEmail },
            displayName: { stringValue: currentUserEmail.split('@')[0] },
            lastActive: { integerValue: nowMs.toString() },
            isOnline: { booleanValue: true }
          }
        })
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}