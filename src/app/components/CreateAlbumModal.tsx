import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";

export type AlbumType = "gallery" | "portfolio";

export function CreateAlbumModal({
  open,
  titleValue,
  typeValue,
  onConfirm,
  onClose,
}: {
  open: boolean;
  titleValue: string;
  typeValue: AlbumType;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const safeTitle = useMemo(
    () => titleValue.trim() || "(untitled)",
    [titleValue],
  );

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  if (!open) return null;

  return (
    <Modal
      title="Create album?"
      onClose={() => {
        if (busy) return;
        onClose();
      }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 px-3 py-2"
            onClick={() => {
              if (busy) return;
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="bg-gray-900 text-white text-xs uppercase tracking-widest px-5 py-2 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-wait"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      }
    >
      <div className="text-sm text-gray-700">
        <p className="mb-2">
          You’re about to create a{" "}
          <span className="font-medium text-gray-900">
            {typeValue === "gallery" ? "Gallery" : "Portfolio"}
          </span>{" "}
          album.
        </p>
        <div className="bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
          <div className="text-[10px] uppercase tracking-widest text-gray-400">
            Title
          </div>
          <div className="text-gray-900 truncate" title={safeTitle}>
            {safeTitle}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Tip: “Gallery” shows publicly. “Portfolio” is share-link only.
        </p>
      </div>
    </Modal>
  );
}
