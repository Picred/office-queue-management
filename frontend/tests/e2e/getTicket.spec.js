import { test, expect } from "@playwright/test";

test("the customer selects a service and gets a ticket for it", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Shipping" }).click();

    await expect(page.getByRole("heading", { name: "Your Ticket" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(/^S\d+$/);
    await expect(page.getByText("Shipping")).toBeVisible();
});

test("every ticket gets a different code", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Shipping" }).click();
    const first = await page.getByRole("heading", { level: 2 }).textContent();

    await page.getByRole("button", { name: "Get another ticket" }).click();
    await page.getByRole("button", { name: "Shipping" }).click();
    const second = page.getByRole("heading", { level: 2 });

    await expect(second).toHaveText(/^S\d+$/);
    await expect(second).not.toHaveText(first);
});
