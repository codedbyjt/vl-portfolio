/// <reference path="../deno.d.ts" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cloudName =
    Deno.env.get("CLOUDINARY_CLOUD_NAME") ??
    Deno.env.get("VITE_CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({
        error: "Cloudinary usage settings are missing.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  const auth = btoa(`${apiKey}:${apiSecret}`);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  );
  const usage = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: usage?.error?.message ?? "Cloudinary usage refresh failed.",
      }),
      {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  return new Response(
    JSON.stringify({
      source: "cloudinary",
      checked_at: new Date().toISOString(),
      ...usage,
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});
