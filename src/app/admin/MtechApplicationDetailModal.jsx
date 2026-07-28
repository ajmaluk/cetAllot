import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  User,
  Mail,
  Phone,
  Hash,
  GraduationCap,
  BookOpen,
  Users,
  Briefcase,
  MapPin,
  Building,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { generateMtechPDF } from "../utils/generateMtechPDF";

const CopyTransactionButton = ({ transactionId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!transactionId) return;
    navigator.clipboard.writeText(transactionId);
    setCopied(true);
    toast.success(`Transaction ID (${transactionId}) copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={!transactionId}
      className="h-8 px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-all font-mono font-medium shadow-xs"
      title="Copy Transaction / UTR ID"
    >
      {copied ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-600 font-semibold">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span className="font-semibold">{transactionId || "No UTR"}</span>
        </>
      )}
    </Button>
  );
};

export const MtechApplicationDetailModal = ({ open, onClose, application }) => {
  const [updating, setUpdating] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  if (!application) return null;

  const currentStatus = application.status || "pending";

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "mtech_applications", application.id), {
        status: newStatus,
        updatedAt: new Date(),
      });

      const statusLabel = newStatus === "accepted" ? "Accepted and added to Applications" : "Rejected";
      toast.success(`Application marked as ${statusLabel}`);
      onClose();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </span>
        );
    }
  };

  const renderDetailItem = (label, value) => (
    <div className="space-y-1">
      <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-foreground block break-words">{value || "N/A"}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-5xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-6 md:p-8 rounded-2xl border shadow-2xl">
        <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-3">
          <div>
            <DialogTitle className="text-xl md:text-2xl font-bold flex flex-wrap items-center gap-3">
              Application Details
              {getStatusBadge(currentStatus)}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Application ID: <span className="font-mono font-medium text-foreground">{application.id}</span>
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Screenshot & Fee Details Banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-primary/10 pb-3">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <Banknote className="h-5 w-5" /> Payment Verification
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction / UTR ID:</span>
                <CopyTransactionButton transactionId={application.transactionId} />
              </div>
            </div>

            {application.paymentScreenshotUrl ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-xs">
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setImageModalOpen(true)}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-all bg-muted flex-shrink-0 group shadow-xs"
                  >
                    <img
                      src={application.paymentScreenshotUrl}
                      alt="Payment Screenshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold transition-opacity gap-1 p-1 text-center">
                      <ExternalLink className="w-4 h-4" /> Click to Zoom
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Payment Proof Screenshot Uploaded</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verify transaction details with candidate bank transfer statement.
                    </p>
                    <div className="pt-1">
                      <a
                        href={application.paymentScreenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Full Resolution Image
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                <span>No payment screenshot image uploaded for this application.</span>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2.5">
                <User className="h-4 w-4 text-primary" /> Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {renderDetailItem("Full Name", application.name)}
                {renderDetailItem("Email", application.email)}
                {renderDetailItem("Phone", application.phone)}
                {renderDetailItem("Aadhaar Number", application.adharNumber)}
              </div>
            </div>

            {/* Qualifying Degree Details */}
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2.5">
                <GraduationCap className="h-4 w-4 text-primary" /> Qualifying Degree Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {renderDetailItem("B.Tech Branch", application.btechDegree)}
                {renderDetailItem("Marks %", `${application.btechMark}%`)}
                {renderDetailItem("Year of Passing", application.btechYear)}
                {renderDetailItem("College", application.btechCollege)}
                {renderDetailItem("University", application.btechUniversity)}
              </div>
            </div>

            {/* Specialization Preference */}
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2.5">
                <BookOpen className="h-4 w-4 text-primary" /> M.Tech Preference
              </h4>
              <div>
                {renderDetailItem("Preferred Specialization", application.specialization)}
              </div>
            </div>

            {/* Demographics */}
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2.5">
                <Users className="h-4 w-4 text-primary" /> Demographic Details
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {renderDetailItem("Religion", application.religion)}
                {renderDetailItem("Caste", application.caste)}
                {renderDetailItem("Category", application.reservationCategory || application.category)}
              </div>
            </div>

            {/* Professional Details */}
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4 md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2.5">
                <Briefcase className="h-4 w-4 text-primary" /> Professional & Contact Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderDetailItem("Current Company", application.company)}
                {renderDetailItem("Experience (Years)", application.experience)}
                {renderDetailItem("Distance (KM)", application.distance ? `${application.distance} KM` : "N/A")}
                {renderDetailItem("Age", application.age)}
                <div className="col-span-full pt-1">
                  {renderDetailItem("Address", application.address)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-2">
          <Button
            variant="outline"
            onClick={() => generateMtechPDF(application)}
            className="flex-1 sm:flex-none font-semibold"
          >
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>

          <div className="flex-1 flex flex-wrap gap-2 justify-end">
            {currentStatus !== "accepted" && (
              <Button
                onClick={() => handleStatusChange("accepted")}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-1 sm:flex-none"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                Accept & Add to Applications
              </Button>
            )}

            {currentStatus !== "rejected" && (
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("rejected")}
                disabled={updating}
                className="font-semibold flex-1 sm:flex-none"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                Reject Application
              </Button>
            )}

            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>

        {/* Image Preview Sub-Modal */}
        {imageModalOpen && (
          <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
            <DialogContent className="sm:max-w-4xl p-4 flex flex-col items-center">
              <img
                src={application.paymentScreenshotUrl}
                alt="Payment Screenshot Full"
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-md"
              />
              <Button variant="outline" size="sm" onClick={() => setImageModalOpen(false)} className="mt-4">
                Close Preview
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MtechApplicationDetailModal;
