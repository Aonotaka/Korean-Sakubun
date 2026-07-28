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

### Render deployment

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
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
PORT=10000
```

7. Deploy.

Render will run the Node.js server automatically.

## Live demo

Open the deployed app here:

https://korean-sakubun.onrender.com
