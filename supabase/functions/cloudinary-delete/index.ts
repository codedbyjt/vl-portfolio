/// <reference path="../deno.d.ts" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const transformationPrefixes = new Set([
  "a",
  "ar",
  "b",
  "bo",
  "c",
  "co",
  "d",
  "e",
  "f",
  "fl",
  "g",
  "h",
  "l",
  "o",
  "q",
  "r",
  "t",
  "u",
  "w",
  "x",
  "y",
  "z",
]);

function isLikelyTransformation(segment: string) {
  return segment.split(",").every((part) => {
    const [prefix] = part.split("_");
    return transformationPrefixes.has(prefix);
  });
}

function parseCloudinaryUrl(url: string) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex < 1) throw new Error("Unsupported Cloudinary URL.");

  const resourceType = parts[uploadIndex - 1];
  if (!["image", "video", "raw"].includes(resourceType)) {
    throw new Error("Unsupported Cloudinary resource type.");
  }

  const assetParts = parts.slice(uploadIndex + 1);
  while (assetParts.length > 0 && isLikelyTransformation(assetParts[0])) {
    assetParts.shift();
  }
  if (assetParts[0]?.match(/^v\d+$/)) assetParts.shift();
  if (assetParts.length === 0) throw new Error("Cloudinary public ID missing.");

  const publicIdWithExtension = decodeURIComponent(assetParts.join("/"));
  const publicId =
    resourceType === "raw"
      ? publicIdWithExtension
      : publicIdWithExtension.replace(/\.[^.]+$/, "");

  return { publicId, resourceType };
}

function getJwtPayload(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as { role?: string };
  } catch {
    return null;
  }
}

async function sha1Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (getJwtPayload(req)?.role !== "authenticated") {
    return new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cloudName =
    Deno.env.get("CLOUDINARY_CLOUD_NAME") ??
    Deno.env.get("VITE_CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({ error: "Cloudinary delete settings are missing." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = (await req.json()) as { url?: string };
    if (!body.url) throw new Error("Cloudinary URL missing.");

    const { publicId, resourceType } = parseCloudinaryUrl(body.url);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await sha1Hex(
      `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
    );

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp);
    formData.append("api_key", apiKey);
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      {
        method: "POST",
        body: formData,
      },
    );
    const result = await response.json();

    if (!response.ok || result?.result === "error") {
      return new Response(
        JSON.stringify({
          deleted: false,
          warning:
            result?.error?.message ??
            result?.message ??
            "Cloudinary file was not deleted.",
        }),
        {
          status: response.ok ? 200 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ deleted: result?.result === "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        deleted: false,
        warning: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
