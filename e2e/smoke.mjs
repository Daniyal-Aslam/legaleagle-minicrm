/**
 * Browser smoke test for the core CRM workflows.
 *
 *   BASE_URL=http://localhost:3000 CHROME_PATH="/path/to/chrome" npm run test:e2e
 *
 * Uses playwright-core with a locally installed Chrome/Edge (no browser download).
 */
import { chromium } from "playwright-core";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/google-chrome");

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(e.message));
page.on("console", (m) => {
  // The 404 and wrong-password checks intentionally trigger 404/401 responses, which Chrome logs.
  if (m.type() === "error" && !/status of (404|401)/.test(m.text())) problems.push(m.text());
});

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}\n    ${error.message.split("\n")[0]}`);
    await page.screenshot({ path: `e2e-failure-${passed + 1}.png`, fullPage: true });
    await browser.close();
    process.exit(1);
  }
}

const rows = () => page.locator("table tbody tr");
const toast = (text) => page.locator("[data-sonner-toast]", { hasText: text }).first().waitFor();

console.log(`Running against ${BASE}`);

await step("redirects signed-out visitors to sign in", async () => {
  await page.goto(`${BASE}/contacts`);
  await page.waitForURL(/\/login\?next=%2Fcontacts/);
  await page.getByRole("heading", { name: /intake desk today/ }).waitFor();
});

await step("rejects an incorrect password (email sign-in)", async () => {
  await page.getByRole("button", { name: "Sign in with email instead" }).click();
  await page.getByRole("textbox", { name: "Work email" }).fill("mariam@legaleagle.test");
  await page.getByRole("textbox", { name: "Password" }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Incorrect email or password." }).waitFor();
});

await step("signs in by picking a profile and returns to the requested page", async () => {
  await page.getByRole("button", { name: "Back to profiles" }).click();
  await page.getByRole("button", { name: /Mariam Al Hashimi/ }).click();
  await page.getByRole("button", { name: "Continue as Mariam" }).click();
  await page.waitForURL(/\/contacts$/);
  await page.getByRole("button", { name: "Account menu for Mariam Al Hashimi" }).waitFor();
});

await step("loads seeded contacts", async () => {
  await rows().first().waitFor();
  assert.equal(await rows().count(), 13);
});

await step("searches by name, company and phone digits", async () => {
  const search = page.getByRole("searchbox", { name: "Search contacts" });
  await search.fill("sandstone");
  await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length === 1);
  await search.fill("6631409");
  await page.locator("table tbody tr", { hasText: "Hassan Farouk" }).waitFor();
  assert.equal(await rows().count(), 1);
  await search.fill("zzzz-no-match");
  await page.getByText("No matching contacts").waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length === 13);
});

await step("filters each status and persists filters in the URL", async () => {
  const group = page.getByRole("group", { name: "Filter by status" });
  for (const [label, count] of [["Lead", 6], ["Active", 4], ["Closed", 3]]) {
    await group.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    await page.waitForFunction((n) => document.querySelectorAll("table tbody tr").length === n, count);
  }
  await page.waitForURL(/status=closed/);
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length === 3);
  await group.getByRole("button", { name: /^All/ }).click();
});

await step("sorts by name both directions", async () => {
  await page.getByRole("button", { name: /^Contact/ }).click();
  assert.match(await rows().first().innerText(), /Aisha Karimi/);
  await page.getByRole("button", { name: /^Contact/ }).click();
  assert.match(await rows().first().innerText(), /Victor Okafor/);
});

await step("validates the create form without losing input", async () => {
  await page.getByRole("button", { name: "Add contact" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("First name").fill("  Test  ");
  await dialog.getByLabel("Email").fill("not-an-email");
  await dialog.getByLabel("Phone").fill("12ab");
  await dialog.getByRole("button", { name: "Create contact" }).click();
  await dialog.getByText("Last name is required").waitFor();
  await dialog.getByText("Enter a valid email address", { exact: false }).waitFor();
  await dialog.getByText("Use digits, spaces, dashes or a leading +").waitFor();
  assert.equal(await dialog.getByLabel("First name").inputValue(), "  Test  ");
  // Duplicate email is rejected.
  await dialog.getByLabel("Last name").fill("Contact");
  await dialog.getByLabel("Email").fill("OMAR.HADDAD@sandstonelogistics.ae");
  await dialog.getByLabel("Phone").fill("+971 50 555 0101");
  await dialog.getByRole("button", { name: "Create contact" }).click();
  await dialog.getByText("Another contact already uses this email address").waitFor();
});

await step("creates a contact", async () => {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill("test.contact@example.ae");
  await dialog.getByLabel("Company or organisation").fill("QA Holdings");
  await dialog.getByRole("button", { name: "Create contact" }).click();
  await toast("Test Contact added");
  await page.locator("table tbody tr", { hasText: "Test Contact" }).waitFor();
  assert.equal(await rows().count(), 14);
});

await step("opens details, adds a note and records activity", async () => {
  await page.locator("table tbody tr", { hasText: "Test Contact" }).getByRole("link").click();
  await page.getByRole("heading", { level: 1, name: "Test Contact" }).waitFor();
  await page.getByLabel("New note").fill("Called the client to confirm consultation.");
  await page.getByRole("button", { name: "Add note" }).click();
  await toast("Note added");
  await page.locator("section[aria-labelledby=notes-heading]").getByText("Called the client").waitFor();
  await page.locator("section[aria-labelledby=activity-heading]").getByText("Note added").waitFor();
});

await step("logs a follow-up", async () => {
  await page.getByRole("button", { name: "Log follow-up" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Email" }).click();
  await dialog.getByLabel("Summary").fill("Sent intake questionnaire.");
  await dialog.getByRole("button", { name: "Record follow-up" }).click();
  await page.getByText("Email follow-up recorded").waitFor();
});

await step("edits a contact and records changed fields", async () => {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Phone").fill("+971 50 555 0199");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await toast("Contact updated");
  await page.getByText("Updated phone").waitFor();
});

await step("moves Lead → Active → Closed from the pipeline menu", async () => {
  await page.goto(`${BASE}/pipeline`);
  const lead = page.locator("section[aria-labelledby=pipeline-lead-heading]");
  await lead.getByRole("button", { name: "Move Test Contact to another stage" }).click();
  await page.getByRole("menuitemradio", { name: /^Active/ }).click();
  const active = page.locator("section[aria-labelledby=pipeline-active-heading]");
  await active.getByText("Test Contact").waitFor();
  await active.getByRole("button", { name: "Move Test Contact to another stage" }).click();
  await page.getByRole("menuitemradio", { name: /^Closed/ }).click();
  await page.locator("section[aria-labelledby=pipeline-closed-heading]").getByText("Test Contact").waitFor();
});

await step("moves a card with pointer drag-and-drop", async () => {
  const card = page.locator("section[aria-labelledby=pipeline-lead-heading] article", { hasText: "Layla Rahman" });
  const target = page.locator("section[aria-labelledby=pipeline-active-heading]");
  const from = await card.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from.x + 40, from.y + 60);
  await page.mouse.down();
  await page.mouse.move(from.x + 80, from.y + 80, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 200, { steps: 15 });
  await page.mouse.up();
  await target.getByText("Layla Rahman").waitFor();
});

await step("persists changes after refresh and syncs the details page", async () => {
  await page.reload();
  await page.locator("section[aria-labelledby=pipeline-closed-heading]").getByText("Test Contact").waitFor();
  await page.locator("section[aria-labelledby=pipeline-closed-heading]").getByRole("link", { name: "Test Contact" }).click();
  const timeline = page.locator("section[aria-labelledby=activity-heading]");
  await timeline.getByText("Moved from Lead to Active").waitFor();
  await timeline.getByText("Moved from Active to Closed").waitFor();
  await page.getByText("Called the client to confirm consultation.").first().waitFor();
});

await step("deletes a contact with confirmation", async () => {
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Delete contact" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete contact" }).click();
  await page.waitForURL(/\/contacts$/);
  await rows().first().waitFor();
  assert.equal(await rows().count(), 13);
  assert.equal(await page.locator("table tbody tr", { hasText: "Test Contact" }).count(), 0);
});

await step("shows a not-found state for invalid contact routes", async () => {
  await page.goto(`${BASE}/contacts/does-not-exist`);
  await page.getByText("Contact not found").waitFor();
  await page.goto(`${BASE}/no-such-page`);
  await page.getByText("This page doesn't exist").waitFor();
});

await step("recovers from corrupted storage", async () => {
  await page.goto(`${BASE}/contacts`);
  await rows().first().waitFor(); // let the app hydrate before corrupting storage
  await page.evaluate(() => localStorage.setItem("legal-eagle-crm:v1", "{broken"));
  await page.reload();
  await toast("Saved data couldn't be read");
  await rows().first().waitFor();
  assert.equal(await rows().count(), 13);
});

await step("resets demo data", async () => {
  await page.getByRole("button", { name: /^Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Reset sample data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reset data" }).click();
  await toast("Sample data restored");
  assert.equal(await rows().count(), 13);
  // Layla was moved during the drag test; reset puts her back in Lead.
  await page.goto(`${BASE}/pipeline`);
  await page.locator("section[aria-labelledby=pipeline-lead-heading]").getByText("Layla Rahman").waitFor();
});

await step("mobile layout has no horizontal overflow", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/contacts", "/pipeline", "/contacts/ct_c01"]) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `overflow on ${path}`);
  }
});

await step("signs out and protects the app again", async () => {
  await page.getByRole("button", { name: /^Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/login$/);
  await page.goto(`${BASE}/pipeline`);
  await page.waitForURL(/\/login\?next=%2Fpipeline/);
});

await browser.close();
assert.deepEqual(problems, [], `Console errors: ${problems.join(" | ")}`);
console.log(`\n${passed} workflow checks passed, no console errors.`);
