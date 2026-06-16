import { expect, test, type Page } from "@playwright/test";

const mailerLiteSubscribeUrl =
  "https://assets.mailerlite.com/jsonp/2419708/forms/189799765443085665/subscribe";

async function mockSiteSettings(
  page: Page,
  overrides: Record<string, string | boolean> = {},
) {
  const settings = {
    home_page_mode: "photography",
    subscription_enabled: true,
    mailerlite_subscribe_url: mailerLiteSubscribeUrl,
    mailerlite_linked: true,
    seo_title: "Vic Lentaigne",
    seo_description: "Photography and film portfolio by Vic Lentaigne.",
    seo_keywords: "photography, film, director, portfolio, photographer",
    seo_image_url: "",
    seo_indexable: true,
    ...overrides,
  };

  await page.route("**/rest/v1/site_settings?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        Object.entries(settings).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      ),
    });
  });
}

test("about page renders the newsletter signup", async ({ page }) => {
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await mockSiteSettings(page);
  await page.goto("/about");

  await expect(page.locator(".vite-error-overlay")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /portfolio updates/i }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: /portfolio updates/i }).first().click();

  const signupForm = page.locator(`form[action="${mailerLiteSubscribeUrl}"]`);

  await expect(signupForm.first()).toBeVisible();
  await expect(page.locator('input[name="fields[email]"]').first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^join$/i }).first()).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("newsletter signup validates and submits to MailerLite", async ({ page }) => {
  let mailerLiteRequestBody = "";
  let supabaseRequestBody = "";

  await page.route("https://assets.mailerlite.com/**/subscribe", async (route) => {
    mailerLiteRequestBody = route.request().postData() ?? "";

    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Subscribed</title>",
    });
  });
  await page.route("**/rest/v1/mailing_list_subscribers", async (route) => {
    supabaseRequestBody = route.request().postData() ?? "";

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: "[]",
    });
  });

  await mockSiteSettings(page);
  await page.goto("/about");
  await page.getByRole("button", { name: /portfolio updates/i }).first().click();

  const signupForm = page.locator(`form[action="${mailerLiteSubscribeUrl}"]`).first();
  const emailInput = page.locator('input[name="fields[email]"]').first();
  const joinButton = page.getByRole("button", { name: /^join$/i }).first();
  const iframeName = await signupForm.getAttribute("target");

  expect(iframeName).toBeTruthy();
  await expect(page.locator(`iframe[name="${iframeName}"]`)).toHaveCount(1);

  await emailInput.fill("not-an-email");
  await joinButton.click();

  await expect(page.getByText("Enter a valid email.")).toBeVisible();
  expect(mailerLiteRequestBody).toBe("");
  expect(supabaseRequestBody).toBe("");

  await emailInput.fill("VIC@EXAMPLE.COM");
  await joinButton.click();

  await expect(
    page.getByText("Subscribed. Portfolio updates incoming."),
  ).toBeVisible();
  await expect.poll(() => supabaseRequestBody).toContain(
    '"email":"vic@example.com"',
  );
  expect(supabaseRequestBody).toContain('"source":"about"');
  await expect.poll(() => mailerLiteRequestBody).toContain(
    "fields%5Bemail%5D=vic%40example.com",
  );
  expect(mailerLiteRequestBody).toContain("ml-submit=1");
  expect(mailerLiteRequestBody).toContain("anticsrf=true");
});

test("newsletter signup can be hidden from site settings", async ({ page }) => {
  await mockSiteSettings(page, { subscription_enabled: false });

  await page.goto("/about");

  await expect(
    page.getByRole("button", { name: /portfolio updates/i }),
  ).toHaveCount(0);
});
