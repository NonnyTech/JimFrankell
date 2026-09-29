import { test, expect } from "@playwright/test";
test("desktop navigation, catalog, filtering, gallery and persistent cart", async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.category-card')).toHaveCount(4);
  await expect(page.locator('.category-browser')).not.toContainText('Solar Kits');
  await expect(page.locator('.category-browser')).not.toContainText('Batteries');
  await expect(page.locator('.category-browser')).not.toContainText('Accessories');
  await page.locator('.category-card').filter({hasText:'Spy Cameras'}).click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expect(page.locator('.product-card')).toHaveCount(13);
  await page.getByRole('textbox',{name:'Search products',exact:true}).fill('yellow');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('textbox',{name:'Search products',exact:true}).fill('no-matching-product');
  await expect(page.getByRole('heading',{name:'No products match your search.'})).toBeVisible();
  await page.goto('/product/silver-multi-camera');
  await page.getByRole('button',{name:'View image 2'}).click();
  await expect(page.locator('.detail-image img')).toHaveAttribute('src','/images/products/jf/silver-cutout.webp');
  await page.getByRole('button',{name:'Increase quantity'}).click();
  await page.getByRole('button',{name:'Add to quote',exact:true}).click();
  await page.getByRole('link',{name:'Quote basket, 2 items'}).click();
  await page.reload();
  await expect(page.locator('.quantity')).toContainText('2');
  await expect(page.locator('.order-summary')).toContainText('Quotation required');
  const url=new URL(await page.getByRole('link',{name:'Request quote on WhatsApp'}).getAttribute('href'));
  expect(url.pathname).toBe('/2348061552184');
  expect(url.searchParams.get('text')).toContain('Quantity: 2');
  await page.getByRole('button',{name:/Remove JF Solar Camera/}).click();
  await expect(page.getByRole('heading',{name:'Your quote basket is empty.'})).toBeVisible();
  await page.goto('/product/5kva-hybrid-inverter');
  await expect(page.getByRole('heading',{level:1})).toContainText('connected');
});
test("mobile menu and page layouts stay inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Shop", exact: true })
    .click();
  await expect(page.getByRole("navigation")).toBeHidden();
  for (const url of [
    "/",
    "/shop",
    "/product/jf-hybrid-solar-inverter",
    "/cart",
    "/about",
    "/contact",
    "/faq",
  ]) {
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.goto("/product/jf-hybrid-solar-inverter");
  await page.getByRole("button", { name: "Add to quote", exact: true }).click();
  await page.goto("/cart");
  await expect(
    page.getByRole("link", { name: "Request quote on WhatsApp" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("contact validation, success, errors and duplicate submission protection", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByLabel("Full name")).toBeFocused();
  await page.getByLabel("Full name").fill("Test Customer");
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByLabel("Phone number").fill("+234 (800) 000-0000");
  expect(
    await page
      .getByLabel("Phone number")
      .evaluate((input) => input.checkValidity()),
  ).toBe(true);
  await page.getByLabel("Subject").fill("Solar enquiry");
  await page
    .locator('textarea[name="message"]')
    .fill("I would like help choosing a solar system.");
  let calls = 0;
  await page.route("**/api/contact", async (route) => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"success":true}',
    });
  });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled();
  await expect(page.locator(".form-status")).toContainText(
    "Your message has been sent successfully",
  );
  expect(calls).toBe(1);
  await expect(page.getByLabel("Full name")).toHaveValue("");
  await page.unroute("**/api/contact");
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"Unavailable"}',
    }),
  );
  await page.getByLabel("Full name").fill("Test Customer");
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByLabel("Subject").fill("Solar enquiry");
  await page
    .locator('textarea[name="message"]')
    .fill("I would like help choosing a solar system.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".form-status")).toContainText(
    "We couldn't send your message right now",
  );
  await expect(page.getByLabel("Full name")).toHaveValue("Test Customer");
});

test("header search, repeated additions, clear cart and damaged storage recovery", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await page.locator("#header-query").fill("JF Hybrid Solar Inverter");
  await page
    .locator(".header-search")
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Add JF Hybrid Solar Inverter to quote basket" })
    .click();
  await expect(page.getByRole("link", { name: "Quote basket, 1 items" })).toBeVisible();
  await page
    .getByRole("button", { name: "Add JF Hybrid Solar Inverter to quote basket" })
    .click();
  await page.getByRole("link", { name: "Quote basket, 2 items" }).click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear basket", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your quote basket is empty." }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem("jf-cart", "not-valid-json"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your quote basket is empty." }),
  ).toBeVisible();
  expect((await request.get("/api/contact")).status()).toBe(405);
  expect((await request.post("/api/contact", { data: {} })).status()).toBe(400);
  expect(
    (
      await request.post("/api/contact", {
        data: { message: "x".repeat(13000) },
      })
    ).status(),
  ).toBe(413);
});
