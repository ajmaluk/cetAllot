import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { calculateMtechAllotment } from "./calculateMtechAllotment";
import { db } from "@/firebase";

const clearPreviousAllotment = async (specialization, year) => {
  try {
    const snapshot = await getDocs(collection(db, `mtech_allotment/${specialization}_${year}/students`));
    const deletions = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, `mtech_allotment/${specialization}_${year}/students`, docSnap.id))
    );
    await Promise.all(deletions);
  } catch {
    // Collection might not exist yet
  }
};

export const runMtechAllotmentHandler = async (year) => {
  try {
    const applicationsSnapshot = await getDocs(collection(db, "mtech_applications"));
    const applications = applicationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const currentYear = year ? Number(year) : new Date().getFullYear();

    const getAppYear = (app) => {
      if (!app.submittedAt) return 2025;
      try {
        const date = app.submittedAt.toDate ? app.submittedAt.toDate() : new Date(app.submittedAt);
        return date.getFullYear();
      } catch {
        return 2025;
      }
    };

    const filteredApplications = applications.filter(
      (app) => getAppYear(app) === currentYear && app.status !== "rejected"
    );

    const { updatedApplications, updatedDepartments } = calculateMtechAllotment(filteredApplications);

    for (const dept of updatedDepartments) {
      await clearPreviousAllotment(dept.name, currentYear);
    }

    for (const dept of updatedDepartments) {
      const studentsInDept = updatedApplications.filter(
        (app) => app.allottedDepartment === dept.name
      );

      for (const student of studentsInDept) {
        await setDoc(
          doc(db, "mtech_allotment", `${dept.name}_${currentYear}`, "students", student.id),
          student
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("M.Tech Allotment error:", error);
    return { success: false, error };
  }
};
