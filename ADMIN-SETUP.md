# Supabase + Netlify setup

The code is ready for a Supabase project. No database, account or paid resource has been created automatically. Until all settings are supplied, the existing 13-product catalog stays active and review submissions are hidden. Partial configuration fails closed instead of silently showing old products.

## 1. Create the database

1. Create a free project at https://supabase.com/dashboard. Keep the database password in your password manager.
2. Open the project's SQL Editor and run `supabase/migrations/001_store.sql` once. It creates the product, private admin, feedback, audit and rate-limit tables, plus a public product-photo bucket.
3. In project settings, find the project URL, publishable key (or legacy anon key) and server-side service-role key. Never send the service-role key in chat or put it in frontend code.

## 2. Configure local development and Netlify

Add these to your local `.env` and to the Netlify site's environment variables:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SERVICE_ROLE_KEY
```

Use **Functions** scope on Netlify (or all scopes if your plan doesn't offer scope controls). Never prefix the secret with `VITE_`. The public key and project URL are deliberately returned to the login screen; the service-role key stays in Netlify Functions. Restart `npm run dev` after changing `.env`.

Before connecting the live Netlify site, import the current real catalog locally:

```sh
npm run db:seed
```

This imports the 13 current real products with their existing IDs and photos. Re-running skips existing IDs, preserving admin edits. It does not import hidden sample products. New products start at ID 1000. Existing media stays on Netlify; new uploaded photos go to Supabase.

## 3. Create the owner login

1. In Supabase **Authentication → Users**, create the owner's account using an email they control and a strong password. Auto-confirm this account if the dashboard offers that option.
2. Copy the user's UUID (not their email), then run this in the SQL Editor:

```sql
insert into public.store_admins (user_id)
values ('PASTE_THE_AUTH_USER_UUID_HERE');
```

3. Disable public signups in Supabase Auth. There is no customer signup on this website. Even a signed-in account cannot manage anything unless it is in `store_admins`.
4. Set Auth's Site URL to `https://jimfrankell.com`. Add `https://jimfrankell.com/admin` and `http://127.0.0.1:5173/admin` to allowed redirect URLs.
5. Configure Auth SMTP (Brevo may be used) before relying on password-reset emails. Supabase's default email service is limited. This is separate from the existing contact-form API key.
6. After deployment, open `https://jimfrankell.com/admin`. Sign in, edit a product and save a draft first.

Remove a user's row from `store_admins` to revoke management access immediately. Do not grant database or Storage permissions to `anon` or `authenticated`; Netlify validates the admin token on every request and uses the server key only after authorization.

## 4. Deploy and verify

Deploy the repository to the existing Netlify site with `npm run build` and publish directory `dist`. The supplied `netlify.toml` configures both API and server-rendered catalog routes.

- Open `/admin` while signed out: it must show login, not products or customer emails.
- Sign in with an account that is **not** in `store_admins`: access must be denied.
- Add a product with a photo and a blank price: it should display “Price on request”. Publish it and open its product link in a fresh tab.
- Edit its price, then check the shop, product page and quote basket.
- Submit feedback with a customer email. It must remain invisible publicly until approved. Approve it, reload the product page, then reject it and check that it disappears.
- Unpublish the test product. Its product URL must return 404 and it must disappear from `/sitemap.xml`.
- Check password reset with the real SMTP configuration.

The home, shop, about, product pages and sitemap are rendered from the current database by a Netlify Function. This keeps new product URLs and search metadata current without rebuilding the site. A database outage returns 503 on these pages instead of publishing stale stock/prices. `/contact` remains static and the contact-form function is unchanged.

## Product and feedback behaviour

### Customer account setup

1. Run `003_customer_accounts.sql` in the Supabase SQL Editor **after** migration 002. Existing guest orders remain unlinked.
2. In Supabase Authentication settings, enable email/password signups and turn **Confirm email** off for immediate signup/sign-in. Do not disable password requirements. Registration uses only the public Supabase key; no admin permissions are granted.
3. Add `https://jimfrankell.com/account` and your local `http://127.0.0.1:5173/account` to Authentication's allowed redirect URLs. Set the production Site URL to `https://jimfrankell.com`.
4. Configure custom SMTP separately if customers should receive password-reset emails. Registration itself needs no email when confirmation is disabled.
5. Deploy/restart the app. Test two different customer accounts: each should see only their own new orders and saved basket. Test guest checkout and an existing admin account too.

The header's **My account** link offers registration, sign-in, password reset, order history and sign-out. Customer and admin browser sessions use separate storage keys. Customers cannot gain admin access by signing up or entering an admin email; the private admin allowlist still applies.

Signed-in baskets are saved in Supabase with version checks. If another device changes the basket, reload it before editing. The guest basket stays separate on the device; use **Add items from this device’s guest basket** to copy it into an account. Quantities use the larger existing value for matching options, so repeated imports do not duplicate them.

Order ownership is set from the verified authentication token, not from submitted email/user IDs. Do not automatically claim historical guest orders by email, particularly because registration emails are unverified. No live authentication setting or SQL migration is applied by the local code changes.

### Order tracking setup

1. Open your Supabase project, choose **SQL Editor → New query**, paste the entire contents of `supabase/migrations/002_orders.sql`, and click **Run** once. Keep the existing `001_store.sql` setup; do not run it again.
2. Deploy this version to Netlify (or restart `npm.cmd run dev` locally). No new environment variables are needed.
3. Add a product to the basket, enter a name and phone number, choose delivery or collection, and provide a delivery address if required. Select **Save order and continue**. The next screen displays the saved reference and **Send order on WhatsApp** link.
4. Sign in to **Admin → Orders**. Review the saved customer details, product photos, chosen inverter capacity, quantities and prices. Update the status to **confirmed**, **dispatched**, **completed**, or **cancelled** as appropriate. Filter by status and use pagination for older orders.

Orders start as **new**. A saved order is not proof of payment, customer WhatsApp delivery, or business acceptance. Product totals exclude delivery and installation. Items without a price retain a pending price confirmation rather than being counted as free.

The server checks published products, availability, capacity and current prices, stores an immutable item/price snapshot, and rejects stale displayed prices. Retrying the same submission reuses its reference. Only authorised admins can list customer details or update statuses; customers have no public order lookup. Order requests are rate limited. Customer details are stored with consent; establish a suitable business retention policy and delete data when it is no longer needed.

Run migration 002 **before** deploying: otherwise order saves and the Orders tab will report a database error. Local automated tests mock the database and do not apply this SQL or test your live Supabase credentials.

- Inverters support capacity pricing: edit an inverter and use **Inverter capacities and prices** to add, change or remove kVA/NGN rows, then **Save product**. Other categories retain a single price. Empty option lists use the normal single-price field.
- The existing `jf-hybrid-solar-inverter` listing initially uses the owner's six prices: 12kVA/450000, 8kVA/350000, 5.6kVA/300000, 3.5kVA/280000, 2kVA/220000 and 1.5kVA/180000. These defaults apply only when the database record has no `inverterOptions` field. Saving from admin stores the options in the existing product JSON; subsequent edits, including removing all options, take precedence. No SQL migration is required.
- Customers select a capacity before adding an inverter to their quote. Different capacities stay separate in the basket and WhatsApp message. Basket prices are resolved from the current catalog after reload; removed capacities are excluded.

- Prices are in NGN. Blank means quotation required. Existing product URL slugs cannot be changed, preserving shared links.
- Photos: JPEG, PNG or WebP, up to 3 MB and 24 megapixels, maximum eight per product. The server validates and re-encodes them as WebP, strips metadata, and preserves aspect ratio. It does not remove photo backgrounds.
- Products are hidden by unpublishing rather than deleting customer feedback. Unused photo files remain in Storage; periodically remove truly unused files through the Supabase dashboard.
- Customers submit a display name, private email, 1–5 rating, message and publication consent. There are no customer accounts or automatic “verified purchase” badges.
- Only approved feedback for published products is returned publicly; customer emails and moderation data are excluded. Latest 100 approved reviews are shown per product. Admin lists are paginated in groups of 100.
- Feedback has a honeypot and persistent rate limits (5 submissions/IP/hour and 3/email/day). IP identifiers are HMAC-hashed; no raw IP is stored. This reduces basic spam but is not a CAPTCHA. Monitor abuse and add a challenge if needed.
- Admin actions are audited. Back up both the database and Storage regularly; Supabase's free plan does not include automatic database backups and may pause inactive projects.

## Validation status

Local tests can exercise validation, authorization, API behaviour, UI flows and Netlify rendering with controlled database responses. Real login, SQL migration execution, Storage uploads and live Netlify routing still require testing in your configured Supabase/Netlify project. Never treat mocked checks as proof that live credentials or policies are correct.

References: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/reference/javascript/auth-getuser
