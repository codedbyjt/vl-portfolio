import { useEffect, useId, useState, type CSSProperties } from "react";
import {
  defaultAboutContent,
  loadAboutContent,
  sanitizeRichText,
  type AboutTextStyle,
  type AboutContent,
} from "../lib/aboutContent";
import { supabase } from "../lib/supabase";
import { ChevronDown, Mail } from "lucide-react";

function textStyleToCss(style: AboutTextStyle): CSSProperties {
  const fontFamily =
    style.fontFamily === "serif"
      ? "Georgia, Times New Roman, serif"
      : style.fontFamily === "mono"
        ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        : "inherit";

  return {
    fontSize: `${style.fontSize}px`,
    fontFamily,
  };
}

function SubscribePanel({ className = "" }: { className?: string }) {
  const emailInputId = useId();
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const { error } = await supabase.from("mailing_list_subscribers").insert({
      email: normalizedEmail,
      source: "about",
    });

    if (error) {
      if (error.code === "23505") {
        setStatus("success");
        setMessage("You're already on the list.");
        setEmail("");
        return;
      }

      setStatus("error");
      setMessage("Could not subscribe yet. Try again soon.");
      return;
    }

    setStatus("success");
    setMessage("Subscribed. Portfolio updates incoming.");
    setEmail("");
  }

  return (
    <section
      className={`border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Mail
            size={16}
            className="shrink-0 text-gray-500"
            aria-hidden="true"
          />
          <span className="min-w-0">
            <span className="block text-[12px] uppercase tracking-widest text-gray-500">
              Portfolio updates
            </span>
            {!isOpen && (
              <span className="block truncate text-[12px] text-gray-400">
                Join the mailing list
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <form
          id={panelId}
          onSubmit={handleSubmit}
          className="border-t border-gray-100 px-4 pb-4 pt-2"
          noValidate
        >
          <label htmlFor={emailInputId} className="sr-only">
            Email address
          </label>
          <div className="flex items-center border-b border-gray-300 focus-within:border-gray-900">
            <input
              id={emailInputId}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== "loading") {
                  setStatus("idle");
                  setMessage("");
                }
              }}
              placeholder="email"
              autoComplete="email"
              className="min-w-0 flex-1 bg-transparent py-2 pr-2 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 py-2 text-[11px] uppercase tracking-[0.16em] text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-wait disabled:text-gray-300"
            >
              {status === "loading" ? "Adding" : "Join"}
            </button>
          </div>
          {message && (
            <p
              className={`mt-2 text-[12px] leading-5 ${
                status === "error" ? "text-red-600" : "text-gray-500"
              }`}
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);
  const styles = content.about_styles;

  useEffect(() => {
    loadAboutContent()
      .then(setContent)
      .catch((error) => {
        console.error("Failed to load about page content:", error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100">
        <h1 className="tracking-widest text-gray-400 font-medium">
          <span
            style={textStyleToCss(styles.pageTitle)}
            dangerouslySetInnerHTML={{
              __html: sanitizeRichText(content.page_title),
            }}
          />
        </h1>
      </div>

      <div className="px-6 pt-6 md:hidden">
        <SubscribePanel />
      </div>

      <div className="max-w-xl px-6 pb-10 pt-10 md:pb-28">
        <p
          className="text-gray-900 leading-relaxed mb-8"
          style={textStyleToCss(styles.intro)}
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(content.intro),
          }}
        />

        {content.about_sections.map((section) => (
          <div key={section.id} className="mb-8">
            {section.heading && (
              <p
                className="tracking-widest text-gray-400 mb-3"
                style={textStyleToCss(styles.sectionHeading)}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(section.heading),
                }}
              />
            )}
            {section.body && (
              <div
                className="space-y-1 text-gray-700"
                style={textStyleToCss(styles.sectionBody)}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(section.body),
                }}
              />
            )}
          </div>
        ))}

        {(content.contact_section.heading || content.contact_section.body) && (
          <div>
            {content.contact_section.heading && (
              <p
                className="tracking-widest text-gray-400 mb-3"
                style={textStyleToCss(styles.sectionHeading)}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(content.contact_section.heading),
                }}
              />
            )}
            {content.contact_section.body && (
              <div
                className="text-gray-900 hover:text-gray-400 transition-colors"
                style={textStyleToCss(styles.sectionBody)}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(content.contact_section.body),
                }}
              />
            )}
          </div>
        )}
      </div>
      <SubscribePanel className="fixed bottom-6 right-6 z-40 hidden w-[360px] md:block" />
    </div>
  );
}
