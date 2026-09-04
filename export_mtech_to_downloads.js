import fs from "fs";
import * as XLSX from "xlsx";
import path from "path";
import os from "os";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Parse .env manually
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

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

const MTECH_SPECIALIZATIONS = [
  {
    key: "Control Systems (Electrical Engineering)",
    fileName: "Mtech_Control_Systems_Applications.xlsx",
    sheetName: "Control Systems",
  },
  {
    key: "Thermal Science (Mechanical Engineering)",
    fileName: "Mtech_Thermal_Science_Applications.xlsx",
    sheetName: "Thermal Science",
  },
  {
    key: "Traffic & Transportation Engineering (Civil Engineering)",
    fileName: "Mtech_Traffic_Transportation_Applications.xlsx",
    sheetName: "Traffic & Transportation",
  },
];

const formatAppForExport = (appData, index) => ({
  "Sl No": index + 1,
  Status: appData.status || "pending",
  Name: appData.name || "",
  Email: appData.email || "",
  Phone: appData.phone || "",
  "B.Tech Degree": appData.btechDegree || "",
  "B.Tech Mark %": appData.btechMark || "",
  Specialization: appData.specialization || "",
  "Experience (Years)": appData.experience || 0,
  "Distance (km)": appData.distance || 0,
  Caste: appData.caste || "",
  Religion: appData.religion || "",
  Category: appData.reservationCategory || appData.category || "General",
  "Transaction ID": appData.transactionId || "",
  "Payment Screenshot URL": appData.paymentScreenshotUrl || "N/A",
});

async function main() {
  try {
    console.log("Signing into Firebase...");
    await signInWithEmailAndPassword(auth, email, password);

    console.log("Fetching M.Tech applications from Firestore...");
    const snapshot = await getDocs(collection(db, "mtech_applications"));
    const applications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${applications.length} total M.Tech applications.`);

    const downloadsDir = path.join(os.homedir(), "Downloads");

    // 1. Export 3 Separate Excel Files into Downloads
    for (const spec of MTECH_SPECIALIZATIONS) {
      const specApps = applications.filter((a) => a.specialization === spec.key);
      const rows = specApps.map(formatAppForExport);
      const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: "No applications found" }]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, spec.sheetName);
      
      const filePath = path.join(downloadsDir, spec.fileName);
      XLSX.writeFile(workbook, filePath);
      console.log(`Saved: ${filePath} (${specApps.length} rows)`);
    }

    // 2. Export Combined Multi-Sheet Workbook into Downloads
    const combinedWorkbook = XLSX.utils.book_new();
    // All apps sheet
    const allRows = applications.map(formatAppForExport);
    const allWorksheet = XLSX.utils.json_to_sheet(allRows.length > 0 ? allRows : [{ Note: "No applications found" }]);
    XLSX.utils.book_append_sheet(combinedWorkbook, allWorksheet, "All Applications");

    for (const spec of MTECH_SPECIALIZATIONS) {
      const specApps = applications.filter((a) => a.specialization === spec.key);
      const rows = specApps.map(formatAppForExport);
      const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: "No applications found" }]);
      XLSX.utils.book_append_sheet(combinedWorkbook, worksheet, spec.sheetName);
    }

    const combinedFilePath = path.join(downloadsDir, "Mtech_Applications_All_By_Course.xlsx");
    XLSX.writeFile(combinedWorkbook, combinedFilePath);
    console.log(`Saved: ${combinedFilePath}`);

    console.log("\nAll M.Tech Excel exports successfully created in Downloads folder!");
    process.exit(0);
  } catch (err) {
    console.error("Export failed:", err);
    process.exit(1);
  }
}

main();
