import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  cleanPageSlug,
  defaultSiteSettings,
  loadSiteSettings,
  type CustomPage as CustomPageContent,
} from "../lib/siteSettings";

export default function CustomPage() {
  const { slug = "" } = useParams();
  const [pages, setPages] = useState<CustomPageContent[]>(
    defaultSiteSettings.custom_pages,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadSiteSettings()
      .then((settings) => {
        if (!active) return;
        setPages(settings.custom_pages);
      })
      .catch((error) => {
        console.error("Failed to load custom pages:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeSlug = cleanPageSlug(slug);
  const page = pages.find(
    (item) => item.visible && cleanPageSlug(item.slug) === activeSlug,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 text-xs uppercase tracking-widest text-gray-400">
        Loading...
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 pt-8 pb-4 border-b border-gray-100">
          <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">
            Page not found
          </h1>
        </div>
        <div className="max-w-xl px-6 py-10">
          <p className="text-[15px] leading-relaxed text-gray-700">
            This page is not published or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">
          {page.title}
        </h1>
      </div>

      <div className="max-w-3xl px-6 pb-16 pt-10">
        {page.image_url && (
          <img
            src={page.image_url}
            alt=""
            className="mb-8 max-h-[520px] w-full object-cover"
          />
        )}

        {page.intro && (
          <p className="mb-8 max-w-xl text-[17px] leading-relaxed text-gray-900">
            {page.intro}
          </p>
        )}

        {page.body && (
          <div className="max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
            {page.body}
          </div>
        )}

        {page.button_label && page.button_url && (
          <a
            href={page.button_url}
            target={page.button_url.startsWith("http") ? "_blank" : undefined}
            rel={
              page.button_url.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="mt-8 inline-flex border border-gray-900 px-4 py-3 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
          >
            {page.button_label}
          </a>
        )}
      </div>
    </div>
  );
}
