/**
 * Utility function to upload images to Cloudinary
 * Cloud Name: j7vm5rp1
 * API Key: 273696517834669
 * Presets: 'payments' (or fallback 'pays')
 */

export const uploadToCloudinary = async (file, onProgress) => {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  // Support presets 'payments' and fallback 'pays'
  const presets = ["payments", "pays"];
  let lastError = null;

  for (const preset of presets) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      formData.append("api_key", "273696517834669");

      const response = await fetch("https://api.cloudinary.com/v1_1/j7vm5rp1/image/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && (data.secure_url || data.url)) {
        return data.secure_url || data.url;
      }

      // If preset error, try next preset
      if (data.error?.message?.toLowerCase().includes("preset")) {
        lastError = new Error(data.error.message);
        continue;
      }

      // Other error
      throw new Error(data.error?.message || "Failed to upload image to Cloudinary");
    } catch (err) {
      lastError = err;
      if (!err.message?.toLowerCase().includes("preset")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to upload image to Cloudinary with available presets.");
};
