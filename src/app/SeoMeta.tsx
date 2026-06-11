import { useEffect } from "react";
import { defaultSiteSettings, loadSiteSettings } from "../lib/siteSettings";

function setMetaTag(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element?.setAttribute(name, value);
  });
}

function removeMetaTag(selector: string) {
  document.head.querySelector(selector)?.remove();
}

export default function SeoMeta() {
  useEffect(() => {
    let active = true;

    loadSiteSettings()
      .then((settings) => {
        if (!active) return;

        const title = settings.seo_title.trim() || defaultSiteSettings.seo_title;
        const description =
          settings.seo_description.trim() ||
          defaultSiteSettings.seo_description;
        const keywords = settings.seo_keywords.trim();
        const imageUrl = settings.seo_image_url.trim();
        const pageUrl = window.location.href;
        const robots = settings.seo_indexable
          ? "index, follow"
          : "noindex, nofollow";

        document.title = title;
        setMetaTag('meta[name="description"]', {
          name: "description",
          content: description,
        });
        setMetaTag('meta[name="robots"]', {
          name: "robots",
          content: robots,
        });
        setMetaTag('meta[property="og:title"]', {
          property: "og:title",
          content: title,
        });
        setMetaTag('meta[property="og:description"]', {
          property: "og:description",
          content: description,
        });
        setMetaTag('meta[property="og:type"]', {
          property: "og:type",
          content: "website",
        });
        setMetaTag('meta[property="og:url"]', {
          property: "og:url",
          content: pageUrl,
        });
        setMetaTag('meta[name="twitter:card"]', {
          name: "twitter:card",
          content: imageUrl ? "summary_large_image" : "summary",
        });
        setMetaTag('meta[name="twitter:title"]', {
          name: "twitter:title",
          content: title,
        });
        setMetaTag('meta[name="twitter:description"]', {
          name: "twitter:description",
          content: description,
        });

        if (keywords) {
          setMetaTag('meta[name="keywords"]', {
            name: "keywords",
            content: keywords,
          });
        } else {
          removeMetaTag('meta[name="keywords"]');
        }

        if (imageUrl) {
          setMetaTag('meta[property="og:image"]', {
            property: "og:image",
            content: imageUrl,
          });
          setMetaTag('meta[name="twitter:image"]', {
            name: "twitter:image",
            content: imageUrl,
          });
        } else {
          removeMetaTag('meta[property="og:image"]');
          removeMetaTag('meta[name="twitter:image"]');
        }
      })
      .catch((error) => {
        console.error("Failed to load SEO settings:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
