import type { ReactNode } from "react";

export function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // Close when clicking on the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-md border border-gray-200 shadow-xl">
        {title && (
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs uppercase tracking-widest text-gray-500">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 transition-colors text-xl leading-none"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>
        )}

        {!title && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-900 transition-colors text-xl leading-none"
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        )}

        <div className="relative px-5 py-4">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-gray-100">{footer}</div>
        )}
      </div>
    </div>
  );
}
