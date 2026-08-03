# Korean-Sakubun
Japanese to Korean Learning Platform

## AI provider setup

This project uses a provider-agnostic AI layer so you can start with Groq and later switch to OpenAI without changing the app routes.

### Groq (recommended for start)

1. Create a Groq account.
2. Generate an API key.
3. Start the server with:

```bash
cd /workspaces/Korean-Sakubun
cp .env.example .env
# edit .env and set
# AI_PROVIDER=groq
# GROQ_API_KEY=your_groq_api_key_here
npm start
```

### Offline fallback mode

Even if AI is unavailable, the app now includes a large built-in question bank, so the study experience remains usable.

### Account management

- Admin credentials should be managed server-side, not shown on the website.
- The admin screen is now only reachable through a hidden secret path such as /korean-admin-secret.
- For production, set these environment variables in Render or your local shell:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongAdminPassword123!
```

- Regular user accounts are stored in data/users.json with hashed passwords. Do not store plain passwords in the repository or expose them in the UI.

### Persistent user data

- User progress, feedback comments, blog comments, and premium study memories are saved on the server in JSON files.
- To keep these records after redeploys, set `DATA_DIR` to a persistent volume path on the host, for example `/var/data/korean-sakubun` on Render with a mounted disk.
- Public feedback comments from `みんなのコメント` are saved at `DATA_DIR/feedback.json` (example: `/var/data/korean-sakubun/feedback.json`).
- Feedback retention is unlimited by default. If you need to cap records, set `FEEDBACK_MAX_ITEMS` to a positive number.
- If you want to grant premium access to specific demo accounts without billing, set `PREMIUM_ACCESS_EMAILS` to a comma-separated list of email addresses.
- Premium users can save personal study texts and review them repeatedly from the homepage.

### Stripe subscription setup

This app supports Stripe Checkout for monthly premium subscriptions.

1. Create a Stripe product and recurring monthly price.
2. Set these environment variables:

```text
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PAYMENT_LINK_URL=https://buy.stripe.com/14A4gyaqT6qi44IfMS6Zy00
STRIPE_SUCCESS_URL=https://your-domain.example/?checkout=success
STRIPE_CANCEL_URL=https://your-domain.example/?checkout=cancel
```

If STRIPE_PAYMENT_LINK_URL is set, the premium button redirects to that hosted Stripe Payment Link.

3. Configure Stripe webhook endpoint:

```text
POST /api/webhook/stripe
```

4. Subscribe these webhook events:

```text
customer.subscription.created
customer.subscription.deleted
```

When subscription is created, the server updates the user to premium. When subscription is deleted, the user is returned to free.

### Render deployment

Recommended minimum configuration (reliable baseline):

- App always starts and serves pages.
- AI question generation/scoring works with Groq.
- Admin login is protected.
- External TTS remains optional (browser voice still works).

1. Push this repository to GitHub.
2. Open Render and create a new Web Service.
3. Connect the GitHub repository.
4. Set the build command:

```bash
npm install
```

5. Set the start command:

```bash
npm start
```

6. Add environment variables in Render:

```text
NODE_ENV=production
PORT=10000

# AI (minimum recommended)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# Admin (required for secure admin login)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=generate_a_long_random_password
ADMIN_SECRET_PATH=/korean-admin-secret

# Persistent storage for user data and sessions
DATA_DIR=/var/data/korean-sakubun

# Optional: grant premium access to selected accounts
PREMIUM_ACCESS_EMAILS=vip@example.com,teacher@example.com

# Optional: external TTS providers (choose one)
GOOGLE_CLOUD_TTS_ACCESS_TOKEN=your_google_cloud_oauth_access_token
# or
OPENAI_API_KEY=your_openai_api_key
```

7. Deploy.

Render will run the Node.js server automatically.

### Render quick profiles

Profile A: Recommended (AI enabled)

- Set all variables in the block above except external TTS.
- Result: AI generation/scoring works, speech uses browser Korean voice by default.

Profile B: Ultra-minimal fallback (no AI key yet)

- Set only:

```text
NODE_ENV=production
PORT=10000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=generate_a_long_random_password
ADMIN_SECRET_PATH=/korean-admin-secret
```

- Result: App still works with built-in fallback question bank/scoring.

If you enable `DATA_DIR`, mount a persistent disk at the same path so comments, progress, premium memories, and sessions survive redeploys.

Profile C: External TTS enabled

- Start from Profile A.
- Add one:
	- GOOGLE_CLOUD_TTS_ACCESS_TOKEN (Google Cloud TTS)
	- OPENAI_API_KEY (OpenAI TTS)
- Then in the app UI, choose `Cloud TTS (外部)` from `音声エンジン`.

### Post-deploy checklist (2 minutes)

1. Open `/` and confirm page loads.
2. Start a session and submit an answer (AI or fallback response should appear).
3. Open `音声で聞く` and check audio plays.
4. Confirm `/admin` redirects to `/` (hidden admin route behavior).
5. Access `ADMIN_SECRET_PATH` and confirm admin login gate works.

## Live demo

Open the deployed app here:

https://korean-sakubun.onrender.com
