# Chat-SQL

AI-powered SQL chat app with:

- `backend/` FastAPI + LangChain
- `frontend/` React + Vite + Tailwind

## Local Run

### Backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

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

## Important Security

- `.env` is ignored by git (already in `.gitignore`).
- Rotate your exposed Groq API key and set the new key in env settings.
