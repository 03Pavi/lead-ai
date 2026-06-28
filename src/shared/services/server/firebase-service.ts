import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lead-1fcc5";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let db: any = null;
let useRealFirebase = false;

if (projectId && clientEmail && privateKey) {
  try {
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
      });
    }
    db = admin.database();
    useRealFirebase = true;
    console.log("Firebase Admin SDK successfully initialized for Realtime Database.");
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed on backend:", error);
  }
} else {
  console.log("Missing Firebase Admin credentials in .env.local; running in Mock Database Mode.");
}

export { db, useRealFirebase };
