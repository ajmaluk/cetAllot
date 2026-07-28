import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  Download,
  Loader2,
  Trash2,
  PlusCircle,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ImageIcon,
} from "lucide-react";
import MtechApplicationModal from "./MtechApplicationModal";
import MtechApplicationDetailModal from "./MtechApplicationDetailModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const MtechApplicationTable = ({
  searchTerm,
  setSearchTerm,
  isLoading,
  onNewApplication,
  yearFilter,
  setYearFilter,
}) => {
  const [applications, setApplications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "accepted" | "rejected" | "all"
  const [localYearFilter, setLocalYearFilter] = useState("2026");

  const activeYearFilter = yearFilter !== undefined ? yearFilter : localYearFilter;
  const activeSetYearFilter = setYearFilter !== undefined ? setYearFilter : setLocalYearFilter;

  useEffect(() => {
    const q = query(collection(db, "mtech_applications"), orderBy("submittedAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateDoc(doc(db, "mtech_applications", appId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      const label = newStatus === "accepted" ? "Accepted and added to Applications" : "Rejected";
      toast.success(`Application ${label}`);
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteDoc(doc(db, "mtech_applications", id));
      toast.success("Application deleted successfully");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL M.Tech applications? This cannot be undone.")) return;
    try {
      const batch = applications.map((app) => deleteDoc(doc(db, "mtech_applications", app.id)));
      await Promise.all(batch);
      toast.success("All M.Tech applications deleted successfully");
    } catch (error) {
      console.error("Error deleting all applications:", error);
      toast.error("Failed to delete all applications");
    }
  };

  const handleNewApplication = (data) => {
    onNewApplication?.(data);
    setIsModalOpen(false);
  };

  const handleViewDetail = (app) => {
    setSelectedAppForDetail(app);
    setIsDetailModalOpen(true);
  };

  const getAppYear = (app) => {
    if (!app.submittedAt) return 2025;
    try {
      const date = app.submittedAt.toDate ? app.submittedAt.toDate() : new Date(app.submittedAt);
      return date.getFullYear();
    } catch {
      return 2025;
    }
  };

  // Counts by status
  const pendingCount = applications.filter(app => !app.status || app.status === "pending").length;
  const acceptedCount = applications.filter(app => app.status === "accepted").length;
  const rejectedCount = applications.filter(app => app.status === "rejected").length;

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const appYear = getAppYear(app);
    const matchesYear = activeYearFilter === "all" || String(appYear) === activeYearFilter;

    const appStatus = app.status || "pending";
    let matchesTab = true;
    if (activeTab === "pending") {
      matchesTab = appStatus === "pending";
    } else if (activeTab === "accepted") {
      matchesTab = appStatus === "accepted";
    } else if (activeTab === "rejected") {
      matchesTab = appStatus === "rejected";
    }

    return matchesSearch && matchesYear && matchesTab;
  });

  const onExport = () => {
    const exportData = filteredApps.map((app) => ({
      Status: app.status || "pending",
      Name: app.name,
      Email: app.email,
      Phone: app.phone,
      "B.Tech Degree": app.btechDegree,
      "B.Tech Mark": app.btechMark,
      Specialization: app.specialization,
      Experience: app.experience,
      Distance: app.distance,
      Caste: app.caste,
      Religion: app.religion,
      Category: app.reservationCategory,
      "Transaction ID": app.transactionId,
      "Payment Screenshot URL": app.paymentScreenshotUrl || "N/A",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "M.Tech Applications");
    XLSX.writeFile(workbook, `Mtech_Applications_${activeTab}.xlsx`);
  };

  const renderStatusBadge = (status) => {
    const st = status || "pending";
    if (st === "accepted") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Accepted
        </span>
      );
    }
    if (st === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
          <XCircle className="w-3 h-3 text-red-600" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        <Clock className="w-3 h-3 text-amber-600" /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs for Application Workflow */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-muted/60 p-1 flex-wrap h-auto">
            <TabsTrigger value="pending" className="px-4 py-2 text-xs md:text-sm font-semibold">
              <Clock className="w-4 h-4 mr-1.5 text-amber-500" />
              Pending Review
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {pendingCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="px-4 py-2 text-xs md:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
              Applications (Accepted)
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {acceptedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="px-4 py-2 text-xs md:text-sm font-semibold">
              <XCircle className="w-4 h-4 mr-1.5 text-red-500" />
              Rejected Section
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                {rejectedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all" className="px-4 py-2 text-xs md:text-sm font-semibold">
              All Submissions
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-muted-foreground/20">
                {applications.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Header Controls & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search M.Tech applications by name, email, UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              type="search"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Year:</span>
            <Select value={activeYearFilter} onValueChange={activeSetYearFilter}>
              <SelectTrigger className="w-[120px] h-10 text-sm">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end items-center">
          <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading} className="shadow-sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={isLoading || applications.length === 0} className="shadow-sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="shadow-sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Main Applications Table */}
      <div className="table-container border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-primary">
            <TableRow>
              {[
                "No.", "Status", "Name", "B.Tech Degree", "Mark %", "Specialization",
                "Phone", "Payment Screenshot", "Transaction ID", "Actions",
              ].map((title, i) => (
                <TableHead
                  key={i}
                  className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap"
                >
                  {title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40 bg-card">
            {filteredApps.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  <p className="text-base font-medium">No applications found in this section.</p>
                  <p className="text-xs text-muted-foreground mt-1">Try switching tabs or adjusting search criteria.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredApps.map((app, index) => {
              const currentStatus = app.status || "pending";

              return (
                <TableRow
                  key={app.id}
                  className="hover:bg-muted/30 even:bg-muted/10 transition-colors"
                >
                  <TableCell className="px-4 py-3 font-medium text-sm whitespace-nowrap">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{renderStatusBadge(currentStatus)}</TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold whitespace-nowrap">{app.name}</TableCell>
                  <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{app.btechDegree}</TableCell>
                  <TableCell className="px-4 py-3 text-sm whitespace-nowrap font-medium">{app.btechMark}%</TableCell>
                  <TableCell className="px-4 py-3 text-sm whitespace-nowrap max-w-[200px] truncate" title={app.specialization}>
                    {app.specialization}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{app.phone}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    {app.paymentScreenshotUrl ? (
                      <a
                        href={app.paymentScreenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> View Image
                      </a>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">No Image</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm whitespace-nowrap font-mono text-xs">
                    {app.transactionId}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Overlay Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(app)}
                        className="h-8 px-2.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                        title="View Full Details Overlay"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>

                      {/* Accept Button */}
                      {currentStatus !== "accepted" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(app.id, "accepted")}
                          className="h-8 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="Accept & Add to Applications"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept
                        </Button>
                      )}

                      {/* Reject Button */}
                      {currentStatus !== "rejected" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(app.id, "rejected")}
                          className="h-8 px-2.5 text-xs font-semibold"
                          title="Reject Application"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      )}

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(app.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* New Application Form Modal */}
      <MtechApplicationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewApplication}
      />

      {/* Application Detail View Overlay */}
      <MtechApplicationDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        application={selectedAppForDetail}
      />
    </div>
  );
};

export default MtechApplicationTable;
