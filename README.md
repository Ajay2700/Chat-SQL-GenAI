<img width="1566" height="893" alt="1" src="https://github.com/user-attachments/assets/c4d5fb73-03c5-460a-9aaa-3579e0b33a7d" /># Chat-SQL 🚀

An AI-powered SQL chat app that turns natural language into SQL, runs it against your database, and returns useful results. 🤖

Tech Stack:
- `backend/` FastAPI + LangChain
- `frontend/` React + Vite + Tailwind


<img width="1566" height="893" alt="1" src="https://github.com/user-attachments/assets/62802999-8891-4d11-a72f-89504dfbdfd8" />

<img width="1533" height="907" alt="2" src="https://github.com/user-attachments/assets/69d406c3-513f-4cb7-a5d9-6da1d4aba46a" />



## Local Development 🛠️

### Backend (FastAPI)

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend health:
`http://localhost:8000/health`

### Frontend (React)

```powershell
cd frontend
npm install
npm run dev
```

Frontend:
`http://localhost:5173`

## Environment Variables 🔐

Backend examples:
- `backend/.env.example`

Frontend examples:
- `frontend/.env.example`

Backend CORS:
- Set `ALLOWED_ORIGINS` to your frontend origin (exact value, no `/api`, no trailing `/`)
- Set `ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app` if you want preview URLs to work too

## Database Connection 🗄️

- SQLite (Vercel friendly): choose `sqlite` in the UI and upload a `.db` file
- MySQL: choose `mysql` and provide a reachable hostname (on Vercel, `127.0.0.1` will not work)

## API Quick Reference 🔗

- `GET /health`
- `POST /api/connect-db`
- `POST /api/chat`
- `POST /api/chat/stream` (SSE)

## Deploy to GitHub (Code Hosting)

1. Create an empty GitHub repository (for example: `Chat-SQL`).
2. In project root, run:

```powershell
cd D:\gen_AI_COurse_Krish_Naik_Sir\Chat-SQL
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

## Deploy from GitHub to Vercel (Recommended)

- Import **frontend** folder as one Vercel project.
- Import **backend** folder as second Vercel project.
- Set frontend env var:
  - `VITE_API_BASE_URL=https://<your-backend-vercel-domain>/api`

### Network error? (See Troubleshooting below)

If you see **Network Error** on Vercel, use the steps in the **Troubleshooting** section below.

1. Verify backend URL is live:

- Open `https://<your-backend-vercel-domain>/health` (must return JSON).

2. Set frontend environment variable in Vercel (Frontend Project → Settings → Environment Variables):

- `VITE_API_BASE_URL=https://<your-backend-vercel-domain>/api`

3. Set backend CORS environment variables in Vercel (Backend Project → Settings → Environment Variables):

- `ALLOWED_ORIGINS=https://<your-frontend-vercel-domain>`
- Optional for preview URLs: `ALLOWED_ORIGIN_REGEX=https://.*\\.vercel\\.app`

4. Redeploy both projects after env changes.
5. Test API directly:

- `POST https://<your-backend-vercel-domain>/api/connect-db`
- If this fails, check Backend Project → Deployments → Function Logs.

## Troubleshooting 🧯

### 1) “Cannot reach backend / Network Error”

1. Open backend health:
   - `https://<your-backend-vercel-domain>/health` (must return JSON)
2. Frontend must call the backend API:
   - `VITE_API_BASE_URL=https://<your-backend-vercel-domain>/api`
3. Backend CORS must allow your frontend origin:
   - `ALLOWED_ORIGINS=https://<your-frontend-vercel-domain>` (no `/api`, no trailing `/`)
4. For preview deployments:
   - `ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app`
5. Redeploy frontend + backend

### 2) MySQL connection fails (example: `127.0.0.1:3306`)

On Vercel, `127.0.0.1` points to the Vercel function itself (not your local MySQL server).

Fix:
- Use your real MySQL hostname from your provider, or
- Use SQLite uploads on Vercel (recommended).

## Vercel Notes ⚙️

- Backend Python runtime: ensure `backend/.python-version` is set to `3.12` (prevents uv/Python mismatch builds).
- Backend timeout: this repo uses a higher Vercel function timeout via `backend/vercel.json` (`maxDuration: 60`), to avoid cold-start timeouts.

## Important Security

- `.env` is ignored by git (already in `.gitignore`).
- Rotate your exposed Groq API key and set the new key in env settings.
