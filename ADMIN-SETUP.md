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
