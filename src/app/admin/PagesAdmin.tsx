import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/aboutContent";
import {
  cleanPageSlug,
  defaultSiteSettings,
  loadSiteSettings,
  saveSiteSettings,
  type CustomPage,
  type SiteSettings,
} from "../../lib/siteSettings";

function createPage(): CustomPage {
  return {
    id: `page-${Date.now()}`,
    title: "",
    slug: "",
    intro: "",
    body: "",
    image_url: "",
    button_label: "",
    button_url: "",
    visible: true,
  };
}

export function PagesAdmin() {
  const [settings, setSettings] =
    useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    loadSiteSettings()
      .then((loadedSettings) => {
        if (!active) return;
        setSettings(loadedSettings);
        setSelectedPageId(loadedSettings.custom_pages[0]?.id ?? null);
      })
      .catch((error) => {
        if (!active) return;
        setMessage(`Error loading pages: ${getErrorMessage(error)}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedPage =
    settings.custom_pages.find((page) => page.id === selectedPageId) ?? null;

  const updatePage = (
    id: string,
    field: keyof Omit<CustomPage, "id">,
    value: string | boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      custom_pages: currentSettings.custom_pages.map((page) =>
        page.id === id ? { ...page, [field]: value } : page,
      ),
    }));
  };

  const addPage = () => {
    const nextPage = createPage();
    setSettings((currentSettings) => ({
      ...currentSettings,
      custom_pages: [...currentSettings.custom_pages, nextPage],
    }));
    setSelectedPageId(nextPage.id);
    setMessage("");
  };

  const removePage = (id: string) => {
    if (!confirm("Delete this page? This removes it from the site.")) return;

    setSettings((currentSettings) => {
      const nextPages = currentSettings.custom_pages.filter(
        (page) => page.id !== id,
      );
      setSelectedPageId(nextPages[0]?.id ?? null);

      return {
        ...currentSettings,
        custom_pages: nextPages,
      };
    });
  };

  const savePages = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const cleanedPages = settings.custom_pages
      .map((page) => {
        const title = page.title.trim();
        const slug = cleanPageSlug(page.slug || title);

        return {
          ...page,
          title,
          slug,
          intro: page.intro.trim(),
          body: page.body.trim(),
          image_url: page.image_url.trim(),
          button_label: page.button_label.trim(),
          button_url: page.button_url.trim(),
        };
      })
      .filter((page) => page.title && page.slug);

    const nextSettings = {
      ...settings,
      custom_pages: cleanedPages,
    };

    try {
      await saveSiteSettings(nextSettings);
      setSettings(nextSettings);
      setSelectedPageId(cleanedPages[0]?.id ?? null);
      setMessage("✓ Pages saved");
    } catch (error) {
      setMessage(`Error saving pages: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-white border border-gray-200 p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-2">
              Pages
            </h2>
            <p className="text-xs text-gray-400">
              Create simple pages, then choose them from the Nav Menu page
              picker.
            </p>
          </div>
          <button
            type="button"
            onClick={addPage}
            disabled={loading || saving}
            className="border border-gray-200 px-4 py-2 text-xs uppercase tracking-widest text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60"
          >
            New page
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-2">
            {settings.custom_pages.length === 0 ? (
              <div className="border border-gray-100 p-4 text-xs leading-relaxed text-gray-400">
                No custom pages yet. Create one for things like Press, Contact,
                Services, or Exhibitions.
              </div>
            ) : (
              settings.custom_pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className={`block w-full border p-3 text-left transition-colors ${
                    selectedPageId === page.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span className="block text-xs uppercase tracking-widest text-gray-900">
                    {page.title || "Untitled page"}
                  </span>
                  <span className="mt-1 block break-all text-[11px] text-gray-400">
                    /pages/{cleanPageSlug(page.slug || page.title) || "page-url"}
                  </span>
                </button>
              ))
            )}
          </div>

          <form onSubmit={savePages}>
            {selectedPage ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                      Page title
                    </span>
                    <input
                      value={selectedPage.title}
                      onChange={(event) => {
                        const title = event.target.value;
                        updatePage(selectedPage.id, "title", title);
                        if (!selectedPage.slug) {
                          updatePage(
                            selectedPage.id,
                            "slug",
                            cleanPageSlug(title),
                          );
                        }
                      }}
                      disabled={loading || saving}
                      className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      placeholder="Press"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                      Page URL
                    </span>
                    <div className="flex">
                      <span className="border border-r-0 border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-400">
                        /pages/
                      </span>
                      <input
                        value={selectedPage.slug}
                        onChange={(event) =>
                          updatePage(
                            selectedPage.id,
                            "slug",
                            cleanPageSlug(event.target.value),
                          )
                        }
                        disabled={loading || saving}
                        className="min-w-0 flex-1 border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                        placeholder="press"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Intro
                  </span>
                  <textarea
                    value={selectedPage.intro}
                    onChange={(event) =>
                      updatePage(selectedPage.id, "intro", event.target.value)
                    }
                    disabled={loading || saving}
                    rows={3}
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                    placeholder="A short opening line for this page."
                  />
                </label>

                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Main text
                  </span>
                  <textarea
                    value={selectedPage.body}
                    onChange={(event) =>
                      updatePage(selectedPage.id, "body", event.target.value)
                    }
                    disabled={loading || saving}
                    rows={8}
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                    placeholder="Write the page content here."
                  />
                </label>

                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Image URL
                  </span>
                  <input
                    type="url"
                    value={selectedPage.image_url}
                    onChange={(event) =>
                      updatePage(selectedPage.id, "image_url", event.target.value)
                    }
                    disabled={loading || saving}
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                    placeholder="https://example.com/image.jpg"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                      Button label
                    </span>
                    <input
                      value={selectedPage.button_label}
                      onChange={(event) =>
                        updatePage(
                          selectedPage.id,
                          "button_label",
                          event.target.value,
                        )
                      }
                      disabled={loading || saving}
                      className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      placeholder="View work"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                      Button link
                    </span>
                    <input
                      value={selectedPage.button_url}
                      onChange={(event) =>
                        updatePage(
                          selectedPage.id,
                          "button_url",
                          event.target.value,
                        )
                      }
                      disabled={loading || saving}
                      className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 disabled:cursor-wait disabled:opacity-60"
                      placeholder="/photography"
                    />
                  </label>
                </div>

                <label className="flex items-start gap-3 border border-gray-100 p-4">
                  <input
                    type="checkbox"
                    checked={selectedPage.visible}
                    onChange={(event) =>
                      updatePage(
                        selectedPage.id,
                        "visible",
                        event.target.checked,
                      )
                    }
                    disabled={loading || saving}
                    className="mt-0.5 h-4 w-4 accent-gray-900 disabled:cursor-wait"
                  />
                  <span>
                    <span className="block text-xs uppercase tracking-widest text-gray-900">
                      Publish this page
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-400">
                      Turn this off to hide the page without deleting it.
                    </span>
                  </span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading || saving}
                    className="bg-gray-900 px-5 py-3 text-xs uppercase tracking-widest text-white transition-colors hover:bg-gray-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save pages"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePage(selectedPage.id)}
                    disabled={loading || saving}
                    className="border border-red-200 px-5 py-3 text-xs uppercase tracking-widest text-red-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    Delete page
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-100 p-6 text-sm leading-relaxed text-gray-400">
                Create a page to start editing.
              </div>
            )}
          </form>
        </div>
      </div>

      {message && (
        <p
          className={`text-xs ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
