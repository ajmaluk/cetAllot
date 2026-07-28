import React, { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, X, Image as ImageIcon, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadToCloudinary } from "@/app/utils/cloudinaryUpload";
import { toast } from "sonner";

export const PaymentScreenshotUpload = ({ value, onChange, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(value || null);

  useEffect(() => {
    if (value) {
      setPreview(value);
    } else if (!uploading) {
      setPreview(null);
    }
  }, [value, uploading]);

  const handleFileChange = async (e) => {
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
    setUploading(true);

    try {
      const imageUrl = await uploadToCloudinary(file);
      setPreview(imageUrl);
      onChange(imageUrl);
      toast.success("Payment screenshot uploaded to Cloudinary!");
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.message || "Failed to upload image. Please try again.";
      setError(msg);
      toast.error("Upload failed: " + msg);
      setPreview(null);
      onChange("");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange("");
  };

  if (uploading) {
    return (
      <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-5 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">Uploading screenshot to Cloudinary...</p>
            <p className="text-xs text-muted-foreground">Please wait while your payment proof image is being uploaded.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeUrl = value || preview;

  return (
    <div className="space-y-3">
      {activeUrl && activeUrl.startsWith("http") ? (
        <div className="relative rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 transition-all">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-emerald-500/40 bg-card flex-shrink-0 shadow-sm">
                <img
                  src={activeUrl}
                  alt="Payment Screenshot Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Payment Screenshot Uploaded</span>
                </div>
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> View Full Image
                </a>
              </div>
            </div>

            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
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
              disabled={disabled || uploading}
            />

            <div className="flex flex-col items-center text-center gap-2 py-1">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-semibold text-primary hover:underline">
                  Click to upload payment screenshot
                </span>
                <span className="text-sm text-muted-foreground"> or drag & drop</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PNG, JPG, JPEG, WebP (Max 5MB)
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
