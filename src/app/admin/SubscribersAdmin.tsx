import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface SubscriberRow {
  id: string;
  email: string;
  created_at: string;
}

function formatSubscriberDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SubscribersAdmin() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("mailing_list_subscribers")
      .select("id,email,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Error loading subscribers: ${error.message}`);
      setLoading(false);
      return;
    }

    setSubscribers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const deleteSubscriber = async (subscriber: SubscriberRow) => {
    if (!confirm(`Remove ${subscriber.email} from the mailing list?`)) return;

    const { error } = await supabase
      .from("mailing_list_subscribers")
      .delete()
      .eq("id", subscriber.id);

    if (error) {
      setMessage(`Error deleting subscriber: ${error.message}`);
      return;
    }

    setMessage("✓ Subscriber removed");
    loadSubscribers();
  };

  const exportSubscribers = () => {
    const headers = ["email", "joined_at"];
    const rows = subscribers.map((subscriber) =>
      [subscriber.email, subscriber.created_at]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = "mailing-list-subscribers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-gray-400">
            Subscribers
          </h2>
          <p className="mt-2 text-xs text-gray-400">
            {loading
              ? "Loading mailing list..."
              : `${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSubscribers}
            disabled={loading}
            className="border border-gray-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60"
          >
            Refresh
          </button>
          <button
            onClick={exportSubscribers}
            disabled={loading || subscribers.length === 0}
            className="bg-gray-900 px-3 py-2 text-xs uppercase tracking-widest text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Export CSV
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`mb-4 text-xs ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
        >
          {message}
        </p>
      )}

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="hidden grid-cols-[1.5fr_1fr_auto] gap-4 border-b border-gray-100 px-4 py-3 text-[10px] uppercase tracking-widest text-gray-400 md:grid">
          <span>Email</span>
          <span>Joined</span>
          <span className="text-right">Action</span>
        </div>

        {subscribers.map((subscriber) => (
          <div
            key={subscriber.id}
            className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_auto] md:items-center md:gap-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-900">
                {subscriber.email}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              <span className="text-gray-400 md:hidden">Joined: </span>
              {formatSubscriberDate(subscriber.created_at)}
            </p>
            <button
              onClick={() => deleteSubscriber(subscriber)}
              className="justify-self-start border border-gray-200 px-3 py-1.5 text-xs uppercase tracking-widest text-gray-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white md:justify-self-end"
            >
              Remove
            </button>
          </div>
        ))}

        {!loading && subscribers.length === 0 && (
          <p className="px-4 py-8 text-sm text-gray-400">
            No subscribers yet. Once someone joins from the About page, they will
            appear here.
          </p>
        )}

        {loading && (
          <p className="px-4 py-8 text-sm text-gray-400">
            Loading subscribers...
          </p>
        )}
      </div>
    </div>
  );
}
