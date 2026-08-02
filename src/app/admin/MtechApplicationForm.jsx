import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { generateMtechPDF } from "../utils/generateMtechPDF";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/Form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  User,
  Mail,
  Phone,
  Hash,
  Users,
  BookOpen,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  FileText,
  GraduationCap,
  Percent,
  Banknote,
  Copy,
  ArrowLeft,
  Download,
  Check,
} from "lucide-react";

import { db } from "@/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { PaymentScreenshotUpload } from "@/components/PaymentScreenshotUpload";
import { uploadToCloudinary } from "@/app/utils/cloudinaryUpload";

const FormSchema = z.object({
  adharNumber: z.string().min(1, "Aadhaar number is required").regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits and only numbers"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").regex(/^\d{10}$/, "Phone number must be exactly 10 digits and only numbers"),
  caste: z.string().min(1, "Caste is required"),
  religion: z.string().min(1, "Religion is required"),
  reservationCategory: z.string().min(1, "Reservation Category is required"),
  btechDegree: z.string().min(1, "B.Tech degree is required"),
  btechMark: z.string().min(1, "B.Tech / Other Qualifying Exam marks are required").refine(val => /^\d+(\.\d+)?$/.test(val), "Marks must be a valid number"),
  btechCollege: z.string().min(1, "College name is required"),
  btechUniversity: z.string().min(1, "University is required"),
  btechYear: z.string().min(1, "Year of passing is required"),
  specialization: z.string().min(1, "Specialization is required"),
  company: z.string().min(1, "Current Company is required"),
  experience: z.string().min(1, "Work experience is required").refine(val => /^\d+(\.\d+)?$/.test(val), "Experience must be a valid number"),
  distance: z.string().min(1, "Distance is required").refine(val => /^\d+(\.\d+)?$/.test(val), "Distance must be a valid number").refine(val => parseFloat(val) <= 75, "Distance must be 75 km or less (not eligible if greater)"),
  address: z.string().min(1, "Address is required"),
  age: z.string().min(1, "Age is required").refine(val => /^\d+$/.test(val), "Age must be a valid number"),
  transactionId: z.string().min(1, "Transaction ID is required"),
  paymentScreenshotUrl: z.any().refine((val) => {
    if (!val) return false;
    if (typeof val === "string" && val.length > 0) return true;
    if (typeof val === "object" && (val.file || val.previewUrl)) return true;
    return false;
  }, "Payment screenshot upload is required"),
}).superRefine((data, ctx) => {
  const parsedMark = parseFloat(data.btechMark);
  const category = data.reservationCategory;
  const isSCST = category === "SC" || category === "ST";
  const sebcCategories = [
    "Ezhava", "Muslim", "Other Backward Hindu", "Latin Catholic and Anglo Indian", 
    "Dheevara", "Viswakarma", "Kusavan", "OBC Christian", "Kudumbi"
  ];
  const isSEBC = sebcCategories.includes(category);
  
  let minMark = 60;
  if (isSCST) {
    minMark = 0;
  } else if (isSEBC) {
    minMark = 55;
  }

  if (!isNaN(parsedMark) && parsedMark < minMark) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `B.Tech / Other Qualifying Exam marks must be ${minMark}% or greater for ${category} category`,
      path: ["btechMark"],
    });
  }
});

const initialFormData = {
  adharNumber: "",
  name: "",
  email: "",
  phone: "",
  caste: "",
  religion: "",
  reservationCategory: "",
  btechDegree: "",
  btechMark: "",
  btechCollege: "",
  btechUniversity: "",
  btechYear: "",
  specialization: "",
  company: "",
  experience: "",
  distance: "",
  address: "",
  age: "",
  transactionId: "",
  paymentScreenshotUrl: "",
};

const getFirstErrorMessage = (errors) => {
  for (const key in errors) {
    if (!errors[key]) continue;
    if (typeof errors[key]?.message === "string") {
      return errors[key].message;
    }
    if (typeof errors[key] === "object") {
      const nestedMessage = getFirstErrorMessage(errors[key]);
      if (nestedMessage) return nestedMessage;
    }
  }
  return null;
};

const onError = (errors) => {
  const message = getFirstErrorMessage(errors) || "Please correct the errors and try again.";
  toast.error("Submission Failed", { description: message });
};

const FormSection = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-5 p-4 sm:p-6 rounded-2xl bg-muted/20 border border-border/40"
  >
    <div className="flex items-center gap-3 pb-3 border-b border-border/30">
      <div className="p-2 rounded-lg bg-primary/5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
    <div className="space-y-5">{children}</div>
  </motion.div>
);

const CopyableDetail = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-gray-800/90 border border-border/70 shadow-2xs hover:border-primary/40 transition-all">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">{label}</span>
        <span className="font-mono text-base sm:text-lg font-extrabold text-foreground tracking-wider truncate">
          {value}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="h-8.5 px-3 text-xs flex-shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-medium shadow-2xs"
        title={`Copy ${label}`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-600 font-semibold">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span className="font-semibold">Copy</span>
          </>
        )}
      </Button>
    </div>
  );
};

const required = (label) => (
  <span>
    {label} <span className="text-red-500">*</span>
  </span>
);

export const MtechApplicationForm = ({ onSuccess }) => {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: initialFormData,
    mode: "onChange",
  });

  const [step, setStep] = useState("fill"); // "fill" | "review" | "success"
  const [submittedData, setSubmittedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReviewData = (data) => {
    setSubmittedData(data);
    setStep("review");
  };

  const confirmAndSubmit = async () => {
    if (!submittedData) return;
    setIsSubmitting(true);
    let toastId = null;

    try {
      let cloudinaryUrl = "";
      const paymentData = submittedData.paymentScreenshotUrl;

      if (paymentData && paymentData.file instanceof File) {
        toastId = toast.loading("Uploading payment screenshot to Cloudinary...");
        cloudinaryUrl = await uploadToCloudinary(paymentData.file);
        if (toastId) toast.dismiss(toastId);
      } else if (typeof paymentData === "string") {
        cloudinaryUrl = paymentData;
      } else if (paymentData?.previewUrl && paymentData.previewUrl.startsWith("http")) {
        cloudinaryUrl = paymentData.previewUrl;
      }

      if (!cloudinaryUrl && paymentData) {
        throw new Error("Invalid image or upload failed.");
      }

      const formattedData = {
        ...submittedData,
        status: "pending",
        paymentScreenshotUrl: cloudinaryUrl,
        age: submittedData.age ? Number(submittedData.age) : null,
        experience: submittedData.experience ? Number(submittedData.experience) : null,
        btechMark: Number(submittedData.btechMark),
        distance: submittedData.distance ? Number(submittedData.distance) : null,
        category: submittedData.reservationCategory,
        degreeType: "mtech",
        submittedAt: Timestamp.now(),
      };

      await addDoc(collection(db, "mtech_applications"), formattedData);

      toast.success("Submitted!", {
        duration: 4000,
        description: "We've received your M.Tech application.",
      });

      onSuccess?.();
      setStep("success");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("Error submitting form:", error);
      toast.error("Submission failed!", {
        description: error.message || "Please try again later or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInputField = ({ name, label, type = "text", step, maxLength, icon: Icon, placeholder }) => (
    <FormField
      key={name}
      name={name}
      render={({ field, fieldState, fieldId }) => (
        <FormItem>
          <div className="flex justify-between items-baseline">
            <FormLabel htmlFor={fieldId}>{label}</FormLabel>
            {maxLength && (
              <span className="text-[11px] font-mono text-muted-foreground select-none">
                {String(field.value || "").length}/{maxLength}
              </span>
            )}
          </div>
          <FormControl>
            <div className="relative">
              {Icon && (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                id={fieldId}
                {...field}
                type={type}
                step={step}
                maxLength={maxLength}
                placeholder={placeholder}
                className={`${Icon ? "pl-10" : ""} ${
                  fieldState.invalid ? "border-red-500 ring-red-500/20" : ""
                }`}
              />
            </div>
          </FormControl>
          <FormMessage fieldState={fieldState} />
        </FormItem>
      )}
    />
  );

  const renderSelectField = ({ name, label, placeholder, options }) => (
    <FormField
      key={name}
      name={name}
      render={({ field, fieldState, fieldId }) => (
        <FormItem>
          <FormLabel htmlFor={fieldId}>{label}</FormLabel>
          <FormControl>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={fieldId}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage fieldState={fieldState} />
        </FormItem>
      )}
    />
  );

  const renderReviewItem = (label, value) => (
    <div className="border-b border-border/40 pb-2">
      <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || "N/A"}</span>
    </div>
  );

  if (step === "review") {
    return (
      <div className="space-y-8">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-foreground">Confirm M.Tech Application Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Please review your entered details carefully before final submission.
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="p-6 rounded-xl bg-muted/20 border border-border/40 space-y-4">
            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderReviewItem("Full Name", submittedData.name)}
              {renderReviewItem("Email Address", submittedData.email)}
              {renderReviewItem("Phone Number", submittedData.phone)}
              {renderReviewItem("Aadhaar Number", submittedData.adharNumber)}
            </div>
          </div>

          {/* B.Tech / Qualifying Degree Details */}
          <div className="p-6 rounded-xl bg-muted/20 border border-border/40 space-y-4">
            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> B.Tech / Qualifying Degree Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderReviewItem("B.Tech Degree Branch", submittedData.btechDegree)}
              {renderReviewItem("B.Tech / Other Qualifying Exam Marks %", `${submittedData.btechMark}%`)}
              {renderReviewItem("College Name", submittedData.btechCollege)}
              {renderReviewItem("University", submittedData.btechUniversity)}
              {renderReviewItem("Year of Passing", submittedData.btechYear)}
            </div>
          </div>

          {/* M.Tech Preference */}
          <div className="p-6 rounded-xl bg-muted/20 border border-border/40 space-y-4">
            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> M.Tech Specialization Preference
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {renderReviewItem("Preferred Specialization", submittedData.specialization)}
            </div>
          </div>

          {/* Demographic Details */}
          <div className="p-6 rounded-xl bg-muted/20 border border-border/40 space-y-4">
            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
              <Users className="h-4 w-4" /> Demographic Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderReviewItem("Religion", submittedData.religion)}
              {renderReviewItem("Caste", submittedData.caste)}
              {renderReviewItem("Reservation Category", submittedData.reservationCategory)}
            </div>
          </div>

          {/* Professional Details */}
          <div className="p-6 rounded-xl bg-muted/20 border border-border/40 space-y-4">
            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderReviewItem("Current Company", submittedData.company)}
              {renderReviewItem("Work Experience (years)", submittedData.experience)}
              {renderReviewItem("Distance in KM", submittedData.distance ? `${submittedData.distance} KM` : "N/A")}
              {renderReviewItem("Age", submittedData.age)}
              <div className="col-span-full">
                {renderReviewItem("Address", submittedData.address)}
              </div>
            </div>
          </div>

          {/* Fee details */}
          <div className="p-6 rounded-xl bg-muted/20 border border-border/40 space-y-4">
            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Registration Fee Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderReviewItem("Transaction / UTR ID", submittedData.transactionId)}
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Payment Screenshot
                </span>
                {submittedData.paymentScreenshotUrl ? (
                  <div className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                    <img
                      src={
                        typeof submittedData.paymentScreenshotUrl === "object"
                          ? submittedData.paymentScreenshotUrl.previewUrl
                          : submittedData.paymentScreenshotUrl
                      }
                      alt="Payment Screenshot"
                      className="w-12 h-12 rounded object-cover border"
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      Selected (Will upload on submit)
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-red-500 font-medium">Not Uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("fill")}
            disabled={isSubmitting}
            className="flex-1 h-12 text-base font-semibold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Edit Details
          </Button>
          <Button
            type="button"
            onClick={confirmAndSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 text-base font-semibold"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting...
              </span>
            ) : (
              "Confirm & Submit Application"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 mb-2">
          <Check className="h-10 w-10 stroke-[3]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Application Submitted!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your application for M.Tech (Working Professionals) Admission 2026-27 has been successfully registered.
          </p>
        </div>

        <div className="max-w-md mx-auto p-5 rounded-xl border border-border bg-muted/10 space-y-4">
          <p className="text-xs text-muted-foreground">
            A confirmation email has been sent to <strong className="text-foreground">{submittedData?.email}</strong>. Please download and keep a copy of your application form for verification during admissions.
          </p>
          <Button
            onClick={() => generateMtechPDF(submittedData)}
            className="w-full h-11 font-semibold flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" /> Download Application PDF
          </Button>
        </div>

        <div className="pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              form.reset(initialFormData);
              setSubmittedData(null);
              setStep("fill");
            }}
            className="text-primary hover:text-primary-foreground font-semibold"
          >
            Submit Another Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleReviewData, onError)} className="space-y-8">
        {/* Personal Information */}
        <FormSection title="Personal Information" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInputField({ name: "name", label: required("Full Name"), icon: User, placeholder: "e.g. AJMAL UK" })}
            {renderInputField({ name: "email", label: required("Email Address"), type: "email", icon: Mail, placeholder: "e.g. ajmal@example.com" })}
            {renderInputField({ name: "phone", label: required("Phone Number (with WhatsApp)"), type: "tel", maxLength: 10, icon: Phone, placeholder: "e.g. 9876543210" })}
            {renderInputField({ name: "adharNumber", label: required("Aadhaar Number"), maxLength: 12, icon: Hash, placeholder: "e.g. 123456789012" })}
          </div>
        </FormSection>

        {/* Academic Details */}
        <FormSection title="B.Tech / Qualifying Degree Details" icon={GraduationCap}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderSelectField({
              name: "btechDegree",
              label: required("B.Tech Degree Branch"),
              placeholder: "Select your degree branch",
              options: ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering"],
            })}
            {renderInputField({
              name: "btechMark",
              label: required("B.Tech / Other Qualifying Exam Marks %"),
              type: "number",
              step: "0.01",
              icon: Percent,
              placeholder: "e.g. 72.5",
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {renderInputField({ name: "btechCollege", label: required("College Name"), icon: Building, placeholder: "e.g. College of Engineering Trivandrum" })}
            {renderInputField({ name: "btechUniversity", label: required("University"), icon: BookOpen, placeholder: "e.g. APJ Abdul Kalam University" })}
            {renderInputField({ name: "btechYear", label: required("Year of Passing"), type: "number", icon: Calendar, placeholder: "e.g. 2020" })}
          </div>
        </FormSection>

        {/* Specialization */}
        <FormSection title="M.Tech Specialization Preference" icon={BookOpen}>
          <p className="text-sm text-muted-foreground -mt-2">
            Select your preferred specialization based on your B.Tech degree.
          </p>
          {renderSelectField({
            name: "specialization",
            label: required("Preferred Specialization"),
            placeholder: "Select specialization",
            options: [
              "Control Systems (Electrical Engineering)",
              "Thermal Science (Mechanical Engineering)",
              "Traffic & Transportation Engineering (Civil Engineering)",
            ],
          })}
        </FormSection>

        {/* Demographic Details */}
        <FormSection title="Demographic Details" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {renderSelectField({
              name: "religion",
              label: required("Religion"),
              placeholder: "Select your religion",
              options: ["Hindu", "Muslim/Islam", "Christian", "Other"],
            })}
            {renderSelectField({
              name: "caste",
              label: required("Caste"),
              placeholder: "Select your caste",
              options: [
                "Latin Catholic", "Roman Catholic", "Orthodox Syrian",
                "Jacobite Syrian", "Marthoma", "Dalit Christian",
                "Mappila", "Islam",
                "Nair", "Ezhava", "Nadar", "Viswakarma", "Thiyya",
                "Pulaya", "Cheramar", "Panan", "Velan", "Chakyar",
                "Brahmin", "Others",
              ],
            })}
            {renderSelectField({
              name: "reservationCategory",
              label: required("Reservation Category"),
              placeholder: "Select your category",
              options: [
                "EWS", "Ezhava", "Muslim", "Other Backward Hindu",
                "Latin Catholic and Anglo Indian", "Dheevara", "Viswakarma",
                "Kusavan", "OBC Christian", "Kudumbi", "SC", "ST",
                "Physically Disabled", "Transgender", "Sports",
                "DTE Staff", "Central govt. employee", "General",
              ],
            })}
          </div>
        </FormSection>

        {/* Professional Details */}
        <FormSection title="Professional Details" icon={Briefcase}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInputField({ name: "company", label: required("Current Company / Organization"), icon: Building, placeholder: "e.g. Infosys Ltd." })}
            {renderInputField({ name: "experience", label: required("Work Experience (years)"), type: "number", icon: Calendar, placeholder: "e.g. 3" })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInputField({ name: "distance", label: required("Distance in KM (workplace to CET)"), type: "number", icon: MapPin, placeholder: "e.g. 25" })}
            {renderInputField({ name: "age", label: required("Age"), type: "number", icon: Calendar, placeholder: "e.g. 28" })}
          </div>
          {renderInputField({ name: "address", label: required("Address"), icon: Building, placeholder: "e.g. House No, Street, City, PIN" })}
        </FormSection>

        {/* Registration Fee & Payment */}
        <FormSection title="Registration Fee Payment" icon={Banknote}>
          <div className="rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-4 sm:p-5 mb-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Application Fee Information</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>General / Others: <strong>₹1,000</strong></li>
              <li>SC / ST: <strong>₹500</strong></li>
            </ul>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Fee is non-refundable. Pay via online bank transfer / NEFT / IMPS / UPI and enter the transaction ID below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-muted/30 p-4 sm:p-5 border border-border/50 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  Bank Account Details
                </h4>
                <div className="space-y-3">
                  <CopyableDetail label="College Bank Account No." value="67372082824" />
                  <CopyableDetail label="IFSC Code" value="SBIN0070268" />
                  <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-gray-800/90 border border-border/70 text-xs sm:text-sm space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-muted-foreground font-medium">Bank & Branch:</span>
                      <span className="font-semibold text-foreground">State Bank of India, Engineering College Branch</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-muted-foreground font-medium">Account Name:</span>
                      <span className="font-semibold text-foreground">CET WP Admission</span>
                    </div>
                    <div className="border-t border-border/40 pt-2 flex justify-between items-center text-sm">
                      <span className="font-semibold text-foreground">Fee Amount:</span>
                      <span className="font-bold text-primary text-base">₹1,000 / ₹500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {renderInputField({
                name: "transactionId",
                label: required("Transaction / UTR ID"),
                icon: FileText,
                placeholder: "e.g. SBIY22XXXXXXXXXXXXXXXXXXXXX or UTR number",
              })}
              <p className="text-xs text-muted-foreground">
                Enter the transaction ID or UTR number after transferring the payment.
              </p>

              <FormField
                name="paymentScreenshotUrl"
                render={({ field, fieldState }) => (
                  <FormItem className="pt-2">
                    <FormLabel>{required("Upload Payment Screenshot")}</FormLabel>
                    <FormControl>
                      <PaymentScreenshotUpload
                        value={field.value}
                        onChange={field.onChange}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage fieldState={fieldState} />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </FormSection>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Please review carefully:</strong> Once submitted, editing will not be possible.
              Ensure all details are accurate and complete before submitting.
            </p>
          </div>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg"
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting...
              </span>
            ) : (
              "Submit M.Tech Application"
            )}
          </Button>
        </motion.div>
      </form>
    </FormProvider>
  );
};
