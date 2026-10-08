# Tuma250

A calm, English-language anonymous-message site. Messages are stored in Supabase and remain private until a moderator approves them.

## Site map and user flow

```text
Home ── Write your message ── Form ── Safety prompt when relevant ── Confirmation
  ├── Community wall ── Support / anonymous reply / report
  ├── Safety prompt ── Local emergency guidance and helpline directories
  ├── Privacy
  └── Moderator access ── Supabase Auth ── Review / approve / delete
```

## Visual direction

- **Palette:** mist `#F6F8F7`, deep slate `#203D48`, calm teal `#176B67`, pale teal `#E1F1ED`, lavender `#ECE9F7`, white surfaces. Dark mode uses deep blue-green surfaces and a high-contrast mint accent.
- **Type:** DM Sans for readable UI and Manrope for warm, confident headings, with system fallbacks.
- **Logo:** the Tuma250 brand image in `logo.webp`, used in the site header and footer.
- **Layout:** generous white space, rounded message cards, visible keyboard focus, reduced-motion support, responsive single-column mobile flow.

## Wireframes

```text
HOME (desktop)                  MESSAGE FORM
┌ Tuma250     Wall Privacy ┐   ┌ ← Back ──────────────────────┐
│ A little room to breathe  │   │ THIS SPACE IS YOURS          │
│ Whatever is on your heart │   │ Write what you need to say.  │
│ you can put it here.      │   │ [ large message field      ] │
│ [ Write your message → ]  │   │ [optional topic             ] │
│ no account, no name       │   │ [community promise         ] │
│           [gentle note]   │   │ [       Send anonymously → ] │
└ kind space / wall link ──┘   └───────────────────────────────┘

CONFIRMATION                     COMMUNITY WALL
┌────────────────────────┐       ┌ heading + gentle intro ─────┐
│           ✓            │       │ [kindness reminder] [refresh]│
│ Your message was sent  │       │ [message card] [message card]│
│ anonymously.           │       │ ♡ support  Reply  Report     │
└────────────────────────┘       └────── [Share your words] ───┘

HELP                             MODERATOR DASHBOARD
┌ emergency: use local number ┐  ┌ sign in: email + password ───┐
│ nearest emergency department│  │ (authorized Supabase account)│
├ child/youth helpline links  │  └──────────────────────────────┘
├ find local support          │  ┌ pending message + reports     │
└ support note                │  │ [Approve] [Delete]            │
                                 └───────────────────────────────┘

PRIVACY
┌ What we store / don't store ┐
│ Review process / limitations│
└─────────────────────────────┘
```

## Connect your Supabase project

This is a static HTML/CSS/JavaScript site. Edit [`config.js`](./config.js) and add your Supabase project URL and **anon/public** key:

```js
window.TUMA_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY",
};
```

Find both values in the Supabase Dashboard under **Project Settings → API**. Use the legacy `anon` key or the newer `sb_publishable_...` key. The app rejects JWT keys whose role is `service_role`. Public keys are visible in browser code by design; keep Row Level Security enabled. **Never use a `service_role` key, database password, or other secret in `config.js`**.

If a `service_role` key was previously copied into frontend code or deployed publicly, rotate it in Supabase before launch. Keep it only in Supabase's server-side function environment.

No `.env` file is used: a plain static browser page cannot read `.env` files securely or automatically. No Vite, Node build step, Turnstile, or Cloudflare account is required.

Open the folder with VS Code Live Server, or use `python -m http.server 8000` from this folder if Python is installed. Do not open `index.html` as `file://`; browser ES modules and Supabase requests need an HTTP(S) origin. Configure your Supabase Auth site's URL allow-list with the local and production origins.

## Set up Supabase data and moderators

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) once in the SQL Editor.
2. Create moderator accounts in **Authentication → Users** with strong, unique credentials.
3. Add each trusted moderator's Auth user ID to the private allow-list:

   ```sql
   insert into public.moderators (user_id)
   values ('MODERATOR_AUTH_USER_UUID');
   ```

   Only allow-listed moderator accounts can access the private review queue. Enable email confirmation and MFA in Supabase Auth settings.

## Deploy the website to Vercel

Vercel hosts the static website. Because this workspace is not currently connected to a Git repository, first put the project files in a GitHub repository (excluding private files and credentials), then:

1. Sign in at [vercel.com](https://vercel.com/) and choose **Add New → Project**.
2. Import the GitHub repository containing the site.
3. In project configuration, choose **Other** as the framework. There is no build command; set the output directory to `.` so Vercel serves `index.html`, `app.js`, `config.js`, and `styles.css` from the project root.
4. Click **Deploy**. After deployment, open the generated Vercel URL and test the site.
5. Add that URL (and your custom domain, if used) to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs**.

`config.js` is intentionally public, so only put your Supabase anon/public or publishable key there—never a service-role key. After changing files, push the changes to GitHub; Vercel will redeploy automatically.

## Deploy the Supabase function separately

The public form invokes the `submit-message` Supabase Edge Function. Deploy it with the Supabase CLI:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy submit-message
```

Supabase provides the function's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets automatically. Do not copy those server-only values into `config.js`.

Vercel deploys the website only in this setup; it does **not** deploy this Supabase Edge Function. The function must be deployed to Supabase separately using the CLI commands above. If `npx` is unavailable, install Node.js LTS, reopen PowerShell, and check `node --version`, `npm --version`, and `npx --version` before running the commands.

## Privacy, moderation, and spam protection

- The message and reply tables have no name, email, user ID, or IP-address columns. No analytics or advertising tracker is added. Hosting and Supabase may process connection metadata under their own policies.
- Messages, replies, and report reasons have no automatic expiry; moderator deletion permanently removes the record and its dependent reports/replies.
- Messages and replies start pending; only approved content is visible publicly. The English threat/abuse keyword screen is a triage aid, not reliable hate-speech detection or a substitute for human moderation.
- The form has a basic hidden honeypot field and a 20-second cooldown stored only in the sender's browser. There is no CAPTCHA service. These are lightweight friction, **not robust server-side rate limiting**; the public submission function can still receive automated requests. Review the pending queue and add suitable abuse controls before a high-traffic public launch.
- The English crisis phrase check is a prompt, not a diagnosis or a block. It encourages people to contact local emergency services and use a helpline directory. This site is not an emergency service and is not monitored continuously.
- Emergency numbers and hotline availability depend on a person's location. The help page uses international directories instead of hardcoding country-specific numbers.
- Public messages are rendered as text, not HTML. Replies stay private until approved; reports go to the moderator queue.
