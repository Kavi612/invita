import { test, expect } from "@playwright/test";

test.describe("Event Creation & Management Flow", () => {
  test("Community Admin can create a new physical venue event", async ({ page }) => {
    // Login as Community Admin (Marcus Vance)
    await page.goto("/login");
    await page.getByText("Marcus Vance").click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Events page
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Events & Celebrations" })).toBeVisible();

    // Click 'Create Event' button
    await page.getByRole("button", { name: "Create Event" }).click();

    // Verify dialog opens
    await expect(page.getByRole("heading", { name: "Create New Event" })).toBeVisible();

    // Fill the required event details
    const testTitle = `Spring Orchid Gala ${Date.now()}`;
    await page.getByLabel("Event Title *").fill(testTitle);
    await page.getByLabel("Description & Programme Overview *").fill(
      "Annual botanical celebration with banquet, music, and awards."
    );
    await page.getByLabel("Venue / Hall Name *").fill("The Grand Conservatory");
    await page.getByLabel("City & State").fill("Belvedere, CA");

    // Submit the form
    await page.getByRole("button", { name: "Create Event" }).last().click();

    // Dialog should close and event should be displayed
    await expect(page.getByRole("heading", { name: "Create New Event" })).not.toBeVisible();
    await expect(page.getByText(testTitle)).toBeVisible();
  });
});
