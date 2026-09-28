# Jim-Frankell Ltd storefront

A responsive solar security and renewable energy catalog. Customers browse local product data, build a persistent cart and continue their order through WhatsApp. No online payment, database, authentication or admin interface is included.

## Run locally

Requires Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173/** (also http://localhost:5173/). On Windows with restricted PowerShell script execution, use `npm.cmd` instead of `npm` and `npx.cmd` instead of `npx`. Vite prints a different port if 5173 is occupied.

```sh
npm run build
npm run preview
```

The production build is in `dist/`. Preview is at **http://127.0.0.1:4173/**. `vite preview` serves only static assets; test email locally using `npm run dev`, which includes `/api/contact`, or on a deployed serverless host.

## Technology and structure

React, Vite, JavaScript, React Router, Lucide icons and modern CSS. React Context manages the cart; native Fetch handles enquiries. The only server functionality is a Brevo email endpoint. Playwright and Node's test runner provide verification; Prettier formats the source.

```text
api/contact.js                  Vercel contact adapter
netlify/functions/contact.mjs   Netlify contact adapter
server/contact.js              Validation, abuse controls, server-only Brevo call
public/
  favicon.svg                   Replaceable brand mark
  images/solar-home.svg          Original local hero illustration
  images/products/              Original local product illustrations
scripts/generate-assets.mjs     Recreates the sample illustrations
src/
  components/                   Header/footer layout, cards, reusable UI
  config/businessConfig.js      Company identity, contacts, currency, social URLs
  context/CartContext.jsx       Cart, persistence and notifications
  data/products.js              Complete sample product catalog and categories
  data/faqs.js                  Editable FAQ answers
  pages/                        Home, Shop, ProductDetails, Cart, About, Contact,
                                FAQ and NotFound
  services/contactService.js    Browser request to /api/contact
  styles/global.css             Desktop, tablet and mobile styling
  utils/                        Currency and WhatsApp message utilities
  main.jsx                      Routing, metadata and error boundary
tests/core.test.js              Inventory, WhatsApp and email tests
tests/browser/                 Interactive desktop and mobile checks
.env.example                   Empty server-side settings template
vite.config.js                 Frontend build and local email endpoint
netlify.toml                   Netlify build and routing configuration
vercel.json                    Vercel clean URLs and response headers
```

Routes: `/`, `/shop`, `/product/:slug`, `/cart`, `/about`, `/contact`, `/faq`, and a custom catch-all 404. Unknown product slugs use the same 404 view. The build prerenders every route. Vercel and Netlify serve a custom HTTP 404 for unknown paths.

## Change business details and WhatsApp

Edit `src/config/businessConfig.js`. This is the single source for the company name, logo path, phone, WhatsApp number, email, address, hours, currency/locale and social media links.

Set `whatsappNumber` to the owner's full international number, including country code, **without the local leading zero**. For Nigeria, use the actual number beginning with `234`. Do not enter a random number. Leave unused social URLs empty; their icons remain hidden. Confirm the Lagos address and replace it with the actual business address.

Until a valid WhatsApp number is configured, buttons show a clear notification and do not contact anyone. Phone/email links are omitted until configured. These values are intentionally empty in the supplied project.

The utility in `src/utils/whatsapp.js` creates `https://wa.me/{number}?text={encodedMessage}`. Cart checkout includes every product name, quantity, unit price, line subtotal and total, then asks for delivery and availability confirmation. The customer must send the prefilled message in WhatsApp. Clicking the link does not submit an order automatically. The cart is retained after opening WhatsApp.

## Add or edit products

The eight owner-supplied solar security camera photographs are stored in `public/images/products/*.jpg`. Their listings are in `src/data/securityProducts.js` and replace sample products in the homepage featured section. The Solar Security Cameras category links to all eight. Names describe the pictured designs; confirm actual model names, brands, specifications, stock and warranties with the owner. Prices are `null` (displayed as “Price on request”); replace with confirmed numeric prices when available. Carts containing these items request a complete quotation rather than presenting an incomplete numeric order total. The original sample inventory remains in `src/data/products.js` for the other product categories.

**All supplied names, prices, brands, specifications, old prices, stock flags and warranty descriptions are sample data. Replace them with verified business information before publishing.**

Edit `src/data/products.js`. Its compact sample `rows` are transformed into complete product objects. Each exported product has:

```js
{
  id: 17, // stable, unique ID; preserve this when editing an existing product
  slug: 'your-product-name', // unique URL-safe string
  name: 'Your product name',
  shortDescription: 'Short product summary.',
  description: 'Verified full description.',
  category: 'Inverters', // matches a category name
  brand: 'Actual brand',
  price: 425000, // numeric price, no currency symbol
  oldPrice: null, // actual previous price only
  images: ['/images/products/your-product.webp'],
  inStock: true,
  featured: true,
  bestSeller: false,
  specifications: { Capacity: '5KVA', Voltage: '48V' },
  warranty: 'Owner-approved warranty details.'
}
```

You can replace the generated `products` array with an explicit array of objects like this for individual control. Specifications render dynamically. Update `categories` in the same file for category imagery and descriptions. Set true bestseller flags only when supported by actual sales information. Prices use `Intl.NumberFormat` and the configured currency. The cart stores IDs and quantities rather than copies of prices; it resolves current catalog prices on reload. Quantities are capped at 99 and unavailable/removed products are dropped when restoring stored carts.

Filters use URL parameters (`q`, `category`, `brand`, `stock`, `sort`) so filtered views can be shared. Search covers names, brands, categories, descriptions and specification values.

## Replace images

Place owned/licensed product photographs in `public/images/products/` and update each product's `images` array. Use the first image for cards; subsequent images appear as gallery thumbnails. Optimize photos as WebP/AVIF/JPEG, use consistent aspect ratios, and supply sufficient resolution for the detail view. Replace category image paths separately in `categories` when needed.

The supplied SVGs are original schematic illustrations created for this project, **not photographs or depictions of specific manufacturer models**. `scripts/generate-assets.mjs` regenerates them and overwrites the sample filenames, so do not run it over customized assets. Broken images fall back to `public/images/products/fallback.svg`. Replace `public/images/solar-home.svg` for different hero artwork. No remote image services are used. DM Sans and Manrope are bundled locally through Fontsource (SIL Open Font License), with system font fallbacks. No external font request is needed.

## Brevo configuration

Copy `.env.example` to `.env` in the root and set:

```dotenv
BREVO_API_KEY=your_private_brevo_api_key
CONTACT_RECEIVER_EMAIL=the_owners_real_email
CONTACT_SENDER_EMAIL=your_brevo_verified_sender_email
CONTACT_SENDER_NAME=Jim-Frankell Website
```

Use a verified Brevo sender and configure your sending domain as required by Brevo. Restart Vite after changing environment variables. Set the same values in the hosting provider's **server environment**, then redeploy. See [Brevo's transactional email documentation](https://developers.brevo.com/docs/send-a-transactional-email).

The browser sends only `name`, `email`, `phone`, `subject`, `message` and the honeypot field to `POST /api/contact`. The server validates types, lengths, email, phone and header injection, then calls Brevo's `/v3/smtp/email`. Email includes all customer fields and an ISO timestamp; reply-to is the customer. Plain text avoids user-supplied HTML rendering. Timeouts and upstream failures produce a generic response; missing configuration fails honestly instead of showing a false success.

Never use a `VITE_` variable for the API key. Never import `server/contact.js` from `src/`. `.env` files are ignored by Git. Do not put credentials in the business configuration, README, screenshots or browser code. Vite uses server settings only in its development middleware; they are not defined in the browser bundle.

The endpoint includes a honeypot and a best-effort five-request/ten-minute per-instance IP limit. Serverless instances do **not** share counters. Enable host-level rate limits or a suitable bot challenge for stronger production abuse protection; no database is required by this application. Keep request/body limits enabled at your hosting edge. No email content or API keys are logged by the endpoint.

## Deploy

**Vercel:** import this project, use Vite defaults (`npm run build`, output `dist`) and Node 22+. The root `api/contact.js` provides the email function. `vercel.json` enables clean URLs for prerendered HTML; unknown routes use `404.html`. Add the four server environment variables before redeploying.

**Netlify:** import this project. `netlify.toml` sets the build, output, function directory, `/api/contact` redirect and HTTP 404 fallback. Add the four environment variables to the function runtime and redeploy.

Do not deploy `dist/` alone to a static-only host and expect the email endpoint to work. No deployment has been performed by this project setup.

## Test

```sh
npm test
npm run test:e2e
npm run build
```

Browser tests use installed Microsoft Edge by default. On another OS change `channel` in `playwright.config.js` to `chrome`, or remove it and run `npx playwright install chromium`. The browser suite starts Vite if needed. Screenshots are saved under ignored `test-results/`.

Manual WhatsApp test: configure the actual owner's number, add two 5KVA sample inverters and one 10kWh sample battery, open Cart and check the **₦2,300,000** subtotal. Continue on WhatsApp and inspect the recipient, quantities, line amounts and total **before sending**. Also check the product enquiry, floating button, and home/office/business quote links. After replacing sample prices, expected totals change accordingly.

Manual contact test: configure Brevo, restart the server, try an empty form to check validation, then submit an enquiry you intend to send. Verify the success message, arrival in the owner's inbox, all fields and reply-to. With a missing/invalid key, verify a friendly error and preservation of entered text. Automated tests mock email success/failure; they never send real email. Actual Brevo delivery cannot be verified without configured credentials.

## Before publishing

Replace/approve the temporary branding and mark, contact numbers, email, address, opening hours, social URLs, all sample product data and artwork, FAQ policy answers (`src/data/faqs.js`), About copy (`src/pages/About.jsx`) and marketing copy. Confirm delivery, installation and warranty details with the owner. Configure Brevo and the real WhatsApp recipient, then test both channels on the deployed site. Add any owner-approved privacy or other business/legal pages required for the actual deployment.

The build prerenders all pages with unique metadata, canonical URLs, social previews and structured data. Read [SEO-LAUNCH.md](SEO-LAUNCH.md) before publishing: the final domain must be configured to enable indexing and generate the sitemap.

## JF branding and new product media

See [PRODUCT-MEDIA.md](PRODUCT-MEDIA.md) for the branded assets and image prompts. New owner-supplied products are defined in `src/data/newProducts.js`; matching camera photos also appear in existing galleries. The Spy Cameras category includes round and clock designs. Solar panel and hybrid inverter pages include the supplied videos. All new listings use confirmed-on-enquiry pricing.
