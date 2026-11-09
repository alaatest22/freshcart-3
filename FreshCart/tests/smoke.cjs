const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const { spawn } = require("child_process");
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
  { cwd: path.resolve(__dirname, "..") },
);
process.on("exit", () => server.kill());
(async () => {
  await new Promise((resolve, reject) => {
    server.stdout.on("data", (d) => {
      if (d.toString().includes("Local:")) resolve();
    });
    server.on("error", reject);
  });
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.route(
    "https://ecommerce.routemisr.com/Route-Academy-*/**",
    (route) => route.abort(),
  );
  page.setDefaultNavigationTimeout(15000);
  const exceptions = [];
  page.on("pageerror", (e) => exceptions.push(e.message));
  const catalog = JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures/products.json"), "utf8"),
  );
  const categoryData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures/categories.json"), "utf8"),
  );
  const brands = JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures/brands.json"), "utf8"),
  );
  const product = catalog.data[0];
  let cart = [],
    wish = [],
    orders = [],
    failProducts = false,
    requestCounts = {};
  const token =
    "test." +
    Buffer.from(
      JSON.stringify({
        id: "test-user",
        name: "Test Shopper",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url") +
    ".signature";
  const cartData = () => ({
    _id: "test-cart",
    products: cart.map((x) => ({
      _id: x.id,
      product: catalog.data.find((p) => p._id === x.id),
      count: x.count,
      price: catalog.data.find((p) => p._id === x.id).price,
    })),
    totalCartPrice: cart.reduce(
      (sum, x) =>
        sum + catalog.data.find((p) => p._id === x.id).price * x.count,
      0,
    ),
  });
  const checkoutBodies = [];
  await page.route(
    "https://ecommerce.routemisr.com/api/v1/**",
    async (route) => {
      const req = route.request(),
        u = new URL(req.url()),
        path = u.pathname.replace("/api/v1", ""),
        method = req.method();
      const body = req.postDataJSON();
      requestCounts[path] = (requestCounts[path] || 0) + 1;
      const send = (json, status = 200) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(json),
        });
      if (path === "/auth/signin" || path === "/auth/signup")
        return send({
          token,
          user: { _id: "test-user", name: "Test Shopper" },
        });
      if (
        path === "/auth/forgotPasswords" ||
        path === "/auth/verifyResetCode" ||
        path === "/auth/resetPassword"
      )
        return send({ status: "Success", token });
      if (path === "/users/changeMyPassword")
        return send({
          token,
          user: { _id: "test-user", name: "Test Shopper" },
        });
      if (path === "/products") {
        if (failProducts)
          return send({ message: "Test service unavailable" }, 503);
        return send({
          ...catalog,
          data: catalog.data.slice(
            0,
            Number(u.searchParams.get("limit")) || 12,
          ),
          results: catalog.data.length,
          metadata: {
            numberOfPages: 2,
            currentPage: Number(u.searchParams.get("page") || 1),
          },
        });
      }
      if (path.startsWith("/products/"))
        return send({
          data:
            catalog.data.find((p) => p._id === path.split("/")[2]) || product,
        });
      if (path === "/categories")
        return send({
          ...categoryData,
          data: categoryData.data.slice(
            0,
            Number(u.searchParams.get("limit")) || 10,
          ),
        });
      if (path === "/brands") return send(brands);
      if (path.startsWith("/wishlist")) {
        if (method === "POST")
          wish.push(catalog.data.find((p) => p._id === body.productId));
        if (method === "DELETE")
          wish = wish.filter((p) => p._id !== path.split("/")[2]);
        return send({ status: "success", data: wish, count: wish.length });
      }
      if (path.startsWith("/cart")) {
        const id = path.split("/")[2];
        if (method === "POST") {
          const existing = cart.find((x) => x.id === body.productId);
          existing
            ? existing.count++
            : cart.push({ id: body.productId, count: 1 });
        }
        if (method === "PUT")
          cart = cart.map((x) =>
            x.id === id ? { ...x, count: body.count } : x,
          );
        if (method === "DELETE")
          cart = id ? cart.filter((x) => x.id !== id) : [];
        return send({
          status: "success",
          data: cartData(),
          numOfCartItems: cart.length,
        });
      }
      if (path.startsWith("/orders/checkout-session/")) {
        checkoutBodies.push({ url: u.toString(), body });
        return send({
          session: { url: "https://checkout.stripe.com/c/pay/test-session" },
        });
      }
      if (path === "/orders/test-cart") {
        orders.push({
          _id: "order-1",
          id: 101,
          createdAt: new Date().toISOString(),
          isPaid: false,
          isDelivered: false,
          paymentMethodType: "cash",
          totalOrderPrice: cartData().totalCartPrice,
          cartItems: cartData().products,
        });
        cart = [];
        return send({ status: "success", data: orders[0] });
      }
      if (path.startsWith("/orders/user/")) return send(orders);
      return send({ message: "Unhandled mock " + method + " " + path }, 404);
    },
  );
  await page.route("https://checkout.stripe.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Mock payment checkout</h1>",
    }),
  );
  await page.goto("http://127.0.0.1:5173/");
  await page
    .getByRole("heading", { name: "Good things, great finds." })
    .waitFor();
  await page.locator(".product-card").first().waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.goto("http://127.0.0.1:5173/cart");
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Testpass123");
  await page.getByRole("button", { name: "Sign in →" }).click();
  await page.getByRole("heading", { name: "Your cart is waiting" }).waitFor();
  await page.goto("http://127.0.0.1:5173/products/" + product._id);
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Added to your cart" })
    .waitFor();
  await page.getByRole("button", { name: "Save for later" }).click();
  await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
  await page.goto("http://127.0.0.1:5173/wishlist");
  await page.locator(".product-card").waitFor();
  await page.getByRole("button", { name: /Remove .* from wishlist/ }).click();
  await page
    .getByRole("heading", { name: "Your next favorite is out there" })
    .waitFor();
  await page.goto("http://127.0.0.1:5173/cart");
  await page.getByRole("button", { name: /Increase quantity/ }).click();
  await page.getByText("2", { exact: true }).first().waitFor();
  assert.equal(cart[0].count, 2);
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await page
    .getByLabel("Address and apartment details")
    .fill("Test address, apartment 2");
  await page.getByLabel("City", { exact: true }).fill("Cairo");
  await page.getByLabel("Phone number").fill("01012345678");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.waitForURL("https://checkout.stripe.com/**");
  assert.equal(checkoutBodies[0].body.shippingAddress.city, "Cairo");
  assert.equal(
    new URL(checkoutBodies[0].url).searchParams.get("url"),
    "http://127.0.0.1:5173",
  );
  await page.goto("http://127.0.0.1:5173/checkout");
  await page
    .getByLabel("Address and apartment details")
    .fill("Test address, apartment 2");
  await page.getByLabel("City", { exact: true }).fill("Cairo");
  await page.getByLabel("Phone number").fill("01012345678");
  await page.getByRole("radio", { name: /Cash on delivery/ }).check();
  await page.getByRole("button", { name: "Place cash order" }).click();
  await page.getByRole("heading", { name: "Order #101" }).waitFor();
  assert.equal(orders[0].isPaid, false);
  assert.equal(cart.length, 0);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("http://127.0.0.1:5173/forgot-password");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByRole("button", { name: "Send reset code" }).click();
  await page.getByLabel("Reset code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify code" }).click();
  await page.getByLabel("New password", { exact: true }).fill("Newpass123");
  await page.getByLabel("Confirm password").fill("Newpass123");
  await page.getByRole("button", { name: "Update password" }).click();
  await page.waitForURL("**/login");
  await page.goto("http://127.0.0.1:5173/register");
  await page.getByLabel("Full name").fill("Test Shopper");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Testpass123");
  await page.getByLabel("Confirm password").fill("Wrongpass123");
  await page.getByLabel("Egyptian mobile number").fill("01012345678");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText("Passwords do not match.").waitFor();
  await page.getByLabel("Confirm password").fill("Testpass123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("http://127.0.0.1:5173/");
  await page.goto("http://127.0.0.1:5173/products");
  await page.locator(".product-card").first().waitFor();
  await page.getByRole("button", { name: "Next →" }).click();
  assert.equal(new URL(page.url()).searchParams.get("page"), "2");
  failProducts = true;
  await page.goto("http://127.0.0.1:5173/products");
  await page.getByText("Test service unavailable").waitFor();
  failProducts = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await page.locator(".product-card").first().waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/products",
    "/categories",
    "/brands",
    "/cart",
    "/wishlist",
    "/account",
    "/allorders",
    "/products/" + product._id,
  ]) {
    await page.goto("http://127.0.0.1:5173" + path);
    await page.locator("main").waitFor();
    await page.waitForTimeout(250);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "mobile overflow " + path,
    );
  }
  assert.deepEqual(exceptions, []);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        checks: [
          "desktop rendering",
          "mobile overflow on 9 routes",
          "protected route redirect and login return",
          "product details",
          "wishlist add/remove",
          "cart add/quantity",
          "online checkout request and redirect (mock)",
          "cash order and unpaid status (mock)",
          "password reset flow (mock)",
          "registration mismatch and success (mock)",
          "pagination",
          "API error and retry",
        ],
        pageErrors: exceptions,
      },
      null,
      2,
    ),
  );
  await browser.close();
  server.kill();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
