import { supabase } from "./supabase";

type ResourceType = "image" | "video" | "auto";

interface UploadMediaOptions {
  bucket: string;
  folder: string;
  file: File | Blob;
  fileName: string;
  contentType?: string;
  resourceType?: ResourceType;
}

interface UploadMediaResult {
  url: string;
  provider: "cloudinary" | "supabase";
}

interface DeleteMediaOptions {
  bucket: string;
  url: string;
}

interface DeleteMediaResult {
  deleted: boolean;
  warning?: string;
}

const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const cloudinaryBaseFolder = import.meta.env.VITE_CLOUDINARY_FOLDER;
const hasPartialCloudinaryConfig = Boolean(
  cloudinaryCloudName || cloudinaryUploadPreset,
);

export const isCloudinaryUploadEnabled = Boolean(
  cloudinaryCloudName && cloudinaryUploadPreset,
);

export function isCloudinaryUrl(url: string) {
  return url.includes("res.cloudinary.com/");
}

export function getDisplayImageUrl(url: string) {
  if (!isCloudinaryUrl(url) || !url.includes("/image/upload/")) return url;
  if (url.includes("/image/upload/f_auto,q_auto/")) return url;

  return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

function cleanPathPart(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function getCloudinaryFolder(folder: string) {
  const cleanFolder = cleanPathPart(folder);
  const cleanBase = cloudinaryBaseFolder
    ? cleanPathPart(cloudinaryBaseFolder)
    : "";
  return [cleanBase, cleanFolder].filter(Boolean).join("/");
}

function getSupabaseStoragePath(url: string, bucket: string) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function uploadToCloudinary({
  folder,
  file,
  fileName,
  resourceType = "auto",
}: UploadMediaOptions): Promise<UploadMediaResult> {
  if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
    throw new Error("Cloudinary upload settings are missing.");
  }

  const formData = new FormData();
  formData.append("file", file, fileName);
  formData.append("upload_preset", cloudinaryUploadPreset);

  const cloudinaryFolder = getCloudinaryFolder(folder);
  if (cloudinaryFolder) formData.append("folder", cloudinaryFolder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed.");
  }
  if (typeof data?.secure_url !== "string" || !data.secure_url) {
    throw new Error("Cloudinary upload succeeded but did not return a URL.");
  }

  const uploadedUrl = data.secure_url;
  const displayUrl =
    resourceType === "image" || data?.resource_type === "image"
      ? getDisplayImageUrl(uploadedUrl)
      : uploadedUrl;

  return {
    url: displayUrl,
    provider: "cloudinary",
  };
}

async function uploadToSupabase({
  bucket,
  folder,
  file,
  fileName,
  contentType,
}: UploadMediaOptions): Promise<UploadMediaResult> {
  const storagePath = [cleanPathPart(folder), cleanPathPart(fileName)]
    .filter(Boolean)
    .join("/");
  const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return {
    url: data.publicUrl,
    provider: "supabase",
  };
}

export async function uploadMedia(
  options: UploadMediaOptions,
): Promise<UploadMediaResult> {
  if (isCloudinaryUploadEnabled) {
    return uploadToCloudinary(options);
  }

  if (hasPartialCloudinaryConfig) {
    throw new Error(
      "Cloudinary is only partly configured. Set both VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET, or remove both to use Supabase Storage.",
    );
  }

  return uploadToSupabase(options);
}

export async function deleteMedia({
  bucket,
  url,
}: DeleteMediaOptions): Promise<DeleteMediaResult> {
  if (!url) return { deleted: false };

  if (isCloudinaryUrl(url)) {
    const { data, error } = await supabase.functions.invoke<DeleteMediaResult>(
      "cloudinary-delete",
      { body: { url } },
    );

    if (error) {
      return {
        deleted: false,
        warning: `Cloudinary file was not deleted: ${error.message}`,
      };
    }

    return data ?? { deleted: true };
  }

  const storagePath = getSupabaseStoragePath(url, bucket);
  if (!storagePath) return { deleted: false };

  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) {
    return {
      deleted: false,
      warning: `Supabase file was not deleted: ${error.message}`,
    };
  }

  return { deleted: true };
}
