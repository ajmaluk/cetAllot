// fetch2026.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from 'fs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const email = "temporary_allotment_agent@cetallot.com";
const password = "TemporaryPassword123!";

const getAppYear = (appData) => {
  if (!appData.submittedAt) return 2025;
  try {
    if (appData.submittedAt && typeof appData.submittedAt.seconds === 'number') {
      return new Date(appData.submittedAt.seconds * 1000).getFullYear();
    }
    return new Date(appData.submittedAt).getFullYear();
  } catch {
    return 2025;
  }
};

async function main() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, email, password);

    console.log("Fetching all applications from Firestore...");
    const snapshot = await getDocs(collection(db, "applications"));
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Total applications in database: ${applications.length}`);

    console.log("Filtering for B.Tech 2026 applications...");
    const apps2026 = applications.filter(app => getAppYear(app) === 2026);
    console.log(`Total B.Tech 2026 applications: ${apps2026.length}`);

    // Save to JSON file
    const outputFilename = 'applications_2026.json';
    fs.writeFileSync(outputFilename, JSON.stringify(apps2026, null, 2), 'utf-8');
    console.log(`Successfully stored B.Tech 2026 applications into '${outputFilename}'!`);

    process.exit(0);
  } catch (error) {
    console.error("Execution failed:", error);
    process.exit(1);
  }
}

main();
