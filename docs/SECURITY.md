# Security

> **Last Updated:** 2026-03-20

This document describes the security architecture of the Athlete Management App, including authentication, authorization, secrets management, and hardening measures.

---

## Table of Contents

- [Authentication Flow](#authentication-flow)
- [Single Shared Login Model](#single-shared-login-model)
- [Password Management](#password-management)
- [Rate Limiting](#rate-limiting)
- [Security Headers](#security-headers)
- [Audit Logging](#audit-logging)
- [Secrets Management](#secrets-management)
- [CORS Configuration](#cors-configuration)
- [Known Limitations and Future Improvements](#known-limitations-and-future-improvements)

---

## Authentication Flow

The application uses **JWT (JSON Web Token)** based stateless authentication with Spring Security.

### How It Works

```mermaid
sequenceDiagram
    participant Browser
    participant Nginx
    participant Backend
    participant Database

    Browser->>Nginx: POST /api/auth/login {username, password}
    Nginx->>Backend: Proxy request
    Backend->>Database: Lookup user by username
    Database-->>Backend: User record (with BCrypt hash)
    Backend->>Backend: Verify password with BCrypt
    Backend-->>Nginx: 200 {token, username}
    Nginx-->>Browser: JWT token

    Note over Browser: Token stored in localStorage

    Browser->>Nginx: GET /api/coaches (Authorization: Bearer <token>)
    Nginx->>Backend: Proxy with auth header
    Backend->>Backend: Validate JWT (signature, expiration)
    Backend-->>Nginx: 200 [coaches data]
    Nginx-->>Browser: Response
```

### Token Lifecycle

| Property          | Value                                    |
|-------------------|------------------------------------------|
| Algorithm         | HMAC-SHA256                              |
| Signing key       | `JWT_SECRET` environment variable (min 32 chars) |
| Expiration        | 24 hours (configurable via `JWT_EXPIRATION`) |
| Storage (client)  | `localStorage` in the browser            |
| Refresh mechanism | None — user must log in again after expiry |

### JWT Claims

The token payload contains:

```json
{
  "sub": "admin",
  "role": "ADMIN",
  "iat": 1711000000,
  "exp": 1711086400
}
```

### Request Authentication

Every API request (except `POST /api/auth/login`) must include the JWT in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

The `JwtAuthenticationFilter` (a `OncePerRequestFilter`) runs before Spring Security's default filters:

1. Extracts the `Bearer` token from the `Authorization` header
2. Validates the token signature and expiration via `JwtService`
3. Loads the user from the database via `AppUserDetailsService`
4. Sets the `SecurityContextHolder` authentication context
5. If the token is missing or invalid, the request continues unauthenticated (Spring Security rejects it with 401)

### Frontend Token Handling

- On login, the token is saved to `localStorage`
- An Axios request interceptor reads the token and sets the `Authorization` header on every API call
- An Axios response interceptor catches `401` responses, clears the token, and redirects to `/login`
- On page load, `AuthContext` checks for a saved token and validates it by calling `GET /api/auth/me`

---

## Single Shared Login Model

This application uses a **single shared login account** — there are no per-coach user accounts.

### How It Works

- One admin account is created automatically on first startup by `AdminSeeder`
- The username and password come from environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- All coaches share this single login
- Once authenticated, the user selects their "coach identity" from a dropdown in the UI
- The coach identity is filtering context only; all authenticated users can manage every athlete's training

### Key Points

- There is **no self-registration** endpoint
- There are **no roles or permissions** — every authenticated user has full CRUD access to everything
- The `Coach` entity is purely a data grouping mechanism, not a user account
- The `AdminSeeder` only creates the account if the `app_user` table is empty (it won't overwrite existing accounts)

### Database Table

```sql
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

---

## Password Management

### Changing the Password

Authenticated users can change the shared password via:

```
PUT /api/auth/change-password
Authorization: Bearer <token>

{
  "oldPassword": "current-password",
  "newPassword": "new-password-min-8-chars"
}
```

**Validation rules:**
- Old password must match the current password
- New password must be at least 8 characters
- Returns `204 No Content` on success
- Returns `400 Bad Request` if old password is wrong or new password is too short

The frontend provides a "Alterar Palavra-passe" (Change Password) dialog accessible from the user menu in the top bar.

### Resetting a Forgotten Password

If the password is lost, reset it by deleting the user from the database. The `AdminSeeder` will recreate it on next startup:

```bash
docker exec -it athlete-db psql -U athlete -d athletedb \
  -c "DELETE FROM app_user;"

docker compose restart app
```

The new password will be whatever is set in `ADMIN_PASSWORD` in the `.env` file.

### Password Storage

Passwords are hashed with **BCrypt** before storage. The raw password is never stored or logged.

---

## Rate Limiting

Rate limiting is implemented using **Bucket4j** (in-memory token bucket algorithm). No external dependencies like Redis are needed.

### Limits

| Endpoint                  | Limit                           |
|---------------------------|---------------------------------|
| `POST /api/auth/login`   | 5 requests per minute per IP    |
| All other `/api/**`       | 100 requests per minute per user |

### Behavior When Exceeded

When the rate limit is exceeded, the API returns:

```
HTTP 429 Too Many Requests
```

With a JSON error body following the standard error format (see [API Contract](API_CONTRACT.md#7-error-response-format)).

### Implementation

The `RateLimitFilter` is a servlet filter registered in the Spring filter chain. It uses separate buckets for:
- Login attempts: keyed by client IP address (`X-Real-IP` header or `remoteAddr`)
- Authenticated requests: keyed by the authenticated username

---

## Security Headers

The Nginx reverse proxy adds the following security headers to all responses:

| Header                    | Value                                          | Purpose                                |
|---------------------------|------------------------------------------------|----------------------------------------|
| `X-Content-Type-Options`  | `nosniff`                                      | Prevents MIME type sniffing            |
| `X-Frame-Options`         | `DENY`                                         | Prevents clickjacking                  |
| `X-XSS-Protection`        | `1; mode=block`                                | Legacy XSS protection                  |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`              | Controls referrer information           |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; ...`   | Restricts resource loading sources     |

Additionally, the `X-Powered-By` header is stripped from backend responses to avoid leaking technology information.

The full Nginx configuration is in `frontend/nginx.conf`.

---

## Audit Logging

### What Is Logged

The application maintains two types of audit logs:

#### 1. Request Log (AuditLogFilter)

Every API request is logged with:
- Timestamp
- HTTP method and URI
- Authenticated username (or "anonymous")
- Source IP address
- Response status code
- Response time in milliseconds

#### 2. Business Event Log (AuditEventLogger)

Key business operations are logged:
- Login attempts (success and failure, with username)
- Coach CRUD operations
- Athlete CRUD operations
- Workout CRUD operations

### Where to Find Logs

| Log File              | Location (host)         | Contents                        |
|-----------------------|-------------------------|---------------------------------|
| `logs/application.log` | `./logs/application.log` | General application log (text) |
| `logs/application.json` | `./logs/application.json` | Structured JSON log (for aggregation) |
| `logs/audit.log`      | `./logs/audit.log`       | Audit trail (requests + events) |

The `logs/` directory is mounted from the host via Docker volume (`./logs:/app/logs`).

### Log Rotation

Logback is configured with rolling file appenders:
- Max file size: 50 MB per file
- Max retention: 30 days
- Max total size: 1 GB

### Viewing Logs

```bash
# Real-time audit log
tail -f logs/audit.log

# Search for login failures
grep "LOGIN_FAILURE" logs/audit.log

# Search for a specific user's actions
grep "username=admin" logs/audit.log

# Docker container logs
docker compose logs -f app
```

---

## Secrets Management

All secrets are stored in the `.env` file at the project root. This file is **gitignored** and must never be committed to version control.

### Environment Variables Reference

| Variable                | Purpose                              | Example / Default                |
|-------------------------|--------------------------------------|----------------------------------|
| `POSTGRES_DB`           | Database name (PostgreSQL init)      | `athletedb`                      |
| `POSTGRES_USER`         | Database superuser (PostgreSQL init) | `athlete`                        |
| `POSTGRES_PASSWORD`     | Database password (PostgreSQL init)  | Strong random password           |
| `DB_HOST`               | Database host (backend connection)   | `postgres` (Docker service name) |
| `DB_PORT`               | Database port                        | `5432`                           |
| `DB_NAME`               | Database name (backend connection)   | `athletedb`                      |
| `DB_USER`               | Database user (backend connection)   | `athlete`                        |
| `DB_PASS`               | Database password (backend)          | Must match `POSTGRES_PASSWORD`   |
| `JWT_SECRET`            | JWT signing key                      | Min 32 chars, `openssl rand -base64 48` |
| `JWT_EXPIRATION`        | Token TTL in milliseconds            | `86400000` (24 hours)            |
| `ADMIN_USERNAME`        | Shared login username                | `admin`                          |
| `ADMIN_PASSWORD`        | Shared login password                | Strong password                  |
| `CORS_ALLOWED_ORIGINS`  | Allowed frontend origins (comma-separated) | `https://yourdomain.com`   |
| `AWS_REGION`            | S3 bucket region                      | `eu-west-1`                      |
| `AWS_ACCESS_KEY_ID`     | Restricted backup IAM access key     | Stored only on production host   |
| `AWS_SECRET_ACCESS_KEY` | Restricted backup IAM secret key     | Stored only on production host   |
| `S3_BUCKET`             | Private SQL backup bucket            | Account-specific bucket name     |
| `S3_PREFIX`             | Backup object prefix                 | `backups/athlete-manager`        |
| `LOCAL_BACKUP_RETENTION_DAYS` | Local dump retention         | `3`                              |

### Best Practices

- **Never commit `.env`** to version control
- Use `openssl rand -base64 48` to generate `JWT_SECRET`
- Use `openssl rand -base64 24` to generate database passwords
- Keep a secure backup of the `.env` file (e.g., in a password manager)
- Restrict the backup IAM key to the configured private S3 bucket and prefix
- `POSTGRES_PASSWORD` and `DB_PASS` must always match
- Change default credentials (`admin`/`admin`) before any real use

### The `.env.example` File

A template with placeholder values is provided at `.env.example`. Copy it to `.env` and fill in real values. See [Deployment Guide](DEPLOYMENT_GUIDE.md) for the setup procedure.

---

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured in the Spring Security configuration.

### How It Works

- Allowed origins are read from the `CORS_ALLOWED_ORIGINS` environment variable
- Default (development): `http://localhost:3000,http://localhost:5173`
- Production: Set to your domain (e.g., `https://yourdomain.com`)
- Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Allowed headers: all (`*`)

### Configuration Location

The CORS configuration is in `backend/src/main/kotlin/com/athletemanager/config/SecurityConfig.kt`, integrated with Spring Security's filter chain.

The `application.yml` reads the value:

```yaml
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}
```

### Note on Nginx

In production, the frontend and API are served from the same origin because the frontend web service proxies `/api/` to the backend, so CORS is typically not an issue. CORS configuration matters primarily during development when the frontend dev server (Vite on port 5173) makes requests to the backend (port 8080).

---

## Known Limitations and Future Improvements

### Current Limitations

| Limitation | Description | Risk Level |
|------------|-------------|------------|
| Single shared account | All coaches share one login. No way to track who did what at the user level. | Medium |
| No token refresh | JWT expires after 24 hours; user must log in again. | Low |
| No password complexity rules | Only minimum length (8 chars) is enforced. | Low |
| In-memory rate limiting | Rate limit state is lost on restart. Not suitable for multi-instance deployments. | Low |
| localStorage for tokens | Vulnerable to XSS attacks. HttpOnly cookies would be more secure. | Medium |
| No HTTPS by default | Docker Compose serves HTTP. HTTPS must be configured separately. | High (for production) |
| No account lockout | Failed login attempts are rate-limited but the account is never locked. | Low |
| Audit logs are local files | No centralized log aggregation. Logs are lost if the volume is deleted. | Medium |

### Potential Future Improvements

1. **Per-coach user accounts** — Each coach gets their own login with role-based access control
2. **Token refresh mechanism** — Short-lived access tokens with long-lived refresh tokens
3. **HttpOnly cookie storage** — Move JWT from localStorage to HttpOnly cookies to mitigate XSS
4. **Centralized logging** — Ship logs to a service like Loki, ELK, or CloudWatch
5. **Account lockout** — Lock the account after N failed login attempts
6. **Two-factor authentication (2FA)** — Add TOTP-based 2FA for additional security
7. **Database encryption at rest** — Encrypt the PostgreSQL data volume
8. **Automated security scanning** — Add dependency vulnerability scanning to CI/CD
