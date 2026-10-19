import { test, expect } from "@playwright/test";

test.describe("Authentication & Role Login Flow", () => {
  test("renders login page with form and quick role selector", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Welcome to Invita" })).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In to Invita" })).toBeVisible();

    // Quick role test accounts
    await expect(page.getByText("Instant Role Testing (4 Roles)")).toBeVisible();
    await expect(page.getByText("Marcus Vance")).toBeVisible();
    await expect(page.getByText("Sophia Chen")).toBeVisible();
    await expect(page.getByText("David K. Thornton")).toBeVisible();
    await expect(page.getByText("Amara Patel")).toBeVisible();
  });

  test("shows validation error on invalid email", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email Address").fill("notanemail");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In to Invita" }).click();

    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  });

  test("authenticates via credentials and redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email Address").fill("marcus.v@heritagehills.org");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In to Invita" }).click();

    // Redirects to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText("Heritage Hills Collective").first()).toBeVisible();
  });

  test("supports 1-click Quick Role Switcher login", async ({ page }) => {
    await page.goto("/login");

    // Click on Family Head (David K. Thornton)
    await page.getByText("David K. Thornton").click();

    await expect(page).toHaveURL(/.*dashboard/);
    // Role badge should reflect Family Head
    await expect(page.getByText("Family Head").first()).toBeVisible();
  });
});
