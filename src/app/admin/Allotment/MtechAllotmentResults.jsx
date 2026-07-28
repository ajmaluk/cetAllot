import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import AllottedTable from "./AllottedTable";
import * as XLSX from "xlsx";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

const getMtechSpecializations = () => [
  "Control Systems (Electrical Engineering)",
  "Thermal Science (Mechanical Engineering)",
  "Traffic & Transportation Engineering (Civil Engineering)",
  "Waiting List",
];

export const MtechAllotmentResults = ({ selectedYear: selectedYearProp, setSelectedYear: setSelectedYearProp }) => {
  const [allottedData, setAllottedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [localSelectedYear, setLocalSelectedYear] = useState("2026");

  const selectedYear = selectedYearProp !== undefined ? selectedYearProp : localSelectedYear;
  const setSelectedYear = setSelectedYearProp !== undefined ? setSelectedYearProp : setLocalSelectedYear;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const specializations = getMtechSpecializations();
        const data = {};

        for (const spec of specializations) {
          const snapshot = await getDocs(collection(db, `mtech_allotment/${spec}_${selectedYear}/students`));
          const students = [];
          snapshot.forEach((doc) => students.push({ id: doc.id, ...doc.data() }));
          data[spec] = students;
        }
        setAllottedData(data);

        const docRef = doc(db, "mtech_allotment", `publishStatus_${selectedYear}`);
        const docSnap = await getDoc(docRef);
        setIsPublished(docSnap.exists() && !!docSnap.data().published);
      } catch (error) {
        console.error("Error fetching M.Tech data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedYear]);

  const togglePublish = async () => {
    setPublishing(true);
    try {
      const newStatus = !isPublished;
      await setDoc(doc(db, "mtech_allotment", `publishStatus_${selectedYear}`), {
        published: newStatus,
        timestamp: new Date().toISOString(),
      });
      setIsPublished(newStatus);
    } catch (error) {
      console.error("Error updating publish status:", error);
      alert("Failed to update publish status.");
    } finally {
      setPublishing(false);
    }
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const specializations = getMtechSpecializations();

    const appendSheet = (students, label) => {
      const data = students.map((s, i) => ({
        SlNo: i + 1,
        Name: s.name,
        "B.Tech Degree": s.btechDegree,
        "B.Tech Mark": s.btechMark,
        Experience: s.experience,
        Distance: s.distance,
        Category: s.allottedCategory || s.reservationCategory,
        Email: s.email,
        Phone: s.phone,
        Specialization: label,
        "Transaction ID": s.transactionId,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, ws, label);
    };

    specializations.forEach((spec) => {
      appendSheet(allottedData[spec] || [], spec);
    });

    XLSX.writeFile(workbook, "Mtech_Allotment_Results.xlsx");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-3" />
        <span>Loading M.Tech allotted students...</span>
      </div>
    );
  }

  const specializations = getMtechSpecializations();
  const hasData = specializations.some(
    (spec) => (allottedData[spec]?.length || 0) > 0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Button onClick={exportToExcel} variant="outline" className="shadow-sm" disabled={!hasData}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={togglePublish}
          disabled={publishing}
          className={`shadow-sm ${isPublished ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}`}
        >
          {publishing ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</>
          ) : isPublished ? (
            "Unpublish M.Tech Results"
          ) : (
            "Publish M.Tech Results"
          )}
        </Button>
      </div>

      {!hasData ? (
        <div className="text-center py-16 bg-card border border-border/50 rounded-xl text-muted-foreground">
          <p className="text-lg font-medium">No M.Tech students allotted yet for {selectedYear}.</p>
          <p className="text-sm mt-1">Run the M.Tech allotment process to see results here.</p>
        </div>
      ) : (
        <>
          {specializations.map((spec) => (
            <AllottedTable
              key={spec}
              students={allottedData[spec] || []}
              deptName={spec}
            />
          ))}
        </>
      )}
    </div>
  );
};
