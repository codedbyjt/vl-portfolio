import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/aboutContent";
import {
  defaultSiteSettings,
  loadSiteSettings,
  saveSiteSettings,
  type HomePageMode,
  type SiteSettings,
} from "../../lib/siteSettings";

export function SiteSettingsAdmin() {
  const [settings, setSettings] =
    useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    loadSiteSettings()
      .then((loadedSettings) => {
        if (!active) return;
        setSettings(loadedSettings);
      })
      .catch((error) => {
        if (!active) return;
        const messageText = getErrorMessage(error);
        setMessage(`Error loading settings: ${messageText}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateHomePageMode = async (homePageMode: HomePageMode) => {
    const nextSettings = {
      ...settings,
      home_page_mode: homePageMode,
    };

    setSettings(nextSettings);
    setSaving(true);
    setMessage("");

    try {
      await saveSiteSettings(nextSettings);
      setMessage("✓ Homepage setting saved");
    } catch (error) {
      const messageText = getErrorMessage(error);
      setMessage(`Error saving settings: ${messageText}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSeoSetting = (
    field: keyof Pick<
      SiteSettings,
      | "seo_title"
      | "seo_description"
      | "seo_keywords"
      | "seo_image_url"
      | "seo_indexable"
    >,
    value: string | boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  const updateSubscriptionSetting = (
    field: keyof Pick<
      SiteSettings,
      "subscription_enabled" | "mailerlite_subscribe_url" | "mailerlite_linked"
    >,
    value: string | boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  const saveSubscriptionSettings = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSaving(true);
    setMessage("");

    const nextSettings = {
      ...settings,
      mailerlite_linked: Boolean(settings.mailerlite_subscribe_url.trim()),
      mailerlite_subscribe_url: settings.mailerlite_subscribe_url.trim(),
    };

    try {
      await saveSiteSettings(nextSettings);
      setSettings(nextSettings);
      setMessage("✓ Subscription settings saved");
    } catch (error) {
      const messageText = getErrorMessage(error);
      setMessage(`Error saving settings: ${messageText}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteMailerLiteConfig = async () => {
    if (
      !confirm(
        "Remove the MailerLite connection from the site? New subscribers will still be saved in Admin, but will not be sent to MailerLite.",
      )
    ) {
      return;
    }

    const nextSettings = {
      ...settings,
      mailerlite_linked: false,
      mailerlite_subscribe_url: "",
    };

    setSettings(nextSettings);
    setSaving(true);
    setMessage("");

    try {
      await saveSiteSettings(nextSettings);
      setMessage("✓ MailerLite config removed");
    } catch (error) {
      const messageText = getErrorMessage(error);
      setMessage(`Error removing MailerLite config: ${messageText}`);
    } finally {
      setSaving(false);
    }
  };

  const saveSeoSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await saveSiteSettings(settings);
      setMessage("✓ SEO settings saved");
    } catch (error) {
      const messageText = getErrorMessage(error);
      setMessage(`Error saving settings: ${messageText}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-white border border-gray-200 p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-2">
            Site Settings
          </h2>
          <p className="text-xs text-gray-400">
            Choose what visitors see first when they open the site.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              value: "photography" as const,
              title: "Photography Page",
              description: "Send the homepage straight to the main gallery.",
            },
            {
              value: "landing" as const,
              title: "Image Landing Page",
              description: "Keep the current random featured image intro.",
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateHomePageMode(option.value)}
              disabled={loading || saving}
              className={`border p-4 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${
                settings.home_page_mode === option.value
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span className="block text-xs uppercase tracking-widest text-gray-900">
                {option.title}
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-gray-400">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={saveSubscriptionSettings}
        className="bg-white border border-gray-200 p-4 sm:p-6"
      >
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-2">
            Subscriber Signup
          </h2>
          <p className="text-xs text-gray-400">
            Control the signup panel and whether new subscribers are also sent
            to MailerLite.
          </p>
        </div>

        <div className="mb-5 flex flex-col gap-3 border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-900">
              MailerLite
            </p>
            <p
              className={`mt-1 text-xs ${
                settings.mailerlite_linked
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {settings.mailerlite_linked
                ? "Linked to MailerLite"
                : "Not linked to MailerLite"}
            </p>
          </div>
          <button
            type="button"
            onClick={deleteMailerLiteConfig}
            disabled={loading || saving || !settings.mailerlite_linked}
            className="border border-red-200 px-3 py-2 text-xs uppercase tracking-widest text-red-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-white"
          >
            Delete Mailer Config
          </button>
        </div>

        <div className="space-y-5">
          <label className="flex items-start gap-3 border border-gray-100 p-4">
            <input
              type="checkbox"
              checked={settings.subscription_enabled}
              onChange={(event) =>
                updateSubscriptionSetting(
                  "subscription_enabled",
                  event.target.checked,
                )
              }
              disabled={loading || saving}
              className="mt-0.5 h-4 w-4 accent-gray-900 disabled:cursor-wait"
            />
            <span>
              <span className="block text-xs uppercase tracking-widest text-gray-900">
                Display subscription link
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-400">
                Turn this off to hide the signup panel from the About page.
              </span>
            </span>
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              MailerLite subscribe URL
            </span>
            <input
              type="url"
              value={settings.mailerlite_subscribe_url}
              onChange={(event) =>
                updateSubscriptionSetting(
                  "mailerlite_subscribe_url",
                  event.target.value,
                )
              }
              disabled={loading || saving}
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
              placeholder="https://assets.mailerlite.com/jsonp/.../subscribe"
            />
            <span className="mt-1 block text-[11px] text-gray-400">
              Leave this empty to keep local Admin subscribers only. Add the URL
              back to relink MailerLite.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || saving}
          className="mt-6 bg-gray-900 text-white text-xs uppercase tracking-widest px-5 py-3 transition-colors hover:bg-gray-700 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save subscriber settings"}
        </button>
      </form>

      <form
        onSubmit={saveSeoSettings}
        className="bg-white border border-gray-200 p-4 sm:p-6"
      >
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-2">
            SEO Tags
          </h2>
          <p className="text-xs text-gray-400">
            Control the title, search description, and social sharing preview
            for the site.
          </p>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              SEO title
            </span>
            <input
              value={settings.seo_title}
              onChange={(event) =>
                updateSeoSetting("seo_title", event.target.value)
              }
              disabled={loading || saving}
              maxLength={70}
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
              placeholder="Vic Lentaigne | Photographer and Film Director"
            />
            <span className="mt-1 block text-[11px] text-gray-400">
              {settings.seo_title.length}/70 characters. This is the clickable
              title people see in search results.
            </span>
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Search description
            </span>
            <textarea
              value={settings.seo_description}
              onChange={(event) =>
                updateSeoSetting("seo_description", event.target.value)
              }
              disabled={loading || saving}
              maxLength={170}
              rows={4}
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
              placeholder="Photography and film portfolio by Vic Lentaigne."
            />
            <span className="mt-1 block text-[11px] text-gray-400">
              {settings.seo_description.length}/170 characters. This short
              summary can appear below the title in search results.
            </span>
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Keywords
            </span>
            <input
              value={settings.seo_keywords}
              onChange={(event) =>
                updateSeoSetting("seo_keywords", event.target.value)
              }
              disabled={loading || saving}
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
              placeholder="photography, film, director, portfolio"
            />
            <span className="mt-1 block text-[11px] text-gray-400">
              Separate words or phrases with commas. Search engines care less
              about this now, but it is still useful site metadata.
            </span>
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Social preview image URL
            </span>
            <input
              type="url"
              value={settings.seo_image_url}
              onChange={(event) =>
                updateSeoSetting("seo_image_url", event.target.value)
              }
              disabled={loading || saving}
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
              placeholder="https://example.com/preview-image.jpg"
            />
            <span className="mt-1 block text-[11px] text-gray-400">
              Used when someone shares the site link on social platforms.
            </span>
          </label>

          <label className="flex items-start gap-3 border border-gray-100 p-4">
            <input
              type="checkbox"
              checked={settings.seo_indexable}
              onChange={(event) =>
                updateSeoSetting("seo_indexable", event.target.checked)
              }
              disabled={loading || saving}
              className="mt-0.5 h-4 w-4 accent-gray-900 disabled:cursor-wait"
            />
            <span>
              <span className="block text-xs uppercase tracking-widest text-gray-900">
                Allow search engines to show this site
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-400">
                Leave this on for visibility. Turn it off only if the site
                should be hidden from search results.
              </span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || saving}
          className="mt-6 bg-gray-900 text-white text-xs uppercase tracking-widest px-5 py-3 transition-colors hover:bg-gray-700 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save SEO tags"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-xs ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
