# Fero UI — Authentication Architecture

## Overview

Fero UI uses a **server-side session-based authentication model**. The shell application (`saba-cloud-host`) centralises all authentication concerns. No remote micro-frontend ever implements its own login screen or directly interacts with an identity provider. The actual session lifecycle is owned by the Saba backend — the Angular shell orchestrates which remote to load and provides the shared interceptor and state infrastructure.

---

## Architecture Summary

| Responsibility | Owner | Mechanism |
|---|---|---|
| Login UI | `saba-cloud-login` (federated remote) | Dedicated MFE loaded by the shell when no app context exists |
| Credential submission | `LoginService` | `POST /Saba/api/prelogin/signin` — server validates, establishes session, returns redirect |
| Session management | Saba backend (server-side) | HTTP-only session cookies — no tokens stored in JavaScript |
| CSRF protection | `CsrfInterceptor` | Attaches `csrfNonce` param from `Saba.site.env.fero.csrfToken` (server-injected into the page) |
| Auth error handling | `AuthErrorInterceptor` | Catches 403s, handles CSRF errors, concurrent sessions, session timeouts |
| Logout | `UiContextService.logout()` | `PUT /Saba/api/login/logout` — server destroys session, client clears cookies, redirects |
| User context | `UiContextService` | `GET /Saba/api/ui/fero/uicontext/currentuser` — populates NgRx store via `SabaCloudFacade` |
| OIDC / SAML | Admin config UI only | Configuration screen for site admins — the OIDC/SAML flow itself runs server-side, not in Angular |

---

## Login Flow

### 1. Shell Decides What to Load

The shell reads the application context from the URL at bootstrap:

```typescript
const TRQ_APP = SCUrlUtils.getBaseTrqApp() || TrqWindowRef.getProp('__remote_app__');

// No app context → load login routes
RouterModule.forRoot(ROUTES_MAPPING[TRQ_APP] || LOGIN_ROUTES, { ... })
```

When a user hits the site without an active session, the server renders the page with no `TRQ_APP`. The shell loads the `saba-cloud-login` remote.

### 2. Login Remote Handles the Pre-Auth Experience

`saba-cloud-login` is a federated remote that owns the entire pre-authentication surface:

- Login form
- Signup
- Forgot password
- Change password
- Account activation
- Terms & conditions acceptance
- Two-factor authentication (email-based and TOTP/mobile-based)

Before rendering, its `UiContextService` calls `/Saba/api/prelogin/experience` to fetch branding, locale, and feature flags.

### 3. Credentials Go to the Server

```typescript
// LoginService
login(data: LoginData): Observable<LoginResponse> {
  return this.httpClient.post<LoginResponse>('/Saba/api/prelogin/signin', loginData, { headers });
}
```

The server validates credentials and returns a `LoginResponse` containing:

| Field | Purpose |
|---|---|
| `redirectionURL` | Where to navigate after successful login (the main app) |
| `isMailBased` / `isMobileBased` | Whether two-factor authentication is required |
| `pendingStep: 'TnC'` | Whether terms acceptance is required before proceeding |
| `changePasswordURL` | Forced password change redirect |
| `accountActivationURL` | Account activation redirect |
| `captchaPublicKey` | Captcha context on failed attempts |

### 4. Server Establishes Session, Client Redirects

```typescript
private loginUser(response: LoginResponse): void {
  if (redirectionURL) {
    return this.windowRef.redirect(redirectionURL); // full page redirect to /app/
  }
  // ... or route to 2FA, TnC, password change within the login remote
}
```

This is a **full page redirect**, not an SPA navigation. The server has already set the session cookie. When the browser loads `/app/`, the shell detects `TRQ_APP = 'app'` and loads the `saba-cloud` remote instead of the login remote.

### 5. Two-Factor Authentication (Optional)

If the server response indicates 2FA is required:

1. `DataFacadeService.isLoggedIn` is set to `true` (credentials verified, pending 2FA)
2. `LoginAuthGuard` gates access to the 2FA route
3. The 2FA component supports email-based OTP and mobile-based TOTP (QR code scan for first-time setup)
4. After successful OTP verification, the server provides a final `redirectionURL`

---

## How Remotes Inherit Authentication

Remote MFEs (`saba-cloud`, `saba-cloud-guest`, `analytics`, `saba-integration-hub`) never touch authentication. They inherit it through three mechanisms:

### 1. Shared HTTP Interceptor Chain

The shell registers `UxePlatformCoreInterceptorModule.forRoot()` which provides all interceptors in order:

| # | Interceptor | Purpose |
|---|---|---|
| 1 | `LoadingBarInterceptor` | Shows/hides loading bar |
| 2 | `ErrorToastInterceptor` | Displays error toasts for failed requests |
| 3 | `CsrfInterceptor` | Attaches CSRF nonce to every request |
| 4 | `AuthErrorInterceptor` | Handles 403, session timeout, CSRF errors |
| 5 | `XApiHostInterceptor` | Adds `x-api-host` header in sandbox mode |
| 6 | `CacheBusterInterceptor` | Cache-busting for API calls |
| 7 | `SCAuditInterceptor` | Audit trail headers (e-signature, password verification) |
| 8 | `AnalyticsSessionInterceptor` | Analytics session tracking |
| 9 | `SihInterceptor` | Saba Integration Hub request handling |
| 10 | `SihErrorToastInterceptor` | SIH-specific error toasts |
| 11 | `AppContextBusterInterceptor` | Main app only — context cache busting |
| 12 | `ErrorRouteInterceptor` | Main app only — routes to error page on failures |
| 13 | `LoginLinkValidatorInterceptor` | Login app only — handles 417 errors with login redirects |

Remotes share the same `HttpClient` instance, so every API call automatically gets CSRF tokens and auth error handling.

### 2. Shared NgRx Store

`SabaCloudFacade` is provided at the shell level and shared via Module Federation's singleton sharing of `@saba/uxe/platform/shared/core`. Any remote can read user state:

```typescript
// Available in any remote
this._scFacade.getUserInfo$.subscribe(...)
this._scFacade.getUserFullName$.subscribe(...)
this._scFacade.isGuestUser$.subscribe(...)
this._scFacade.isSAMLOn$.subscribe(...)
this._scFacade.isKeepMeSignedIn$.subscribe(...)
```

### 3. Server-Side Session Cookies

Auth is cookie-based. Cookies are set by the server on the same domain, so every HTTP request from any remote automatically carries the session cookie. No explicit token passing is needed between shell and remotes.

---

## Logout Flow

```
SabaCloudFacade.logout()
  → dispatches 'LOGOUT_USER' NgRx action
    → SabaCloudEffects handles it
      → UiContextService.logout()
        → PUT /Saba/api/login/logout (with SabaCertificate header)
        → Server destroys session
      → CookieUtils.eraseSystemCookies()
        → Clears: appMessageReminder, lastAccessAt, sandboxAuth
      → Redirect to server-provided URL, or force-reload to '/'
        → Shell re-bootstraps → no TRQ_APP → loads login remote
```

---

## Session Timeout & Error Handling

`AuthErrorInterceptor` watches every HTTP response from any remote:

| Error Condition | Error Code | Behaviour |
|---|---|---|
| CSRF token mismatch | `120766` | Toast: "Refresh page" |
| Concurrent session | `121166` | Toast with server error message, auto-redirect after 5s |
| Session timeout | (403 without specific code) | Toast: "Session timed out", on close → erase cookies → force reload |
| Password change required | `121200` | Toast with server error message |
| Keep-me-signed-in active | — | Silent force-reload instead of showing timeout toast |

The `LoginLinkValidatorInterceptor` (login app only) handles 417 responses with specific error codes (`120944`, `120945`, `121174`, `120946`, `120947`, `120601`) by storing the error message in `sessionStorage` and redirecting to the login URL.

---

## CSRF Protection

CSRF is handled via a nonce pattern:

1. The server injects a CSRF token into the page HTML at render time
2. `CsrfInterceptor` reads it from `Saba.site.env.fero.csrfToken` (a window property)
3. Every outgoing HTTP request gets a `csrfNonce` query parameter appended
4. The server validates the nonce on each request
5. On CSRF mismatch (error code `120766`), the `AuthErrorInterceptor` prompts the user to refresh

During bootstrap, the CSRF token is also fetched from the page head for the initial remote-definitions fetch:

```typescript
const csrfToken = !environment.sandbox && TrqWindowRef.getProp('getCsrfTokenFromHead')?.();
const headers = csrfToken ? { headers: { csrfNonce: csrfToken } } : {};
```

---

## OIDC / SAML Integration

Fero UI includes an admin configuration screen for OIDC with fields like:

- `oidcClientId`, `oidcClientSecret`, `oidcScopes`
- `oidcAuthEndPoint`, `oidcTokenEndPoint`, `oidcJWKSEndPoint`
- `oidcLogoutEndPoint`, `oidcPostLogoutRedirectURL`
- `oidcUsernameClaim`, `oidcUserInfoEndPoint`
- User provisioning settings (`oidcEnableUserProvisioning`, attribute mappings)

SAML status is tracked in the NgRx store (`isSAMLOn$`) and affects e-signature audit behaviour.

**Important:** These are **server-side SSO configurations**. The Saba backend handles the OIDC/SAML redirect flow. When OIDC or SAML is enabled, the server redirects the browser to the identity provider *before* the Angular app loads. The Angular app never directly interacts with an IdP.

---

## Module Federation — Shared Dependencies

The `base-module-federation.config.js` ensures auth-related code is shared as singletons:

```javascript
const shared = [
  '@angular/core',
  '@angular/common',
  '@angular/common/http',    // shared HttpClient → shared interceptors
  '@angular/router',
  '@ngrx/store',             // shared store → shared auth state
  '@ngrx/effects',
  '@torque/framework',       // Fero framework (layout, nav guards)
  '@saba/uxe/platform/shared/core'  // auth interceptors, facades, services
];
```

This guarantees that all remotes use the same `HttpClient` (with the shell's interceptors), the same NgRx store (with the shell's auth state), and the same `SabaCloudFacade` instance.

---

## Session & Token Storage

| Storage | Key | Purpose |
|---|---|---|
| Cookie | `lastAccessAt` | Last access timestamp for session tracking |
| Cookie | `sandboxAuth` | Dev/sandbox authentication |
| Cookie | `sabaCookieConsent` | Cookie consent flag |
| Cookie | `appMessageReminder` | System message dismissal |
| Cookie | `scLastActivityTime` | Client-side activity tracking |
| SessionStorage | `__remoteUrlDefinitions__` | Cached module federation remote URLs |
| SessionStorage | `loginErrorMessage` | Error message passed across login redirects |
| Window | `Saba.site.env.fero.csrfToken` | CSRF token (server-injected) |
| Window | `TrqGlobal.uiContext.json` | Pre-rendered user context (server-injected) |
| Window | `__remoteUrlDefinitions__` | Module federation remote URLs (runtime cache) |
| Window | `__csp_nonce__` | Content Security Policy nonce |

---

## What Fero Provides vs What the Shell Provides

### Fero (the UI framework library) Provides

- `TrqGlobalHttpHeaderService` + `TrqGlobalHttpHeader` — DI-based mechanism for injecting headers into HTTP requests
- `TrqBaseInterceptor` — abstract `HttpInterceptor` with config-driven enable/disable
- `TrqFrameworkNavGuard` — route guard that checks navigation permissions against `TrqFrameworkSettingsService`
- `TrqApplicationInitializationService` — guard ensuring app initialization completes before routing
- Framework shell layout (header, sidenav, body, footer)

### The Shell Application Provides

- Route decision logic (login vs main app vs guest vs analytics)
- `UxePlatformCoreInterceptorModule` — the full interceptor chain
- `SabaCloudFacade` — NgRx-based auth/user state management
- `UiContextService` — user context loading and logout
- `CsrfInterceptor`, `AuthErrorInterceptor` — concrete auth interceptor implementations
- Cookie management via `CookieUtils`

---

## Key Design Principle

> The shell centralises authentication. Remotes are auth-consumers, never auth-producers. The actual session lifecycle lives on the server. The Angular shell orchestrates *which* remote to load and provides the shared infrastructure (interceptors, state, cookies) that makes auth transparent to every micro-frontend.
