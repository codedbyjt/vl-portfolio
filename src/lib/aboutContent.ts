import { supabase } from "./supabase";

export interface AboutTextStyle {
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono";
}

export interface AboutStyles {
  pageTitle: AboutTextStyle;
  intro: AboutTextStyle;
  sectionHeading: AboutTextStyle;
  sectionBody: AboutTextStyle;
  contactLink: AboutTextStyle;
}

export interface AboutSection {
  id: string;
  heading: string;
  body: string;
}

export interface AboutContent {
  id: "about";
  page_title: string;
  intro: string;
  services_heading: string;
  services: string[];
  clients_heading: string;
  clients: string[];
  about_sections: AboutSection[];
  contact_section: AboutSection;
  contact_heading: string;
  contact_email: string;
  about_styles: AboutStyles;
}

export const defaultAboutStyles: AboutStyles = {
  pageTitle: {
    fontSize: 13,
    fontFamily: "sans",
  },
  intro: {
    fontSize: 15,
    fontFamily: "sans",
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "sans",
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: "sans",
  },
  contactLink: {
    fontSize: 14,
    fontFamily: "sans",
  },
};

export const defaultAboutContent: AboutContent = {
  id: "about",
  page_title: "About",
  intro:
    "Vic Lentaigne is a photographer and visual director based in London, specialising in editorial, commercial, and personal visual storytelling.",
  services_heading: "Services",
  services: ["Editorial Photography", "Commercial Campaigns", "Film & Direction"],
  clients_heading: "Selected Clients",
  clients: ["Vogue", "i-D Magazine", "Dazed", "Nike", "Adidas", "Spotify"],
  about_sections: [
    {
      id: "services",
      heading: "Services",
      body: "<div>Editorial Photography</div><div>Commercial Campaigns</div><div>Film &amp; Direction</div>",
    },
    {
      id: "clients",
      heading: "Selected Clients",
      body: "<div>Vogue</div><div>i-D Magazine</div><div>Dazed</div><div>Nike</div><div>Adidas</div><div>Spotify</div>",
    },
  ],
  contact_section: {
    id: "contact",
    heading: "Contact",
    body: "<div>hello@viclentaigne.com</div>",
  },
  contact_heading: "Contact",
  contact_email: "hello@viclentaigne.com",
  about_styles: defaultAboutStyles,
};

const allowedRichTags = new Set([
  "B",
  "I",
  "U",
  "STRONG",
  "EM",
  "SPAN",
  "BR",
  "DIV",
]);
const allowedFontFamilies = new Set(["sans-serif", "serif", "monospace"]);
const allowedTextAlignments = new Set(["left", "center", "right"]);

function isSafeTextColour(value: string) {
  const hexPattern = /^#[0-9a-f]{6}$/i;
  const rgbMatch = value.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
  );

  if (hexPattern.test(value)) return true;
  if (!rgbMatch) return false;

  return rgbMatch
    .slice(1)
    .every((part) => Number(part) >= 0 && Number(part) <= 255);
}

export function sanitizeRichText(html: string) {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  const cleanNode = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;

        if (!allowedRichTags.has(element.tagName)) {
          element.replaceWith(...Array.from(element.childNodes));
          return;
        }

        Array.from(element.attributes).forEach((attribute) => {
          if (attribute.name !== "style") element.removeAttribute(attribute.name);
        });

        const fontSize = element.style.fontSize;
        const fontFamily = element.style.fontFamily;
        const color = element.style.color;
        const textAlign = element.style.textAlign;
        const textDecorationLine = element.style.textDecorationLine;
        element.removeAttribute("style");

        const parsedFontSize = Number.parseInt(fontSize, 10);
        if (
          Number.isFinite(parsedFontSize) &&
          parsedFontSize >= 8 &&
          parsedFontSize <= 48
        ) {
          element.style.fontSize = `${parsedFontSize}px`;
        }

        const cleanFontFamily = fontFamily.replaceAll("\"", "").trim();
        if (allowedFontFamilies.has(cleanFontFamily)) {
          element.style.fontFamily = cleanFontFamily;
        }

        if (isSafeTextColour(color)) {
          element.style.color = color;
        }

        if (allowedTextAlignments.has(textAlign)) {
          element.style.textAlign = textAlign;
        }

        if (textDecorationLine === "underline") {
          element.style.textDecorationLine = "underline";
        }

        cleanNode(element);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };

  cleanNode(template.content);
  return template.innerHTML;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts = [
      maybeError.message,
      maybeError.details,
      maybeError.hint,
      maybeError.code ? `Code: ${maybeError.code}` : null,
    ].filter((part): part is string => typeof part === "string" && part.length > 0);

    if (parts.length > 0) return parts.join(" ");
  }
  return "Something went wrong.";
}

function normalizeAboutContent(data: Partial<AboutContent> | null): AboutContent {
  const aboutStyles = data?.about_styles ?? defaultAboutStyles;
  const aboutSections = Array.isArray(data?.about_sections)
    ? data.about_sections
    : [
        {
          id: "services",
          heading: data?.services_heading ?? defaultAboutContent.services_heading,
          body: (data?.services ?? defaultAboutContent.services)
            .map((item) => `<div>${sanitizeRichText(item)}</div>`)
            .join(""),
        },
        {
          id: "clients",
          heading: data?.clients_heading ?? defaultAboutContent.clients_heading,
          body: (data?.clients ?? defaultAboutContent.clients)
            .map((item) => `<div>${sanitizeRichText(item)}</div>`)
            .join(""),
        },
      ];
  const contactSection = data?.contact_section ?? {
    id: "contact",
    heading: data?.contact_heading ?? defaultAboutContent.contact_heading,
    body: `<div>${sanitizeRichText(
      data?.contact_email ?? defaultAboutContent.contact_email,
    )}</div>`,
  };

  return {
    ...defaultAboutContent,
    ...data,
    id: "about",
    services: Array.isArray(data?.services)
      ? data.services
      : defaultAboutContent.services,
    clients: Array.isArray(data?.clients)
      ? data.clients
      : defaultAboutContent.clients,
    about_sections: aboutSections.map((section, index) => ({
      id: section.id || `section-${index + 1}`,
      heading: sanitizeRichText(section.heading ?? ""),
      body: sanitizeRichText(section.body ?? ""),
    })),
    contact_section: {
      id: contactSection.id || "contact",
      heading: sanitizeRichText(contactSection.heading ?? ""),
      body: sanitizeRichText(contactSection.body ?? ""),
    },
    about_styles: {
      pageTitle: {
        ...defaultAboutStyles.pageTitle,
        ...aboutStyles.pageTitle,
      },
      intro: {
        ...defaultAboutStyles.intro,
        ...aboutStyles.intro,
      },
      sectionHeading: {
        ...defaultAboutStyles.sectionHeading,
        ...aboutStyles.sectionHeading,
      },
      sectionBody: {
        ...defaultAboutStyles.sectionBody,
        ...aboutStyles.sectionBody,
      },
      contactLink: {
        ...defaultAboutStyles.contactLink,
        ...aboutStyles.contactLink,
      },
    },
  };
}

export async function loadAboutContent() {
  const { data, error } = await supabase
    .from("about_page")
    .select("*")
    .eq("id", "about")
    .maybeSingle();

  if (error) throw error;
  return normalizeAboutContent(data as Partial<AboutContent> | null);
}

export async function saveAboutContent(content: AboutContent) {
  const { error } = await supabase.from("about_page").upsert({
    id: "about",
    page_title: content.page_title,
    intro: content.intro,
    services_heading: content.services_heading,
    services: content.services,
    clients_heading: content.clients_heading,
    clients: content.clients,
    about_sections: content.about_sections.map((section) => ({
      id: section.id,
      heading: sanitizeRichText(section.heading),
      body: sanitizeRichText(section.body),
    })),
    contact_section: {
      id: content.contact_section.id,
      heading: sanitizeRichText(content.contact_section.heading),
      body: sanitizeRichText(content.contact_section.body),
    },
    contact_heading: content.contact_heading,
    contact_email: content.contact_email,
    about_styles: content.about_styles,
  });

  if (error) throw error;
}
