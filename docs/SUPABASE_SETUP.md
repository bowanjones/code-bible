# Account sign-in & cloud backup (Supabase)

The app works fully without an account. When someone signs in, their progress,
notes, devotional responses, scores, friends list and settings are also saved
to their own private row in Supabase and kept in sync across devices.

The project URL and **publishable** key are already in `js/cloud.js`. They are
meant to be public. **Never** put the secret / `service_role` key or the
database password anywhere in this repo.

## One-time setup

### 1. Create the tables and security rules
Supabase dashboard -> **SQL Editor** -> **New query** -> paste the contents of
`supabase/schema.sql` -> **Run**. It is safe to run again.

Check it worked: **Table Editor** should list `profiles` and `user_data`, each
showing "RLS enabled".

### 2. Tell Supabase where your site lives
**Authentication -> URL Configuration**

- **Site URL:** your GitHub Pages address, e.g. `https://bowanjones.github.io/code-bible/`
- **Redirect URLs** (add all that apply):
  - `http://localhost:8000/**`
  - `http://127.0.0.1:8000/**`
  - `https://bowanjones.github.io/code-bible/**`

Without this, the link in the sign-in email sends people to the wrong place.

### 3. Email delivery (important before sharing with other people)
Supabase's built-in email sender is for testing only: it **only emails
addresses on your Supabase team** and is capped at about **2 emails per hour**.
That is enough for you to test with your own email.

Before other people can sign in you need a custom SMTP provider:
**Authentication -> Emails -> SMTP Settings -> Enable custom SMTP**. Several
email services offer a free tier (for example Resend or Brevo) -- check their
current terms. Good delivery generally needs a sending domain you own. Supabase
then allows about 30 emails per hour by default, adjustable under
**Authentication -> Rate Limits**.

Once custom SMTP is on you can also edit **Authentication -> Emails ->
Templates -> Magic Link** and add `{{ .Token }}` to show a 6-digit code next to
the link. The app has a box to type that code, which helps people using the
installed app (a link opens in the browser, a code can be typed in the app).

## Keeping the free project from being paused
Supabase pauses **free** projects that get too little database activity over a
week. Its docs say a few requests a day is typically enough, so a once-a-week
ping would be cutting it close. Two safeguards are included:

1. `supabase/schema.sql` creates a tiny public `keepalive` table (nothing private).
2. `.github/workflows/supabase-keepalive.yml` reads it once a day via
   GitHub Actions. It needs **no secrets**.

To turn it on: merge to `main` (scheduled workflows only run from the default
branch), then **GitHub -> Actions -> Supabase keep-alive -> Run workflow** once
to confirm it shows a green check. If it ever fails, GitHub emails you.

Notes: GitHub may switch off scheduled workflows in a *public* repo after about
60 days with no repo activity -- if so, re-enable it from the Actions tab.
Real users signing in and syncing also count as activity. Supabase emails the
project owner roughly a week before a pause, and a paused project can be
restored from the dashboard for a limited time.

## Using it
Settings -> Account -> enter your email -> tap the link in the email (or type
the code). Then pick a username (3-20 letters, numbers, underscores; unique).

## How syncing behaves
- Every change is saved on the device immediately, then pushed a few seconds
  later. Offline changes sync when the connection returns.
- A second device pulls the latest copy when it opens or comes back into view.
- If two devices changed things at the same time, they are **merged**:
  chapters read and story progress are combined, notes are kept from both,
  highest scores win. Nothing is silently overwritten.
- **Sign out** removes the data from that device (it stays in the account), so
  nobody else using a shared device sees it.
- **Reset all progress** while signed in clears the account copy too.
- **Delete my account and data** removes the login, profile and all data.

## Tests
`node tests/merge.test.js` checks the merge rules.
