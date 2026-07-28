import React, { useState } from "react";
import { UploadCloud, CheckCircle2, X, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export const PaymentScreenshotUpload = ({ value, onChange, disabled }) => {
  const [error, setError] = useState(null);

  const getDisplayUrl = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") return val.previewUrl || null;
    return null;
  };

  const previewUrl = getDisplayUrl(value);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const msg = "Please select a valid image file (PNG, JPG, JPEG, WebP)";
      setError(msg);
      toast.error(msg);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const msg = "File size should be less than 5MB";
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    const localPreview = URL.createObjectURL(file);
    onChange({ file, previewUrl: localPreview });
    toast.success("Payment screenshot selected! It will be uploaded to Cloudinary upon submission.");
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 transition-all">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-emerald-500/40 bg-card flex-shrink-0 shadow-sm">
                <img
                  src={previewUrl}
                  alt="Payment Screenshot Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Payment Proof Selected</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Will upload to Cloudinary automatically on form submission.
                </p>
                {previewUrl.startsWith("http") && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> View Full Image
                  </a>
                )}
              </div>
            </div>

            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200"
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <label
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              disabled
                ? "bg-muted cursor-not-allowed border-border"
                : error
                ? "border-red-400 bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/60"
                : "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />

            <div className="flex flex-col items-center text-center gap-2 py-1">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-semibold text-primary hover:underline">
                  Click to select payment screenshot
                </span>
                <span className="text-sm text-muted-foreground"> or drag & drop</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PNG, JPG, JPEG, WebP (Max 5MB) • Uploads to Cloudinary on Submit
              </p>
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
