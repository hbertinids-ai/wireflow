Auth notes

- This project includes a simple file-based authentication helper `auth.js`.
- On startup the server will ensure `users.json` exists and contains two admin users: `admin` and `hbertini`.
- Default passwords are `adminpass` and `hbertinipass` unless overridden by environment variables:
  - ADMIN_PW
  - HBERTINI_PW
- The JWT secret can be set with `JWT_SECRET` (defaults to `dev_change_this_secret`).
- Login endpoint: POST /auth/login with { username, password } -> { token, user }
- Protect admin endpoints by requiring Authorization: Bearer <token> (server enforces role checks).
