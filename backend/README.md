# AI Finance - Auth Backend (Node.js + Express)

## Setup
```bash
npm install
cp .env.example .env      # set JWT_SECRET and OTP_SECRET
npm run dev
```
Runs on http://localhost:5000. Uses SQLite by default; set DATABASE_URL for PostgreSQL.

## Testing in Postman
Import `postman_collection.json`, then run requests 1 to 6 in order.

1. **Signup** creates an unverified user and emails a 6-digit OTP.
   With no SMTP set, the OTP is printed in the terminal ("[DEV MODE] OTP for ...").
2. **Verify OTP** with that code. Returns a JWT (saved to `{{token}}` automatically).
3. **Resend OTP** (60s cooldown).
4. **Login** with email + password. Unverified users get 403 and a new OTP.
5. **Get me** and 6. **Logout** need the token (Bearer or cookie).
After logout, request 5 returns 401 because the token is revoked.

## Endpoints
| Method | Route | Auth | Body |
|---|---|---|---|
| POST | /api/auth/signup | no | fullName, email, phone, password |
| POST | /api/auth/verify-otp | no | email, otp |
| POST | /api/auth/resend-otp | no | email |
| POST | /api/auth/login | no | email, password |
| POST | /api/auth/logout | yes | |
| GET | /api/auth/me | yes | |

## Security built in
bcrypt password hashing (12 rounds), JWT with unique id, hashed OTPs with 10-min expiry
and 5-attempt limit, token revocation on logout, helmet, CORS, rate limiting,
input validation, httpOnly cookie.
