import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface MediaUsageSnapshot {
  source: "cloudinary";
  plan?: string;
  last_updated?: string;
  checked_at?: string;
  error?: string;
  credits?: {
    usage?: number;
    limit?: number;
    used_percent?: number;
  };
}

const fallbackMediaUsageSnapshot: MediaUsageSnapshot = {
  source: "cloudinary",
  plan: "Free",
  last_updated: "2026-06-07",
  checked_at: "2026-06-08T10:10:47.472Z",
  credits: {
    usage: 0.25,
    limit: 25,
    used_percent: 1,
  },
};

function formatCheckedAt(checkedAt?: string, fallbackDate?: string) {
  const value = checkedAt ?? fallbackDate;
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MediaStorageUsagePanel() {
  const [snapshot, setSnapshot] = useState<MediaUsageSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSnapshotUsage = async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}media-usage.json`, {
      cache: "no-store",
    });
    const data = (await response.json()) as MediaUsageSnapshot;

    if (!response.ok) {
      throw new Error(data.error || "No usage snapshot found");
    }

    return data;
  };

  const loadLiveUsage = async () => {
    if (import.meta.env.DEV) {
      const response = await fetch("/api/media-usage/refresh", {
        cache: "no-store",
      });
      const data = (await response.json()) as MediaUsageSnapshot;

      if (!response.ok) {
        throw new Error(data.error || "Cloudinary usage refresh failed");
      }

      return data;
    }

    const { data, error } = await supabase.functions.invoke<MediaUsageSnapshot>(
      "cloudinary-usage",
    );

    if (error) throw error;
    if (!data) throw new Error("No live usage returned");

    return data;
  };

  const loadUsage = useCallback(async () => {
    setLoading(true);
    setSnapshotError("");

    try {
      setSnapshot(await loadLiveUsage());
    } catch (liveError: unknown) {
      try {
        setSnapshot(await loadSnapshotUsage());
        setSnapshotError(
          liveError instanceof Error ? liveError.message : String(liveError),
        );
      } catch (snapshotError: unknown) {
        setSnapshot(fallbackMediaUsageSnapshot);
        setSnapshotError(
          snapshotError instanceof Error
            ? snapshotError.message
            : String(snapshotError),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const creditUsage = snapshot?.credits?.usage;
  const creditLimit = snapshot?.credits?.limit;
  const creditsLeft =
    typeof creditUsage === "number" && typeof creditLimit === "number"
      ? Math.max(creditLimit - creditUsage, 0)
      : null;
  const usedPercent = snapshot?.credits?.used_percent;
  const hasCredits =
    typeof creditUsage === "number" && typeof creditLimit === "number";
  const checkedAt = formatCheckedAt(
    snapshot?.checked_at,
    snapshot?.last_updated,
  );

  return (
    <section className="bg-white border border-gray-200 p-4 mb-6 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">
            Media Storage
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Live media allowance for photos, videos, and shop images.
          </p>
        </div>
        <button
          onClick={() => loadUsage()}
          disabled={loading}
          className="self-start border border-gray-200 px-3 py-2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      <div className="mt-5 border border-gray-100 p-4">
        <p className="text-[10px] uppercase tracking-widest text-gray-400">
          Used / Limit
        </p>
        <p className="mt-2 text-2xl font-medium text-gray-900">
          {hasCredits
            ? `${creditUsage} / ${creditLimit} credits`
            : "Not available"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {typeof usedPercent === "number" && creditsLeft !== null
            ? `${creditsLeft.toFixed(2)} credits left, ${usedPercent}% used`
            : snapshotError || "Usage limit unavailable"}
        </p>
      </div>

      {checkedAt && (
        <p className="mt-4 text-[11px] text-gray-400">
          Last checked {checkedAt}.
        </p>
      )}
    </section>
  );
}
