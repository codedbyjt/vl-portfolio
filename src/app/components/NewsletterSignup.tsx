import { useId, useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { supabase } from "../../lib/supabase";

type NewsletterSignupProps = {
  className?: string;
  mailerLiteSubscribeUrl?: string;
};

type MailerLiteResponse = {
  success?: boolean;
  errors?: {
    fields?: Record<string, string[]>;
  };
};

function getMailerLiteError(response: MailerLiteResponse) {
  const fieldErrors = response.errors?.fields;

  if (!fieldErrors) return "MailerLite rejected the signup.";

  return Object.values(fieldErrors).flat().join(" ");
}

export function NewsletterSignup({
  className = "",
  mailerLiteSubscribeUrl = "",
}: NewsletterSignupProps) {
  const emailInputId = useId();
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "submitted" | "error"
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

    if (error && error.code !== "23505") {
      setStatus("error");
      setMessage("Could not subscribe yet. Try again soon.");
      return;
    }

    if (mailerLiteSubscribeUrl) {
      const formData = new URLSearchParams();
      formData.set("fields[email]", normalizedEmail);
      formData.set("ml-submit", "1");
      formData.set("anticsrf", "true");

      try {
        const response = await fetch(mailerLiteSubscribeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: formData.toString(),
        });
        const result = (await response.json()) as MailerLiteResponse;

        if (!response.ok || result.success === false) {
          console.error("MailerLite signup failed:", result);
          setStatus("error");
          setMessage(
            `Saved in Admin, but MailerLite did not accept it. ${getMailerLiteError(result)}`,
          );
          return;
        }
      } catch (error) {
        console.error("MailerLite signup request failed:", error);
        setStatus("error");
        setMessage("Saved in Admin, but MailerLite could not be reached.");
        return;
      }
    }

    setStatus("submitted");
    setMessage("Subscribed. Portfolio updates incoming.");
  }

  return (
    <section className={`border border-gray-200 bg-white shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Mail size={16} className="shrink-0 text-gray-500" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] uppercase tracking-widest text-gray-500">
              Newsletter
            </span>
            {!isOpen && (
              <span className="block max-w-full text-[12px] leading-5 text-gray-400">
                Sign up for work updates, events, and exhibitions.
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
          method="post"
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
              name="fields[email]"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setStatus("idle");
                setMessage("");
              }}
              placeholder="email"
              autoComplete="email"
              aria-required="true"
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

          <input type="hidden" name="ml-submit" value="1" />
          <input type="hidden" name="anticsrf" value="true" />

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
