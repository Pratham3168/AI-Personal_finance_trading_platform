# BudgetWise Frontend (React + Vite + Tailwind)

## Run
1. Start the backend (`cd backend && npm run dev`) on port 5000.
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no CORS setup is needed in development.

## Production
Set `VITE_API_URL` (see `.env.example`) and set the backend's `CLIENT_URL` to your frontend's origin.

## Routes
- `/login`, `/signup`, `/verify-otp` – public (redirect to /home if logged in)
- `/home` – protected
