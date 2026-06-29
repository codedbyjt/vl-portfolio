import { supabase } from "./supabase";

export type HomePageMode = "photography" | "landing";

export interface SiteNavItem {
  id: string;
  label: string;
  path: string;
  external: boolean;
  visible: boolean;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  intro: string;
  body: string;
  image_url: string;
  button_label: string;
  button_url: string;
  visible: boolean;
}

export interface SiteSettings {
  home_page_mode: HomePageMode;
  logo_url: string;
  logo_alt_text: string;
  photography_nav_label: string;
  photography_main_label: string;
  photography_main_path: string;
  photography_commercial_label: string;
  photography_commercial_path: string;
  photography_commercial_visible: boolean;
  photography_nav_items: SiteNavItem[];
  nav_items: SiteNavItem[];
  custom_pages: CustomPage[];
  subscription_enabled: boolean;
  mailerlite_subscribe_url: string;
  mailerlite_linked: boolean;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_image_url: string;
  seo_indexable: boolean;
}

export const defaultSiteSettings: SiteSettings = {
  home_page_mode: "photography",
  logo_url: "",
  logo_alt_text: "Vic Lentaigne",
  photography_nav_label: "Photography",
  photography_main_label: "Main Portfolio",
  photography_main_path: "/photography",
  photography_commercial_label: "Commercial",
  photography_commercial_path: "/photography/commercial",
  photography_commercial_visible: true,
  photography_nav_items: [
    {
      id: "main-portfolio",
      label: "Main Portfolio",
      path: "/photography",
      external: false,
      visible: true,
    },
    {
      id: "commercial",
      label: "Commercial",
      path: "/photography/commercial",
      external: false,
      visible: true,
    },
  ],
  nav_items: [
    {
      id: "video",
      label: "Video",
      path: "/video",
      external: false,
      visible: true,
    },
    { id: "shop", label: "Shop", path: "/shop", external: false, visible: true },
    {
      id: "instagram",
      label: "Instagram",
      path: "https://www.instagram.com/viclentaigne/",
      external: true,
      visible: true,
    },
    {
      id: "about",
      label: "About",
      path: "/about",
      external: false,
      visible: true,
    },
  ],
  custom_pages: [],
  subscription_enabled: true,
  mailerlite_subscribe_url:
    "https://assets.mailerlite.com/jsonp/2419708/forms/189799765443085665/subscribe",
  mailerlite_linked: true,
  seo_title: "Vic Lentaigne",
  seo_description: "Photography and film portfolio by Vic Lentaigne.",
  seo_keywords: "photography, film, director, portfolio, photographer",
  seo_image_url: "",
  seo_indexable: true,
};

const siteSettingKeys = [
  "home_page_mode",
  "logo_url",
  "logo_alt_text",
  "photography_nav_label",
  "photography_main_label",
  "photography_main_path",
  "photography_commercial_label",
  "photography_commercial_path",
  "photography_commercial_visible",
  "photography_nav_items",
  "nav_items",
  "custom_pages",
  "subscription_enabled",
  "mailerlite_subscribe_url",
  "mailerlite_linked",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "seo_image_url",
  "seo_indexable",
] as const;

function isHomePageMode(value: unknown): value is HomePageMode {
  return value === "photography" || value === "landing";
}

function getStringSetting(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function getBooleanSetting(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function getNavItemsSetting(
  value: unknown,
  fallback: SiteNavItem[] = defaultSiteSettings.nav_items,
) {
  const parsedValue = typeof value === "string" ? safeParseJson(value) : value;

  if (!Array.isArray(parsedValue)) return fallback;

  const navItems = parsedValue
    .map((item, index): SiteNavItem | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = getStringSetting(row.label, "").trim();
      const path = getStringSetting(row.path, "").trim();

      if (!label || !path) return null;

      return {
        id: getStringSetting(row.id, `nav-${index}`),
        label,
        path,
        external: getBooleanSetting(row.external, path.startsWith("http")),
        visible: getBooleanSetting(row.visible, true),
      };
    })
    .filter((item): item is SiteNavItem => Boolean(item));

  return navItems.length > 0 ? navItems : fallback;
}

function getCustomPagesSetting(value: unknown) {
  const parsedValue = typeof value === "string" ? safeParseJson(value) : value;

  if (!Array.isArray(parsedValue)) return defaultSiteSettings.custom_pages;

  return parsedValue
    .map((item, index): CustomPage | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = getStringSetting(row.title, "").trim();
      const slug = cleanPageSlug(getStringSetting(row.slug, title));

      if (!title || !slug) return null;

      return {
        id: getStringSetting(row.id, `page-${index}`),
        title,
        slug,
        intro: getStringSetting(row.intro, ""),
        body: getStringSetting(row.body, ""),
        image_url: getStringSetting(row.image_url, ""),
        button_label: getStringSetting(row.button_label, ""),
        button_url: getStringSetting(row.button_url, ""),
        visible: getBooleanSetting(row.visible, true),
      };
    })
    .filter((item): item is CustomPage => Boolean(item));
}

export function cleanPageSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", [...siteSettingKeys]);

  if (error) throw error;

  const values = new Map(
    (data ?? []).map((row) => [row.key as string, row.value as unknown]),
  );
  const homePageMode = values.get("home_page_mode");

  return {
    home_page_mode: isHomePageMode(homePageMode)
      ? homePageMode
      : defaultSiteSettings.home_page_mode,
    logo_url: getStringSetting(
      values.get("logo_url"),
      defaultSiteSettings.logo_url,
    ),
    logo_alt_text: getStringSetting(
      values.get("logo_alt_text"),
      defaultSiteSettings.logo_alt_text,
    ),
    photography_nav_label: getStringSetting(
      values.get("photography_nav_label"),
      defaultSiteSettings.photography_nav_label,
    ),
    photography_main_label: getStringSetting(
      values.get("photography_main_label"),
      defaultSiteSettings.photography_main_label,
    ),
    photography_main_path: getStringSetting(
      values.get("photography_main_path"),
      defaultSiteSettings.photography_main_path,
    ),
    photography_commercial_label: getStringSetting(
      values.get("photography_commercial_label"),
      defaultSiteSettings.photography_commercial_label,
    ),
    photography_commercial_path: getStringSetting(
      values.get("photography_commercial_path"),
      defaultSiteSettings.photography_commercial_path,
    ),
    photography_commercial_visible: getBooleanSetting(
      values.get("photography_commercial_visible"),
      defaultSiteSettings.photography_commercial_visible,
    ),
    photography_nav_items: getNavItemsSetting(
      values.get("photography_nav_items"),
      [
        {
          id: "main-portfolio",
          label: getStringSetting(
            values.get("photography_main_label"),
            defaultSiteSettings.photography_main_label,
          ),
          path: getStringSetting(
            values.get("photography_main_path"),
            defaultSiteSettings.photography_main_path,
          ),
          external: false,
          visible: true,
        },
        {
          id: "commercial",
          label: getStringSetting(
            values.get("photography_commercial_label"),
            defaultSiteSettings.photography_commercial_label,
          ),
          path: getStringSetting(
            values.get("photography_commercial_path"),
            defaultSiteSettings.photography_commercial_path,
          ),
          external: false,
          visible: getBooleanSetting(
            values.get("photography_commercial_visible"),
            defaultSiteSettings.photography_commercial_visible,
          ),
        },
      ],
    ),
    nav_items: getNavItemsSetting(values.get("nav_items")),
    custom_pages: getCustomPagesSetting(values.get("custom_pages")),
    subscription_enabled: getBooleanSetting(
      values.get("subscription_enabled"),
      defaultSiteSettings.subscription_enabled,
    ),
    mailerlite_subscribe_url: getStringSetting(
      values.get("mailerlite_subscribe_url"),
      defaultSiteSettings.mailerlite_subscribe_url,
    ),
    mailerlite_linked: getBooleanSetting(
      values.get("mailerlite_linked"),
      defaultSiteSettings.mailerlite_linked,
    ),
    seo_title: getStringSetting(
      values.get("seo_title"),
      defaultSiteSettings.seo_title,
    ),
    seo_description: getStringSetting(
      values.get("seo_description"),
      defaultSiteSettings.seo_description,
    ),
    seo_keywords: getStringSetting(
      values.get("seo_keywords"),
      defaultSiteSettings.seo_keywords,
    ),
    seo_image_url: getStringSetting(
      values.get("seo_image_url"),
      defaultSiteSettings.seo_image_url,
    ),
    seo_indexable: getBooleanSetting(
      values.get("seo_indexable"),
      defaultSiteSettings.seo_indexable,
    ),
  };
}

export async function saveSiteSettings(settings: SiteSettings) {
  const { error } = await supabase.from("site_settings").upsert(
    [
      { key: "home_page_mode", value: settings.home_page_mode },
      { key: "logo_url", value: settings.logo_url },
      { key: "logo_alt_text", value: settings.logo_alt_text },
      { key: "photography_nav_label", value: settings.photography_nav_label },
      { key: "photography_main_label", value: settings.photography_main_label },
      { key: "photography_main_path", value: settings.photography_main_path },
      {
        key: "photography_commercial_label",
        value: settings.photography_commercial_label,
      },
      {
        key: "photography_commercial_path",
        value: settings.photography_commercial_path,
      },
      {
        key: "photography_commercial_visible",
        value: String(settings.photography_commercial_visible),
      },
      {
        key: "photography_nav_items",
        value: JSON.stringify(settings.photography_nav_items),
      },
      { key: "nav_items", value: JSON.stringify(settings.nav_items) },
      { key: "custom_pages", value: JSON.stringify(settings.custom_pages) },
      {
        key: "subscription_enabled",
        value: String(settings.subscription_enabled),
      },
      {
        key: "mailerlite_subscribe_url",
        value: settings.mailerlite_subscribe_url,
      },
      { key: "mailerlite_linked", value: String(settings.mailerlite_linked) },
      { key: "seo_title", value: settings.seo_title },
      { key: "seo_description", value: settings.seo_description },
      { key: "seo_keywords", value: settings.seo_keywords },
      { key: "seo_image_url", value: settings.seo_image_url },
      { key: "seo_indexable", value: String(settings.seo_indexable) },
    ],
    { onConflict: "key" },
  );

  if (error) throw error;
}
