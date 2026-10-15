# MediScribe AI — HTML, CSS, JavaScript + Supabase

A hackathon-ready starter project. Frontend is plain HTML/CSS/JavaScript; Supabase provides authentication, private note storage, and an Edge Function for AI-generated SOAP notes.

## Features

- Responsive doctor dashboard
- Browser microphone transcription with Web Speech API (`en-IN`)
- Manual transcript entry and demo transcript
- SOAP note editor
- Demo formatting when Supabase/AI is not configured
- Optional Supabase email/password authentication
- Private per-user note storage with Row Level Security
- AI SOAP note generation through a Supabase Edge Function
- Copy and download note
- Review flags for clinician verification

## 1. Run the frontend locally

Because the browser microphone and some browser features behave better over HTTP than opening a file directly, run a local static server.

Python:
```bash
python -m http.server 5500
```
Then open `http://localhost:5500`.

Or use the VS Code Live Server extension.

Microphone transcription requires a supported browser (usually Chrome/Edge), microphone permission, and internet connectivity for the browser speech service. The app currently sets recognition language to `en-IN`; support may vary.

## 2. Create Supabase project

1. Create a project at https://supabase.com.
2. Open **Project Settings → API** and copy the Project URL and publishable/anon key.
3. In `app.js`, set:
```js
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
```
Use the project API URL (usually `https://<project-ref>.supabase.co`), not the database connection string or pooler host.
Only put the public/publishable anon key in frontend code. **Never put a service_role key or Gemini API key in frontend code.**

4. Open Supabase **SQL Editor**, paste and run `supabase/schema.sql`.
5. In Supabase **Authentication → Providers**, ensure Email is enabled. For a quick test, you may disable email confirmations in the Auth settings; re-enable confirmation for a real deployment.
6. Reload the website, create an account, then sign in.

## 3. Enable AI note generation (optional)

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then install the Supabase CLI and sign in:
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```
From this project's root directory:
```bash
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase functions deploy generate-notes
```
The Edge Function verifies the signed-in user and calls Gemini (`gemini-3.8-flash`) from the server. The Gemini API key stays in Supabase secrets, not in `app.js`.

The function expects a transcript and returns structured SOAP-note JSON. Audio transcription in this starter is handled by the browser's Web Speech API, not by the Edge Function. Generate notes while signed in; the function requires a valid Supabase session.

## 4. Test the app

1. Click **Load demo transcript**.
2. Click **Generate clinical notes**.
3. Edit each SOAP field.
4. Click **Copy note** or **Download .txt**.
5. Sign in to Supabase and click **Save note** to store it in the cloud.

Without Supabase configuration, saved notes remain in the current browser's local storage and are not synced.

## Important security and clinical limitations

- This is a prototype, not a validated clinical system.
- Do not use real patient information until your security, consent, retention, access, and compliance requirements have been reviewed.
- Browser speech recognition may send audio to a browser vendor's speech service; it is not an offline or guaranteed-private transcription engine.
- AI can make errors. A qualified clinician must review all notes and verify medication names, dosage, negations, diagnosis, and plan.
- Do not use this prototype for autonomous diagnosis, treatment, or prescribing.
- Before real hospital deployment, add audit logging, stronger identity/access management, encryption/retention policies, monitoring, and clinical validation.
