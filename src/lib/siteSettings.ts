import { supabase } from "./supabase";

export type HomePageMode = "photography" | "landing";

export interface SiteSettings {
  home_page_mode: HomePageMode;
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
