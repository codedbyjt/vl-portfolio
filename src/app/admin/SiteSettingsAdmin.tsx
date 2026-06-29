import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/aboutContent";
import {
  defaultSiteSettings,
  loadSiteSettings,
  saveSiteSettings,
  type HomePageMode,
  type SiteNavItem,
  type SiteSettings,
} from "../../lib/siteSettings";

interface SiteSettingsAdminProps {
  section?: "settings" | "nav";
}

function createNavItem(): SiteNavItem {
  return {
    id: `nav-${Date.now()}`,
    label: "",
    path: "",
    external: false,
    visible: true,
  };
}

export function SiteSettingsAdmin({
  section = "settings",
}: SiteSettingsAdminProps) {
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

  const updateNavSetting = (
    field: keyof Pick<
      SiteSettings,
      | "logo_url"
      | "logo_alt_text"
      | "photography_nav_label"
      | "photography_main_label"
      | "photography_main_path"
      | "photography_commercial_label"
      | "photography_commercial_path"
      | "photography_commercial_visible"
    >,
    value: string | boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  const updateNavItem = (
    id: string,
    field: keyof Omit<SiteNavItem, "id">,
    value: string | boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      nav_items: currentSettings.nav_items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updatePhotographyNavItem = (
    id: string,
    field: keyof Omit<SiteNavItem, "id">,
    value: string | boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      photography_nav_items: currentSettings.photography_nav_items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addNavItem = () => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      nav_items: [...currentSettings.nav_items, createNavItem()],
    }));
  };

  const addPhotographyNavItem = () => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      photography_nav_items: [
        ...currentSettings.photography_nav_items,
        createNavItem(),
      ],
    }));
  };

  const removeNavItem = (id: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      nav_items: currentSettings.nav_items.filter((item) => item.id !== id),
    }));
  };

  const removePhotographyNavItem = (id: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      photography_nav_items: currentSettings.photography_nav_items.filter(
        (item) => item.id !== id,
      ),
    }));
  };

  const moveNavItem = (id: string, direction: -1 | 1) => {
    setSettings((currentSettings) => {
      const currentIndex = currentSettings.nav_items.findIndex(
        (item) => item.id === id,
      );
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0) return currentSettings;
      if (nextIndex >= currentSettings.nav_items.length) return currentSettings;

      const nextItems = [...currentSettings.nav_items];
      const [movedItem] = nextItems.splice(currentIndex, 1);
      nextItems.splice(nextIndex, 0, movedItem);

      return {
        ...currentSettings,
        nav_items: nextItems,
      };
    });
  };

  const movePhotographyNavItem = (id: string, direction: -1 | 1) => {
    setSettings((currentSettings) => {
      const currentIndex = currentSettings.photography_nav_items.findIndex(
        (item) => item.id === id,
      );
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0) return currentSettings;
      if (nextIndex >= currentSettings.photography_nav_items.length) {
        return currentSettings;
      }

      const nextItems = [...currentSettings.photography_nav_items];
      const [movedItem] = nextItems.splice(currentIndex, 1);
      nextItems.splice(nextIndex, 0, movedItem);

      return {
        ...currentSettings,
        photography_nav_items: nextItems,
      };
    });
  };

  const saveNavSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const cleanedNavItems = settings.nav_items
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        path: item.path.trim(),
        external: item.external || item.path.trim().startsWith("http"),
      }))
      .filter((item) => item.label && item.path);
    const cleanedPhotographyNavItems = settings.photography_nav_items
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        path: item.path.trim(),
        external: false,
      }))
      .filter((item) => item.label && item.path);

    const nextSettings = {
      ...settings,
      logo_url: settings.logo_url.trim(),
      logo_alt_text:
        settings.logo_alt_text.trim() || defaultSiteSettings.logo_alt_text,
      photography_nav_label:
        settings.photography_nav_label.trim() ||
        defaultSiteSettings.photography_nav_label,
      photography_main_label:
        settings.photography_main_label.trim() ||
        defaultSiteSettings.photography_main_label,
      photography_main_path:
        settings.photography_main_path.trim() ||
        defaultSiteSettings.photography_main_path,
      photography_commercial_label:
        settings.photography_commercial_label.trim() ||
        defaultSiteSettings.photography_commercial_label,
      photography_commercial_path:
        settings.photography_commercial_path.trim() ||
        defaultSiteSettings.photography_commercial_path,
      photography_nav_items:
        cleanedPhotographyNavItems.length > 0
          ? cleanedPhotographyNavItems
          : defaultSiteSettings.photography_nav_items,
      nav_items:
        cleanedNavItems.length > 0
          ? cleanedNavItems
          : defaultSiteSettings.nav_items,
    };

    try {
      await saveSiteSettings(nextSettings);
      setSettings(nextSettings);
      setMessage("✓ Nav menu saved");
    } catch (error) {
      const messageText = getErrorMessage(error);
      setMessage(`Error saving nav menu: ${messageText}`);
    } finally {
      setSaving(false);
    }
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

  if (section === "nav") {
    return (
      <section className="space-y-6">
        <form
          onSubmit={saveNavSettings}
          className="bg-white border border-gray-200 p-4 sm:p-6"
        >
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-2">
              Nav Menu
            </h2>
            <p className="text-xs text-gray-400">
              Edit the site logo and the menu links visitors use to move around
              the site.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-5">
              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                  Logo image URL
                </span>
                <input
                  type="url"
                  value={settings.logo_url}
                  onChange={(event) =>
                    updateNavSetting("logo_url", event.target.value)
                  }
                  disabled={loading || saving}
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                  placeholder="https://example.com/logo.png"
                />
                <span className="mt-1 block text-[11px] text-gray-400">
                  Leave this empty to use the default logo already in the site.
                </span>
              </label>

              <label className="block">
                <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                  Logo description
                </span>
                <input
                  value={settings.logo_alt_text}
                  onChange={(event) =>
                    updateNavSetting("logo_alt_text", event.target.value)
                  }
                  disabled={loading || saving}
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                  placeholder="Vic Lentaigne"
                />
                <span className="mt-1 block text-[11px] text-gray-400">
                  This is the text screen readers use for the logo image.
                </span>
              </label>
            </div>

            <div className="border border-gray-100 p-4">
              <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">
                Logo preview
              </p>
              <div className="flex min-h-24 items-center justify-center bg-gray-50 p-4">
                <img
                  src={
                    settings.logo_url ||
                    `${import.meta.env.BASE_URL}logo-tight.png`
                  }
                  alt={settings.logo_alt_text || "Logo preview"}
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 border border-gray-100 p-4">
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-widest text-gray-500">
                Photography menu
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                These are the photo links that sit inside the expandable
                Photography section.
              </p>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="block">
                <span className="block text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                  Section label
                </span>
                <input
                  value={settings.photography_nav_label}
                  onChange={(event) =>
                    updateNavSetting(
                      "photography_nav_label",
                      event.target.value,
                    )
                  }
                  disabled={loading || saving}
                  className="w-full border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                  placeholder="Photography"
                />
              </label>
              <button
                type="button"
                onClick={addPhotographyNavItem}
                disabled={loading || saving}
                className="border border-gray-200 px-4 py-2 text-xs uppercase tracking-widest text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60 sm:self-end"
              >
                Add photo link
              </button>
            </div>

            <div className="space-y-3">
              {settings.photography_nav_items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-3 border border-gray-100 p-4 lg:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.4fr)_110px_90px]"
                >
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => movePhotographyNavItem(item.id, -1)}
                      disabled={loading || saving || index === 0}
                      className="border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhotographyNavItem(item.id, 1)}
                      disabled={
                        loading ||
                        saving ||
                        index === settings.photography_nav_items.length - 1
                      }
                      className="border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Down
                    </button>
                  </div>

                  <label className="block">
                    <span className="block text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                      Label
                    </span>
                    <input
                      value={item.label}
                      onChange={(event) =>
                        updatePhotographyNavItem(
                          item.id,
                          "label",
                          event.target.value,
                        )
                      }
                      disabled={loading || saving}
                      className="w-full border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      placeholder="Main Portfolio"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                      Link
                    </span>
                    <input
                      value={item.path}
                      onChange={(event) =>
                        updatePhotographyNavItem(
                          item.id,
                          "path",
                          event.target.value,
                        )
                      }
                      disabled={loading || saving}
                      className="w-full border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      placeholder="/photography"
                    />
                  </label>

                  <label className="flex items-center gap-2 pt-7 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={(event) =>
                        updatePhotographyNavItem(
                          item.id,
                          "visible",
                          event.target.checked,
                        )
                      }
                      disabled={loading || saving}
                      className="h-4 w-4 accent-gray-900 disabled:cursor-wait"
                    />
                    Visible
                  </label>

                  <button
                    type="button"
                    onClick={() => removePhotographyNavItem(item.id)}
                    disabled={
                      loading ||
                      saving ||
                      settings.photography_nav_items.length === 1
                    }
                    className="border border-red-200 px-3 py-2 text-xs uppercase tracking-widest text-red-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-white lg:mt-7"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-gray-500">
                  Menu items
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Use internal links like /about, or full links like
                  https://instagram.com/name.
                </p>
              </div>
              <button
                type="button"
                onClick={addNavItem}
                disabled={loading || saving}
                className="border border-gray-200 px-4 py-2 text-xs uppercase tracking-widest text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60"
              >
                Add item
              </button>
            </div>

            <div className="space-y-3">
              {settings.nav_items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-3 border border-gray-100 p-4 lg:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.4fr)_110px_90px]"
                >
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => moveNavItem(item.id, -1)}
                      disabled={loading || saving || index === 0}
                      className="border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNavItem(item.id, 1)}
                      disabled={
                        loading ||
                        saving ||
                        index === settings.nav_items.length - 1
                      }
                      className="border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Down
                    </button>
                  </div>

                  <label className="block">
                    <span className="block text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                      Label
                    </span>
                    <input
                      value={item.label}
                      onChange={(event) =>
                        updateNavItem(item.id, "label", event.target.value)
                      }
                      disabled={loading || saving}
                      className="w-full border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      placeholder="About"
                    />
                  </label>

                  <div>
                    <span className="block text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                      Link
                    </span>
                    <input
                      value={item.path}
                      onChange={(event) =>
                        updateNavItem(item.id, "path", event.target.value)
                      }
                      disabled={loading || saving}
                      className="w-full border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      placeholder="/about"
                    />
                    {settings.custom_pages.length > 0 && (
                      <select
                        value={
                          settings.custom_pages.some(
                            (page) => item.path === `/pages/${page.slug}`,
                          )
                            ? item.path
                            : ""
                        }
                        onChange={(event) => {
                          if (!event.target.value) return;
                          updateNavItem(item.id, "path", event.target.value);
                        }}
                        disabled={loading || saving}
                        className="mt-2 w-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      >
                        <option value="">Choose custom page...</option>
                        {settings.custom_pages.map((page) => (
                          <option key={page.id} value={`/pages/${page.slug}`}>
                            {page.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <label className="flex items-center gap-2 pt-7 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={(event) =>
                        updateNavItem(
                          item.id,
                          "visible",
                          event.target.checked,
                        )
                      }
                      disabled={loading || saving}
                      className="h-4 w-4 accent-gray-900 disabled:cursor-wait"
                    />
                    Visible
                  </label>

                  <button
                    type="button"
                    onClick={() => removeNavItem(item.id)}
                    disabled={
                      loading || saving || settings.nav_items.length === 1
                    }
                    className="border border-red-200 px-3 py-2 text-xs uppercase tracking-widest text-red-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-white lg:mt-7"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || saving}
            className="mt-6 bg-gray-900 text-white text-xs uppercase tracking-widest px-5 py-3 transition-colors hover:bg-gray-700 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save nav menu"}
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
