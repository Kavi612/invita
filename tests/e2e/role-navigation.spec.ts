import { test, expect } from "@playwright/test";

test.describe("Role-Based Navigation & Permissions", () => {
  test("Community Admin has event creation and registry access", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Marcus Vance").click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify navigation sidebar links
    await expect(page.locator("aside a[href='/members']")).toBeVisible();
    await expect(page.locator("aside a[href='/families']")).toBeVisible();
    await expect(page.locator("aside a[href='/events']")).toBeVisible();
    await expect(page.locator("aside a[href='/rsvps']")).toBeVisible();

    // Super Admin-only sections should be hidden for Community Admin
    await expect(page.locator("aside a[href='/admin']")).not.toBeVisible();

    // Verify Create Event button is visible on /events
    await page.goto("/events");
    await expect(page.getByRole("button", { name: "Create Event" })).toBeVisible();
  });

  test("Family Head can manage family but cannot create events", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("David K. Thornton").click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigation for Family Head
    await expect(page.locator("aside a[href='/families']")).toBeVisible();
    await expect(page.locator("aside a[href='/rsvps']")).toBeVisible();

    // Navigate to /events
    await page.goto("/events");
    // Create Event button is protected and shows restricted fallback
    await expect(page.getByText("Admin permissions required to create events")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Event" })).not.toBeVisible();
  });

  test("Family Member has view-only access and cannot access family registry admin", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Amara Patel").click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Member navigation
    await expect(page.locator("aside a[href='/members']")).toBeVisible();
    await expect(page.locator("aside a[href='/events']")).toBeVisible();

    // Member cannot see Family Registry or RSVP Management in sidebar
    await expect(page.locator("aside a[href='/families']")).not.toBeVisible();
    await expect(page.locator("aside a[href='/rsvps']")).not.toBeVisible();

    // Member cannot create events
    await page.goto("/events");
    await expect(page.getByRole("button", { name: "Create Event" })).not.toBeVisible();
  });
});
