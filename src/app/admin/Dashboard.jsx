import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DashboardHeader } from "./DashboardHeader";
import { ApplicationTable } from "./ApplicationTable";
import { MtechApplicationTable } from "./MtechApplicationTable";
import { NoticeCards } from "./Notices/NoticeCards";
import { NoticeDialog } from "./Notices/NoticeDialog";
import { AllotmentResults } from "./Allotment/AllotmentResults";
import { MtechAllotmentResults } from "./Allotment/MtechAllotmentResults";
import { SpotAllotmentResults } from "./Allotment/SpotAllotmentResults";
import { DashboardStats, DashboardStatsSkeleton } from "./DashboardStats";
import { Skeleton, SkeletonTable, SkeletonNoticeCard } from "@/components/ui/Skeleton";
import { db } from "@/firebase";
import { collection, getDocs, getDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { saveNoticeToFirestore, deleteNoticeFromFirestore } from "../utils/saveNotice";
import { runAllotmentHandler } from "../utils/runAllotmentHandler";
import { runMtechAllotmentHandler } from "../utils/runMtechAllotmentHandler";
import { runSpotAllotmentHandler } from "../utils/runSpotAllotmentHandler";
import uploadRealData from "../utils/uploadRealData";
import { Button } from "@/components/ui/Button";
import { UploadCloud, Check, Settings } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [mtechApplications, setMtechApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [allottedCount, setAllottedCount] = useState(0);
  const [mtechAllottedCount, setMtechAllottedCount] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mtechSearchTerm, setMtechSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isNoticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [editNoticeData, setEditNoticeData] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [loadingAllotment, setLoadingAllotment] = useState(false);
  const [loadingMtechAllotment, setLoadingMtechAllotment] = useState(false);
  const [loadingSpotAllotment, setLoadingSpotAllotment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [btechStatus, setBtechStatus] = useState("open");
  const [mtechStatus, setMtechStatus] = useState("coming");

  const handleRunAllotment = async () => {
    if (!window.confirm(`Are you sure you want to run the B.Tech allotment for ${selectedYear}?`)) return;
    setLoadingAllotment(true);
    const result = await runAllotmentHandler(selectedYear);
    setLoadingAllotment(false);

    if (result.success) {
      alert(`B.Tech allotment completed successfully for ${selectedYear}!`);
    } else {
      alert("B.Tech allotment failed. Check console for errors.");
    }
  };

  const handleRunMtechAllotment = async () => {
    if (!window.confirm(`Are you sure you want to run the M.Tech allotment for ${selectedYear}?`)) return;
    setLoadingMtechAllotment(true);
    const result = await runMtechAllotmentHandler(selectedYear);
    setLoadingMtechAllotment(false);

    if (result.success) {
      alert(`M.Tech allotment completed successfully for ${selectedYear}!`);
    } else {
      alert("M.Tech allotment failed. Check console for errors.");
    }
  };

  const handleRunSpotAllotment = async () => {
    if (!window.confirm(`Are you sure you want to run the B.Tech SPOT allotment for ${selectedYear}?`)) return;
    setLoadingSpotAllotment(true);
    const result = await runSpotAllotmentHandler(selectedYear);
    setLoadingSpotAllotment(false);

    if (result.success) {
      alert(`B.Tech SPOT allotment completed successfully for ${selectedYear}!`);
    } else {
      alert("B.Tech SPOT allotment failed. Check console for errors.");
    }
  };

  const handleUploadRealData = async () => {
    if (!window.confirm("Are you sure you want to upload real data? This will clear all existing B.Tech applications and replace them with the mock/real dataset!")) return;
    setUploading(true);
    try {
      await uploadRealData();
      alert("Real data uploaded successfully.");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Uploading real data failed. Check console.");
    }
    setUploading(false);
  };

  const updateProgramStatus = async (program, newStatus) => {
    try {
      await setDoc(doc(db, "settings", `${program}_status`), {
        status: newStatus
      });
    } catch (error) {
      console.error(`Error updating ${program} status:`, error);
    }
  };

  useEffect(() => {
    setIsLoading(true);

    const unsubscribeApps = onSnapshot(collection(db, "applications"), (snapshot) => {
      const apps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
      setIsLoading(false);
      setInitialLoading(false);
    }, (error) => {
      console.error("Error listening to applications:", error);
    });

    const unsubscribeMtechApps = onSnapshot(collection(db, "mtech_applications"), (snapshot) => {
      const apps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMtechApplications(apps);
    }, (error) => {
      console.error("Error listening to M.Tech applications:", error);
    });

    const unsubscribeNotices = onSnapshot(collection(db, "notices"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotices(data);
    }, (error) => {
      console.error("Error listening to notices:", error);
    });

    const unsubscribeBtechStatus = onSnapshot(doc(db, "settings", "btech_status"), (docSnap) => {
      if (docSnap.exists()) {
        setBtechStatus(docSnap.data().status || "open");
      } else {
        setBtechStatus("open");
      }
    }, (error) => {
      console.error("Error listening to B.Tech status:", error);
    });

    const unsubscribeMtechStatus = onSnapshot(doc(db, "settings", "mtech_status"), (docSnap) => {
      if (docSnap.exists()) {
        setMtechStatus(docSnap.data().status || "coming");
      } else {
        setMtechStatus("coming");
      }
    }, (error) => {
      console.error("Error listening to M.Tech status:", error);
    });

    return () => {
      unsubscribeApps();
      unsubscribeMtechApps();
      unsubscribeNotices();
      unsubscribeBtechStatus();
      unsubscribeMtechStatus();
    };
  }, []);

  useEffect(() => {
    const fetchAllotmentsAndAllottedCounts = async () => {
      try {
        const allotmentSnapshot = await getDocs(collection(db, "allotment"));
        const allotmentData = allotmentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDepartments(allotmentData);

        const yearNum = Number(selectedYear);

        const deptNames = yearNum === 2025
          ? ["Civil Engineering", "Electrical and Electronics Engineering", "Mechanical Engineering", "Waiting List"]
          : ["Computer Science and Engineering", "Electronics and Communication Engineering", "Mechanical Engineering", "Waiting List"];
        let totalAllotted = 0;
        for (const dept of deptNames) {
          try {
            const snap = await getDocs(collection(db, `allotment/${dept}_${yearNum}/students`));
            totalAllotted += snap.size;
            const snap2 = await getDocs(collection(db, `no_exam_allotment/${dept}_${yearNum}/students`));
            totalAllotted += snap2.size;
          } catch (err) {
            console.error(err);
          }
        }
        setAllottedCount(totalAllotted);

        const mtechSpecs = [
          "Control Systems (Electrical Engineering)",
          "Thermal Science (Mechanical Engineering)",
          "Traffic & Transportation Engineering (Civil Engineering)",
        ];
        let totalMtechAllotted = 0;
        for (const spec of mtechSpecs) {
          try {
            const snap = await getDocs(collection(db, `mtech_allotment/${spec}_${yearNum}/students`));
            totalMtechAllotted += snap.size;
          } catch (err) {
            console.error(err);
          }
        }
        setMtechAllottedCount(totalMtechAllotted);

        try {
          const publishDoc = await getDoc(doc(db, "allotment", `publishStatus_${yearNum}`));
          if (publishDoc.exists()) {
            setIsPublished(!!publishDoc.data().published);
          } else {
            setIsPublished(false);
          }
        } catch {
          setIsPublished(false);
        }
      } catch (error) {
        console.error("Error fetching allotments: ", error);
      }
    };

    fetchAllotmentsAndAllottedCounts();
  }, [selectedYear]);

  const getAppYear = (app) => {
    if (!app.submittedAt) return 2025;
    try {
      const date = app.submittedAt.toDate ? app.submittedAt.toDate() : new Date(app.submittedAt);
      return date.getFullYear();
    } catch {
      return 2025;
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statsBtechApps = applications.filter((app) => String(getAppYear(app)) === selectedYear);
  const statsMtechApps = mtechApplications.filter((app) => String(getAppYear(app)) === selectedYear);

  const handleSaveNotice = async () => {
    if (!editNoticeData) return;
    setIsLoading(true);
    try {
      await saveNoticeToFirestore(editNoticeData);
      setNoticeDialogOpen(false);
      setEditNoticeData(null);

      const noticesSnapshot = await getDocs(collection(db, "notices"));
      const noticesData = noticesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotices(noticesData);
    } catch (error) {
      console.error("Error saving notice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    const confirm = window.confirm("Are you sure you want to delete this notice?");
    if (!confirm) return;

    setIsLoading(true);
    try {
      await deleteNoticeFromFirestore(noticeId);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    } catch (error) {
      console.error("Error deleting notice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin");
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <DashboardHeader
        onNewNotice={() => {
          setEditNoticeData({
            title: "",
            message: "",
            date: new Date().toISOString().split("T")[0],
            important: false,
            link: "",
          });
          setNoticeDialogOpen(true);
        }}
        onLogout={handleLogout}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />

      {initialLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="mb-8">
          <DashboardStats
            applications={statsBtechApps}
            mtechApplications={statsMtechApps}
            notices={notices}
            allottedCount={allottedCount}
            mtechAllottedCount={mtechAllottedCount}
            isPublished={isPublished}
          />
        </div>
      )}

      <Tabs defaultValue="mtech" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="btech" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800">
            B.Tech
          </TabsTrigger>
          <TabsTrigger value="mtech" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800">
            M.Tech
          </TabsTrigger>
          <TabsTrigger value="notices">Notices & Updates</TabsTrigger>
          <TabsTrigger value="system">System & Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="btech">
          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="allotment">Allotment</TabsTrigger>
              <TabsTrigger value="spot_allotment">Spot Allotment</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              {initialLoading ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between mb-6">
                    <Skeleton className="h-10 w-72 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-28 rounded-md" />
                      <Skeleton className="h-9 w-36 rounded-md" />
                    </div>
                  </div>
                  <SkeletonTable rows={8} columns={14} />
                </div>
              ) : (
                <ApplicationTable
                  applications={filteredApplications.filter(app => !app.isSpot)}
                  departments={departments}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  departmentFilter={departmentFilter}
                  setDepartmentFilter={setDepartmentFilter}
                  isLoading={isLoading}
                  onEdit={() => {}}
                  onNewApplication={() => {}}
                  yearFilter={selectedYear}
                  setYearFilter={setSelectedYear}
                />
              )}
            </TabsContent>

            <TabsContent value="allotment">
              {initialLoading ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between">
                    <Skeleton className="h-10 w-36 rounded-lg" />
                    <Skeleton className="h-10 w-40 rounded-lg" />
                  </div>
                  <SkeletonTable rows={5} columns={5} />
                  <SkeletonTable rows={3} columns={5} />
                  <SkeletonTable rows={4} columns={5} />
                </div>
              ) : (
                <AllotmentResults
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              )}
            </TabsContent>

            <TabsContent value="spot_allotment" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/50 rounded-xl p-4">
                <div>
                  <h3 className="font-bold text-lg">B.Tech Spot Allotment Control</h3>
                  <p className="text-xs text-muted-foreground">Manage spot applications and run the spot allotment algorithm</p>
                </div>
                <Button
                  onClick={handleRunSpotAllotment}
                  disabled={loadingSpotAllotment}
                  className="shadow-sm bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {loadingSpotAllotment ? "Running Spot Allotment..." : "Run Spot Allotment"}
                </Button>
              </div>

              <Tabs defaultValue="spot_applications" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                  <TabsTrigger value="spot_applications">Spot Applications</TabsTrigger>
                  <TabsTrigger value="spot_results">Spot Allotment Results</TabsTrigger>
                </TabsList>

                <TabsContent value="spot_applications" className="space-y-4">
                  {initialLoading ? (
                    <div className="space-y-4 animate-fade-in">
                      <SkeletonTable rows={8} columns={14} />
                    </div>
                  ) : (
                    <ApplicationTable
                      applications={filteredApplications.filter(app => app.isSpot)}
                      departments={departments}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      departmentFilter={departmentFilter}
                      setDepartmentFilter={setDepartmentFilter}
                      isLoading={isLoading}
                      onEdit={() => {}}
                      onNewApplication={() => {}}
                      yearFilter={selectedYear}
                      setYearFilter={setSelectedYear}
                      isSpotMode={true}
                    />
                  )}
                </TabsContent>

                <TabsContent value="spot_results">
                  {initialLoading ? (
                    <div className="space-y-6 animate-fade-in">
                      <SkeletonTable rows={5} columns={5} />
                    </div>
                  ) : (
                    <SpotAllotmentResults
                      selectedYear={selectedYear}
                      setSelectedYear={setSelectedYear}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="mtech">
          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="allotment">Allotment</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              {initialLoading ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between mb-6">
                    <Skeleton className="h-10 w-72 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-28 rounded-md" />
                      <Skeleton className="h-9 w-36 rounded-md" />
                    </div>
                  </div>
                  <SkeletonTable rows={8} columns={11} />
                </div>
              ) : (
                <MtechApplicationTable
                  searchTerm={mtechSearchTerm}
                  setSearchTerm={setMtechSearchTerm}
                  isLoading={isLoading}
                  onNewApplication={() => {}}
                  yearFilter={selectedYear}
                  setYearFilter={setSelectedYear}
                />
              )}
            </TabsContent>

            <TabsContent value="allotment">
              {initialLoading ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between">
                    <Skeleton className="h-10 w-36 rounded-lg" />
                    <Skeleton className="h-10 w-40 rounded-lg" />
                  </div>
                  <SkeletonTable rows={5} columns={5} />
                </div>
              ) : (
                <MtechAllotmentResults
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="notices">
          {initialLoading ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
              {[1, 2, 3].map((i) => (
                <SkeletonNoticeCard key={i} />
              ))}
            </div>
          ) : (
            <NoticeCards
              notices={notices}
              onEdit={(notice) => {
                setEditNoticeData(notice);
                setNoticeDialogOpen(true);
              }}
              onDelete={handleDeleteNotice}
              onNewNotice={() => {
                setEditNoticeData({
                  title: "",
                  message: "",
                  date: new Date().toISOString().split("T")[0],
                  important: false,
                  link: "",
                });
                setNoticeDialogOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Database Card */}
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Database Seeding</h3>
                  <p className="text-xs text-muted-foreground">Reset or populate the database with mock records</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Clears out all existing B.Tech application documents in the Firestore database and uploads a pre-configured, clean dataset of 84 applicants for testing.
              </p>
              <Button
                onClick={handleUploadRealData}
                disabled={uploading}
                className="w-full shadow-sm"
              >
                {uploading ? "Uploading..." : "Upload Real Data"}
              </Button>
            </div>

            {/* Processing Card */}
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Allotment Calculations</h3>
                  <p className="text-xs text-muted-foreground">Run algorithms to allot students to branches</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Process registrations for the selected year and calculate seat assignments based on priorities, marks, experience, and reservations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleRunAllotment}
                  disabled={loadingAllotment}
                  className="flex-1 shadow-sm"
                >
                  {loadingAllotment ? "Running B.Tech..." : "Run B.Tech Allotment"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRunMtechAllotment}
                  disabled={loadingMtechAllotment}
                  className="flex-1 shadow-sm border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
                >
                  {loadingMtechAllotment ? "Running M.Tech..." : "Run M.Tech Allotment"}
                </Button>
              </div>
            </div>

            {/* Application Control Card */}
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-4 col-span-full">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Application Control</h3>
                  <p className="text-xs text-muted-foreground">Manage availability of program application forms</p>
                </div>
              </div>

              {/* B.Tech Status */}
              <div className="flex items-center justify-between p-4 border border-border/40 rounded-lg bg-muted/20">
                <div>
                  <h4 className="font-medium text-sm">B.Tech Application Form</h4>
                  <p className="text-xs text-muted-foreground">Status: <span className={`font-semibold ${btechStatus === "open" ? "text-emerald-500" : btechStatus === "closed" ? "text-red-500" : btechStatus === "spot" ? "text-violet-500" : "text-amber-500"}`}>{btechStatus === "open" ? "Open" : btechStatus === "closed" ? "Closed" : btechStatus === "spot" ? "Spot Admission Open" : "Coming Soon"}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={btechStatus === "coming" ? "default" : "outline"}
                    onClick={() => updateProgramStatus("btech", "coming")}
                    className={`shadow-sm text-xs ${btechStatus === "coming" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  >
                    Coming
                  </Button>
                  <Button
                    size="sm"
                    variant={btechStatus === "open" ? "default" : "outline"}
                    onClick={() => updateProgramStatus("btech", "open")}
                    className={`shadow-sm text-xs ${btechStatus === "open" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant={btechStatus === "spot" ? "default" : "outline"}
                    onClick={() => updateProgramStatus("btech", "spot")}
                    className={`shadow-sm text-xs ${btechStatus === "spot" ? "bg-violet-500 hover:bg-violet-600 text-white" : ""}`}
                  >
                    Spot
                  </Button>
                  <Button
                    size="sm"
                    variant={btechStatus === "closed" ? "default" : "outline"}
                    onClick={() => updateProgramStatus("btech", "closed")}
                    className={`shadow-sm text-xs ${btechStatus === "closed" ? "bg-red-500 hover:bg-red-600" : ""}`}
                  >
                    Closed
                  </Button>
                </div>
              </div>

              {/* M.Tech Status */}
              <div className="flex items-center justify-between p-4 border border-border/40 rounded-lg bg-muted/20">
                <div>
                  <h4 className="font-medium text-sm">M.Tech Application Form</h4>
                  <p className="text-xs text-muted-foreground">Status: <span className={`font-semibold ${mtechStatus === "open" ? "text-emerald-500" : mtechStatus === "closed" ? "text-red-500" : "text-amber-500"}`}>{mtechStatus === "open" ? "Open" : mtechStatus === "closed" ? "Closed" : "Coming Soon"}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={mtechStatus === "coming" ? "default" : "outline"}
                    onClick={() => updateProgramStatus("mtech", "coming")}
                    className={`shadow-sm text-xs ${mtechStatus === "coming" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  >
                    Coming
                  </Button>
                  <Button
                    size="sm"
                    variant={mtechStatus === "open" ? "default" : "outline"}
                    onClick={() => updateProgramStatus("mtech", "open")}
                    className={`shadow-sm text-xs ${mtechStatus === "open" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant={mtechStatus === "closed" ? "default" : "outline"}
                    onClick={() => updateProgramStatus("mtech", "closed")}
                    className={`shadow-sm text-xs ${mtechStatus === "closed" ? "bg-red-500 hover:bg-red-600" : ""}`}
                  >
                    Closed
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <NoticeDialog
        open={isNoticeDialogOpen}
        onOpenChange={setNoticeDialogOpen}
        notice={editNoticeData}
        onSave={handleSaveNotice}
        onChange={setEditNoticeData}
        isLoading={isLoading}
      />
    </div>
  );
}
