import { test, expect } from "@playwright/test";

test.describe("Public Guest RSVP Flow", () => {
  test("guest can accept invitation, view calendar link, and edit response to decline", async ({ page }) => {
    // Navigate to pending guest invitation
    await page.goto("/rsvp/tok_pending_vance_01");

    // Check event details are rendered
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("INVITA GATHERING PASS")).toBeVisible();
    await expect(page.getByText("Will you be joining us?")).toBeVisible();

    // Select "Joyfully Accept"
    await page.getByText("Joyfully Accept").click();

    // Verify meal options and guest counter exist
    await expect(page.getByText("Total Attending Headcount")).toBeVisible();
    await expect(page.getByText("Culinary Entrée Selection")).toBeVisible();

    // Fill dietary requirement
    await page.getByPlaceholder("e.g. Nut allergy, Celiac gluten-free, Kosher...").fill("Gluten-free, no dairy");

    // Submit RSVP
    await page.getByRole("button", { name: "Confirm & Submit RSVP" }).click();

    // Verify confirmation view
    await expect(page.getByText("Attendance Confirmed!")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to Google Calendar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Modify Response" })).toBeVisible();

    // Verify Google Calendar link has valid target and URL structure
    const gcalLink = page.getByRole("link", { name: "Add to Google Calendar" });
    const href = await gcalLink.getAttribute("href");
    expect(href).toContain("calendar.google.com");

    // Click "Modify Response"
    await page.getByRole("button", { name: "Modify Response" }).click();

    // Change response to "Regretfully Decline"
    await page.getByText("Regretfully Decline").click();
    await page.getByRole("button", { name: "Save & Update RSVP" }).click();

    // Verify declined state
    await expect(page.getByText("Invitation Declined")).toBeVisible();
  });

  test("displays expired deadline banner for expired token", async ({ page }) => {
    await page.goto("/rsvp/tok_expired_blackwood_99");

    await expect(page.getByText("RSVP Deadline Passed")).toBeVisible();
  });

  test("displays invalid token error state when token does not exist", async ({ page }) => {
    await page.goto("/rsvp/invalid-token-xyz-12345");

    await expect(page.getByRole("heading", { name: "Invitation Not Found" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Return to Invita Platform" })).toBeVisible();
  });
});
