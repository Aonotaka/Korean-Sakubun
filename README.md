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
