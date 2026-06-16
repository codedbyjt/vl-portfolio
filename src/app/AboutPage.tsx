import { useEffect, useState, type CSSProperties } from "react";
import {
  defaultAboutContent,
  loadAboutContent,
  sanitizeRichText,
  type AboutTextStyle,
  type AboutContent,
} from "../lib/aboutContent";
import {
  defaultSiteSettings,
  loadSiteSettings,
  type SiteSettings,
} from "../lib/siteSettings";
import { NewsletterSignup } from "./components/NewsletterSignup";

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

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);
  const [siteSettings, setSiteSettings] =
    useState<SiteSettings>(defaultSiteSettings);
  const styles = content.about_styles;

  useEffect(() => {
    loadAboutContent()
      .then(setContent)
      .catch((error) => {
        console.error("Failed to load about page content:", error);
      });
  }, []);

  useEffect(() => {
    loadSiteSettings()
      .then(setSiteSettings)
      .catch((error) => {
        console.error("Failed to load site settings:", error);
      });
  }, []);

  const showNewsletterSignup = siteSettings.subscription_enabled;
  const mailerLiteSubscribeUrl = siteSettings.mailerlite_linked
    ? siteSettings.mailerlite_subscribe_url
    : "";

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

      {showNewsletterSignup && (
        <div className="px-6 pt-6 md:hidden">
          <NewsletterSignup mailerLiteSubscribeUrl={mailerLiteSubscribeUrl} />
        </div>
      )}

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
      {showNewsletterSignup && (
        <NewsletterSignup
          className="fixed bottom-6 right-6 z-40 hidden w-[360px] md:block"
          mailerLiteSubscribeUrl={mailerLiteSubscribeUrl}
        />
      )}
    </div>
  );
}
