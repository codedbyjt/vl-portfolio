import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { supabase } from "../../lib/supabase";

interface SubscriberRow {
  id: string;
  email: string;
  created_at: string;
}

interface SubscriberGroup {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

interface GroupMember {
  subscriber_id: string;
  group_id: string;
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

function getEmailsFromCsv(csv: string) {
  const matches = csv.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/g);

  return matches?.map((email) => email.toLowerCase()) ?? [];
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function slugifyGroupName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `group-${Date.now()}`
  );
}

export function SubscribersAdmin() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [groups, setGroups] = useState<SubscriberGroup[]>([]);
  const [memberships, setMemberships] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedImportGroupId, setSelectedImportGroupId] = useState("");

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [
      subscribersResult,
      groupsResult,
      membershipsResult,
    ] = await Promise.all([
      supabase
        .from("mailing_list_subscribers")
        .select("id,email,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriber_groups")
        .select("id,name,slug,sort_order,created_at")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("subscriber_group_members")
        .select("subscriber_id,group_id"),
    ]);

    const error =
      subscribersResult.error ?? groupsResult.error ?? membershipsResult.error;

    if (error) {
      setMessage(`Error loading subscribers: ${error.message}`);
      setLoading(false);
      return;
    }

    setSubscribers(subscribersResult.data ?? []);
    setGroups(groupsResult.data ?? []);
    setMemberships(membershipsResult.data ?? []);
    setSelectedImportGroupId((currentGroupId) => {
      if (
        currentGroupId &&
        groupsResult.data?.some((group) => group.id === currentGroupId)
      ) {
        return currentGroupId;
      }

      return (
        groupsResult.data?.find((group) => group.slug === "general-newsletter")
          ?.id ??
        groupsResult.data?.[0]?.id ??
        ""
      );
    });
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
    const headers = ["email", "groups", "joined_at"];
    const rows = subscribers.map((subscriber) =>
      [
        subscriber.email,
        getSubscriberGroups(subscriber.id)
          .map((group) => group.name)
          .join("; "),
        subscriber.created_at,
      ]
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

  const getSubscriberGroups = (subscriberId: string) => {
    const groupIds = new Set(
      memberships
        .filter((membership) => membership.subscriber_id === subscriberId)
        .map((membership) => membership.group_id),
    );

    return groups.filter((group) => groupIds.has(group.id));
  };

  const getGroupCount = (groupId: string) =>
    memberships.filter((membership) => membership.group_id === groupId).length;

  const createGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newGroupName.trim();
    if (!name) return;

    const { error } = await supabase.from("subscriber_groups").insert({
      name,
      slug: slugifyGroupName(name),
      sort_order: (groups.length + 1) * 10,
    });

    if (error) {
      setMessage(`Error creating group: ${error.message}`);
      return;
    }

    setNewGroupName("");
    setMessage("✓ Group created");
    loadSubscribers();
  };

  const startEditingGroup = (group: SubscriberGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const saveGroupName = async (group: SubscriberGroup) => {
    const name = editingGroupName.trim();
    if (!name) return;

    const { error } = await supabase
      .from("subscriber_groups")
      .update({
        name,
        slug: slugifyGroupName(name),
      })
      .eq("id", group.id);

    if (error) {
      setMessage(`Error updating group: ${error.message}`);
      return;
    }

    setEditingGroupId("");
    setEditingGroupName("");
    setMessage("✓ Group updated");
    loadSubscribers();
  };

  const deleteGroup = async (group: SubscriberGroup) => {
    if (
      !confirm(
        `Delete the "${group.name}" group? Subscribers will stay in the mailing list.`,
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("subscriber_groups")
      .delete()
      .eq("id", group.id);

    if (error) {
      setMessage(`Error deleting group: ${error.message}`);
      return;
    }

    setMessage("✓ Group deleted");
    loadSubscribers();
  };

  const addSubscriberToGroup = async (subscriberId: string, groupId: string) => {
    const alreadyInGroup = memberships.some(
      (membership) =>
        membership.subscriber_id === subscriberId &&
        membership.group_id === groupId,
    );

    if (!groupId || alreadyInGroup) return;

    const { error } = await supabase.from("subscriber_group_members").insert({
      subscriber_id: subscriberId,
      group_id: groupId,
    });

    if (error && error.code !== "23505") {
      setMessage(`Error adding group: ${error.message}`);
      return;
    }

    loadSubscribers();
  };

  const removeSubscriberFromGroup = async (
    subscriberId: string,
    groupId: string,
  ) => {
    const { error } = await supabase
      .from("subscriber_group_members")
      .delete()
      .eq("subscriber_id", subscriberId)
      .eq("group_id", groupId);

    if (error) {
      setMessage(`Error removing group: ${error.message}`);
      return;
    }

    loadSubscribers();
  };

  const importSubscribers = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setImporting(true);
    setMessage("");

    try {
      const csv = await file.text();
      const emails = getEmailsFromCsv(csv);
      const validEmails = emails.filter(isValidEmail);

      if (validEmails.length === 0) {
        setMessage("No valid emails found in that CSV.");
        setImporting(false);
        return;
      }

      const uniqueEmails = Array.from(new Set(validEmails));
      const existingEmails = new Set(
        subscribers.map((subscriber) => subscriber.email.toLowerCase()),
      );
      const newEmails = uniqueEmails.filter((email) => !existingEmails.has(email));
      const importGroupId = selectedImportGroupId;

      if (newEmails.length === 0 && !importGroupId) {
        setMessage(
          "✓ No new subscribers to import. Those emails are already listed.",
        );
        setImporting(false);
        return;
      }

      let importedCount = 0;
      let duplicateCount = emails.length - newEmails.length;

      for (let index = 0; index < newEmails.length; index += 1) {
        const email = newEmails[index];
        const { error } = await supabase
          .from("mailing_list_subscribers")
          .insert({
            email,
            source: "csv_import",
          });

        if (error) {
          if (error.code === "23505") {
            duplicateCount += 1;
            continue;
          }

          setMessage(`Error importing subscribers: ${error.message}`);
          setImporting(false);
          return;
        }

        importedCount += 1;
      }

      let groupedCount = 0;

      if (importGroupId) {
        const { data: groupSubscribers, error: groupSubscriberError } =
          await supabase
            .from("mailing_list_subscribers")
            .select("id,email")
            .in("email", uniqueEmails);

        if (groupSubscriberError) {
          setMessage(`Imported, but could not load group members: ${groupSubscriberError.message}`);
          setImporting(false);
          return;
        }

        for (const subscriber of groupSubscribers ?? []) {
          const alreadyInGroup = memberships.some(
            (membership) =>
              membership.subscriber_id === subscriber.id &&
              membership.group_id === importGroupId,
          );

          if (alreadyInGroup) continue;

          const { error } = await supabase.from("subscriber_group_members").insert({
            subscriber_id: subscriber.id,
            group_id: importGroupId,
          });

          if (error && error.code !== "23505") {
            setMessage(`Imported, but could not assign group: ${error.message}`);
            setImporting(false);
            return;
          }

          groupedCount += 1;
        }
      }

      await loadSubscribers();
      setMessage(
        `✓ Imported ${importedCount} subscriber${importedCount === 1 ? "" : "s"}${
          duplicateCount > 0 ? `, skipped ${duplicateCount}` : ""
        }${groupedCount > 0 ? `, added ${groupedCount} to group` : ""}`,
      );
    } catch (error) {
      setMessage(
        `Error reading CSV: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setImporting(false);
    }
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadSubscribers}
            disabled={loading || importing}
            className="border border-gray-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60"
          >
            Refresh
          </button>
          <label className="cursor-pointer border border-gray-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 has-[:disabled]:cursor-wait has-[:disabled]:opacity-60">
            {importing ? "Importing..." : "Import CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={importSubscribers}
              disabled={loading || importing}
              className="sr-only"
            />
          </label>
          <button
            onClick={exportSubscribers}
            disabled={loading || importing || subscribers.length === 0}
            className="bg-gray-900 px-3 py-2 text-xs uppercase tracking-widest text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 border border-gray-100 bg-white px-4 py-3 text-xs leading-5 text-gray-400 md:grid-cols-[1fr_240px] md:items-center">
        <p>
          Upload a CSV from contacts, MailerLite, Gmail, or a spreadsheet. The
          importer finds email addresses anywhere in the file and skips duplicates.
        </p>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-gray-400">
            Import into group
          </span>
          <select
            value={selectedImportGroupId}
            onChange={(event) => setSelectedImportGroupId(event.target.value)}
            disabled={loading || importing || groups.length === 0}
            className="w-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
          >
            <option value="">No group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message && (
        <p
          className={`mb-4 text-xs ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
        >
          {message}
        </p>
      )}

      <section className="mb-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-400">
              Groups
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Customise the audience buckets for drops, events, clients, and
              campaigns.
            </p>
          </div>
          <form onSubmit={createGroup} className="flex gap-2">
            <input
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              disabled={loading}
              placeholder="New group"
              className="min-w-0 border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !newGroupName.trim()}
              className="bg-gray-900 px-3 py-2 text-xs uppercase tracking-widest text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Create
            </button>
          </form>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="border border-gray-200 bg-white p-4">
              {editingGroupId === group.id ? (
                <div className="flex gap-2">
                  <input
                    value={editingGroupName}
                    onChange={(event) => setEditingGroupName(event.target.value)}
                    className="min-w-0 flex-1 border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => saveGroupName(group)}
                    className="border border-gray-900 px-3 py-2 text-xs uppercase tracking-widest text-gray-900"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {group.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {getGroupCount(group.id)} subscriber
                      {getGroupCount(group.id) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingGroup(group)}
                      className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGroup(group)}
                      className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="hidden grid-cols-[1.2fr_1.4fr_0.8fr_auto] gap-4 border-b border-gray-100 px-4 py-3 text-[10px] uppercase tracking-widest text-gray-400 md:grid">
          <span>Email</span>
          <span>Groups</span>
          <span>Joined</span>
          <span className="text-right">Action</span>
        </div>

        {subscribers.map((subscriber) => (
          <div
            key={subscriber.id}
            className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 md:grid-cols-[1.2fr_1.4fr_0.8fr_auto] md:items-center md:gap-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-900">
                {subscriber.email}
              </p>
            </div>
            <div className="min-w-0">
              <span className="mb-2 block text-xs text-gray-400 md:hidden">
                Groups:
              </span>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {getSubscriberGroups(subscriber.id).map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() =>
                      removeSubscriberFromGroup(subscriber.id, group.id)
                    }
                    className="border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
                    title="Remove from group"
                  >
                    {group.name}
                  </button>
                ))}
                {getSubscriberGroups(subscriber.id).length === 0 && (
                  <span className="text-xs text-gray-300">No groups</span>
                )}
              </div>
              <select
                value=""
                onChange={(event) => {
                  addSubscriberToGroup(subscriber.id, event.target.value);
                  event.target.value = "";
                }}
                disabled={loading || groups.length === 0}
                className="w-full max-w-[220px] border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-500 outline-none focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
              >
                <option value="">Add to group...</option>
                {groups
                  .filter(
                    (group) =>
                      !getSubscriberGroups(subscriber.id).some(
                        (subscriberGroup) => subscriberGroup.id === group.id,
                      ),
                  )
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
              </select>
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
