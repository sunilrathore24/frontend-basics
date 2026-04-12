# 05 — Frontend Security Architecture (System Design Interview Guide)

> **Scope**: Enterprise Angular SaaS security — authentication, authorization, XSS/CSRF defense, multi-tenant isolation, incident response, and CI/CD security gates.
> **Level**: Staff / Principal Frontend Architect

---

## Table of Contents

- [Q12: Design a Frontend Security Architecture for a Multi-Tenant Angular SaaS Application](#q12-design-a-frontend-security-architecture-for-a-multi-tenant-angular-saas-application)
  - [12.1 Architecture Overview](#121-architecture-overview)
  - [12.2 RBAC with Route Guards + Directive-Level Control](#122-rbac-with-route-guards--directive-level-control)
  - [12.3 OAuth 2.0 + PKCE Authentication Flow](#123-oauth-20--pkce-authentication-flow)
  - [12.4 JWT Refresh Token Rotation](#124-jwt-refresh-token-rotation)
  - [12.5 Content Security Policy (CSP)](#125-content-security-policy-csp)
  - [12.6 XSS Prevention via DomSanitizer](#126-xss-prevention-via-domsanitizer)
  - [12.7 CSRF Token Handling](#127-csrf-token-handling)
  - [12.8 Secure Storage Patterns](#128-secure-storage-patterns)
  - [12.9 Multi-Tenant Isolation Patterns](#129-multi-tenant-isolation-patterns)
  - [12.10 Architect's Verdict — Q12](#1210-architects-verdict--q12)
- [Q13: XSS Incident Response & Long-Term Remediation Architecture](#q13-xss-incident-response--long-term-remediation-architecture)
  - [13.1 Incident Response Timeline](#131-incident-response-timeline)
  - [13.2 Immediate Containment (Hour 0–4)](#132-immediate-containment-hour-04)
  - [13.3 Vulnerability Scoping Methodology](#133-vulnerability-scoping-methodology)
  - [13.4 Patch vs Replace Decision Matrix](#134-patch-vs-replace-decision-matrix)
  - [13.5 CI/CD Security Gate Configuration](#135-cicd-security-gate-configuration)
  - [13.6 Developer Education Program](#136-developer-education-program)
  - [13.7 Third-Party Dependency Security Checklist](#137-third-party-dependency-security-checklist)
  - [13.8 Ongoing Monitoring Architecture](#138-ongoing-monitoring-architecture)
  - [13.9 Architect's Verdict — Q13](#139-architects-verdict--q13)

---

## Q12: Design a Frontend Security Architecture for a Multi-Tenant Angular SaaS Application

### Interview Prompt

> *"Design a frontend security architecture for a multi-tenant Angular SaaS application serving enterprise clients with varying compliance requirements (SOC2, GDPR). Walk me through authentication, authorization, XSS/CSRF defense, and tenant isolation."*

---

### 12.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE LAYERS                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  AuthN   │  │  AuthZ   │  │Transport │  │  Input/Output    │   │
│  │  Layer   │  │  Layer   │  │ Security │  │  Sanitization    │   │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────────────┤   │
│  │OAuth 2.0 │  │RBAC      │  │CSP       │  │DomSanitizer     │   │
│  │+ PKCE    │  │Route     │  │CORS      │  │Trusted Types    │   │
│  │JWT       │  │Guards    │  │HSTS      │  │Template escaping│   │
│  │Refresh   │  │Directive │  │CSRF      │  │Pipe sanitization│   │
│  │Rotation  │  │Control   │  │Tokens    │  │                  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                                     │
│  ┌──────────────────────┐  ┌────────────────────────────────────┐  │
│  │  Secure Storage      │  │  Multi-Tenant Isolation            │  │
│  ├──────────────────────┤  ├────────────────────────────────────┤  │
│  │httpOnly Cookies      │  │Tenant-scoped tokens                │  │
│  │Encrypted localStorage│  │Subdomain isolation                 │  │
│  │Session management    │  │Data boundary enforcement           │  │
│  └──────────────────────┘  └────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Design Principles:**
- Defense in depth — no single layer is trusted alone
- Least privilege — users get minimum permissions needed
- Zero trust — every request is verified, even internal
- Compliance-driven — SOC2 audit trails, GDPR data minimization baked in

---

### 12.2 RBAC with Route Guards + Directive-Level Control

#### Permission Model

```typescript
// models/permission.model.ts
export interface Permission {
  resource: string;    // e.g., 'users', 'reports', 'billing'
  action: string;      // e.g., 'read', 'write', 'delete', 'admin'
  scope?: string;      // e.g., 'own', 'team', 'tenant', 'global'
}

export interface Role {
  id: string;
  name: string;
  tenantId: string;
  permissions: Permission[];
  inherits?: string[];  // Role inheritance chain
}

export interface TenantSecurityPolicy {
  tenantId: string;
  complianceLevel: 'SOC2' | 'GDPR' | 'HIPAA' | 'STANDARD';
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  ipWhitelist?: string[];
  dataResidency?: 'US' | 'EU' | 'APAC';
}

// Example role definitions per compliance tier
export const ROLE_DEFINITIONS: Record<string, Role> = {
  TENANT_ADMIN: {
    id: 'tenant-admin',
    name: 'Tenant Administrator',
    tenantId: '', // Set per tenant
    permissions: [
      { resource: 'users', action: 'admin', scope: 'tenant' },
      { resource: 'reports', action: 'read', scope: 'tenant' },
      { resource: 'billing', action: 'write', scope: 'tenant' },
      { resource: 'settings', action: 'admin', scope: 'tenant' },
      { resource: 'audit-logs', action: 'read', scope: 'tenant' },
    ],
    inherits: ['team-lead'],
  },
  TEAM_LEAD: {
    id: 'team-lead',
    name: 'Team Lead',
    tenantId: '',
    permissions: [
      { resource: 'users', action: 'read', scope: 'team' },
      { resource: 'reports', action: 'write', scope: 'team' },
      { resource: 'projects', action: 'admin', scope: 'team' },
    ],
    inherits: ['member'],
  },
  MEMBER: {
    id: 'member',
    name: 'Member',
    tenantId: '',
    permissions: [
      { resource: 'reports', action: 'read', scope: 'own' },
      { resource: 'projects', action: 'read', scope: 'team' },
      { resource: 'profile', action: 'write', scope: 'own' },
    ],
  },
};
```

#### Permission Service (Core Engine)

```typescript
// services/permission.service.ts
import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly permissions = signal<Permission[]>([]);
  private readonly roles = signal<Role[]>([]);
  private readonly tenantPolicy = signal<TenantSecurityPolicy | null>(null);

  // Precomputed permission map for O(1) lookups
  private readonly permissionMap = computed(() => {
    const map = new Map<string, Permission>();
    const allPermissions = this.resolveInheritedPermissions(this.roles());
    for (const perm of allPermissions) {
      const key = `${perm.resource}:${perm.action}:${perm.scope ?? '*'}`;
      map.set(key, perm);
    }
    return map;
  });

  /**
   * Check if user has a specific permission.
   * Uses O(1) map lookup instead of array scanning.
   */
  hasPermission(resource: string, action: string, scope?: string): boolean {
    const map = this.permissionMap();

    // Check exact match first
    if (map.has(`${resource}:${action}:${scope ?? '*'}`)) return true;

    // Check wildcard scope
    if (map.has(`${resource}:${action}:*`)) return true;

    // Check admin action (admin implies all actions)
    if (map.has(`${resource}:admin:${scope ?? '*'}`)) return true;
    if (map.has(`${resource}:admin:*`)) return true;

    // Check global scope (global implies all scopes)
    if (scope && map.has(`${resource}:${action}:global`)) return true;

    return false;
  }

  /**
   * Resolve role inheritance chain (DFS with cycle detection)
   */
  private resolveInheritedPermissions(roles: Role[]): Permission[] {
    const visited = new Set<string>();
    const allPermissions: Permission[] = [];

    const resolve = (role: Role) => {
      if (visited.has(role.id)) return; // Prevent circular inheritance
      visited.add(role.id);

      allPermissions.push(...role.permissions);

      if (role.inherits) {
        for (const parentId of role.inherits) {
          const parentRole = roles.find(r => r.id === parentId);
          if (parentRole) resolve(parentRole);
        }
      }
    };

    roles.forEach(resolve);
    return allPermissions;
  }

  /**
   * Check compliance-specific restrictions
   */
  isFeatureAllowed(feature: string): boolean {
    const policy = this.tenantPolicy();
    if (!policy) return false;

    // GDPR tenants cannot export PII without consent
    if (policy.complianceLevel === 'GDPR' && feature === 'bulk-export-users') {
      return false;
    }

    // SOC2 tenants require MFA for admin actions
    if (policy.complianceLevel === 'SOC2' && feature === 'admin-panel') {
      return policy.mfaRequired;
    }

    return true;
  }

  setPermissions(roles: Role[], policy: TenantSecurityPolicy): void {
    this.roles.set(roles);
    this.tenantPolicy.set(policy);
  }
}
```

#### Route Guard (Functional Guard — Angular 17+)

```typescript
// guards/permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuditLogService } from '../services/audit-log.service';

export interface PermissionGuardData {
  resource: string;
  action: string;
  scope?: string;
  complianceFeature?: string;
}

export const permissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const auditLog = inject(AuditLogService);
  const router = inject(Router);

  const { resource, action, scope, complianceFeature } =
    route.data as PermissionGuardData;

  // Check base permission
  const hasPermission = permissionService.hasPermission(resource, action, scope);

  // Check compliance-specific feature gate
  const featureAllowed = complianceFeature
    ? permissionService.isFeatureAllowed(complianceFeature)
    : true;

  if (!hasPermission || !featureAllowed) {
    // SOC2 requirement: log all access denials
    auditLog.logAccessDenied({
      route: state.url,
      resource,
      action,
      timestamp: new Date().toISOString(),
      reason: !hasPermission ? 'INSUFFICIENT_PERMISSION' : 'COMPLIANCE_RESTRICTION',
    });

    return router.createUrlTree(['/unauthorized'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return true;
};

// Route configuration example
export const APP_ROUTES = [
  {
    path: 'admin/users',
    component: UserManagementComponent,
    canActivate: [permissionGuard],
    data: {
      resource: 'users',
      action: 'admin',
      scope: 'tenant',
      complianceFeature: 'admin-panel',
    } satisfies PermissionGuardData,
  },
  {
    path: 'reports/export',
    component: ReportExportComponent,
    canActivate: [permissionGuard],
    data: {
      resource: 'reports',
      action: 'write',
      scope: 'tenant',
      complianceFeature: 'bulk-export-users',
    } satisfies PermissionGuardData,
  },
  {
    path: 'audit-logs',
    component: AuditLogComponent,
    canActivate: [permissionGuard],
    data: {
      resource: 'audit-logs',
      action: 'read',
      scope: 'tenant',
    } satisfies PermissionGuardData,
  },
];
```

#### Structural Directive for Element-Level Control

```typescript
// directives/has-permission.directive.ts
import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  inject,
  effect,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({ selector: '[appHasPermission]', standalone: true })
export class HasPermissionDirective implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  @Input('appHasPermission') permission!: string; // Format: 'resource:action' or 'resource:action:scope'
  @Input('appHasPermissionElse') elseTemplate?: TemplateRef<unknown>;

  private isRendered = false;

  constructor() {
    // Reactive: re-evaluates when permissions signal changes
    effect(() => {
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const [resource, action, scope] = this.permission.split(':');
    const hasPermission = this.permissionService.hasPermission(resource, action, scope);

    if (hasPermission && !this.isRendered) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!hasPermission) {
      this.viewContainer.clear();
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
      this.isRendered = false;
    }
  }
}
```

#### Template Usage

```html
<!-- Only visible to users with 'users:admin:tenant' permission -->
<button
  *appHasPermission="'users:admin:tenant'"
  (click)="deleteUser(user)"
  class="btn-danger">
  Delete User
</button>

<!-- With else template for graceful degradation -->
<ng-container *appHasPermission="'reports:write:team'; else readOnlyView">
  <app-report-editor [report]="report"></app-report-editor>
</ng-container>

<ng-template #readOnlyView>
  <app-report-viewer [report]="report"></app-report-viewer>
</ng-template>

<!-- Compliance-aware: hide GDPR-restricted features -->
<div *appHasPermission="'users:export:tenant'">
  <button (click)="exportUserData()">Export User Data (PII)</button>
  <p class="compliance-note">Subject to data processing agreement</p>
</div>
```

**Trade-offs — Route Guards vs Directive-Level Control:**

| Aspect | Route Guards | Directive Control |
|--------|-------------|-------------------|
| Granularity | Page-level | Element-level |
| UX | Redirects (jarring) | Hides/disables elements (smooth) |
| Security | Prevents route loading | UI-only (must enforce on backend) |
| Performance | One check per navigation | Multiple checks per template |
| Bypass risk | Low (router-enforced) | Medium (DOM manipulation possible) |

> **Architect's Note**: Always enforce permissions on the backend. Frontend RBAC is a UX optimization, not a security boundary. A determined attacker can bypass any client-side check.

---

### 12.3 OAuth 2.0 + PKCE Authentication Flow

#### Full Sequence Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Angular  │     │   Identity   │     │  Auth Server  │     │   API    │
│   SPA     │     │   Provider   │     │  (Keycloak/   │     │  Server  │
│           │     │  (IdP)       │     │   Auth0)      │     │          │
└─────┬─────┘     └──────┬───────┘     └──────┬────────┘     └────┬─────┘
      │                  │                     │                   │
      │  1. Generate code_verifier (random)    │                   │
      │  2. code_challenge = SHA256(verifier)  │                   │
      │                  │                     │                   │
      │  3. /authorize?                        │                   │
      │     response_type=code                 │                   │
      │     &client_id=spa-client              │                   │
      │     &redirect_uri=https://app/callback │                   │
      │     &scope=openid profile tenant       │                   │
      │     &code_challenge=<hash>             │                   │
      │     &code_challenge_method=S256        │                   │
      │     &state=<random_csrf_state>         │                   │
      │     &nonce=<random_nonce>              │                   │
      │─────────────────>│                     │                   │
      │                  │                     │                   │
      │  4. User authenticates (login + MFA)   │                   │
      │                  │────────────────────>│                   │
      │                  │                     │                   │
      │  5. Redirect: /callback?code=AUTH_CODE&state=<state>       │
      │<─────────────────│                     │                   │
      │                  │                     │                   │
      │  6. Validate state matches stored state│                   │
      │                  │                     │                   │
      │  7. POST /token                        │                   │
      │     grant_type=authorization_code       │                   │
      │     &code=AUTH_CODE                    │                   │
      │     &code_verifier=<original_verifier> │                   │
      │     &redirect_uri=https://app/callback │                   │
      │─────────────────────────────────────── >│                   │
      │                  │                     │                   │
      │  8. Verify: SHA256(code_verifier) === code_challenge       │
      │                  │                     │                   │
      │  9. Response:                          │                   │
      │     { access_token, refresh_token,     │                   │
      │       id_token, expires_in }           │                   │
      │     (refresh_token in httpOnly cookie)  │                   │
      │<───────────────────────────────────────│                   │
      │                  │                     │                   │
      │  10. API Request with Bearer token     │                   │
      │─────────────────────────────────────────────────────────── >│
      │                  │                     │                   │
      │  11. Validate JWT signature + claims   │                   │
      │     (tenant_id, roles, permissions)    │                   │
      │<───────────────────────────────────────────────────────────│
      │                  │                     │                   │
```

#### PKCE Auth Service Implementation

```typescript
// services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

interface AuthTokens {
  accessToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
}

interface JwtPayload {
  sub: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
  nonce: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly AUTH_CONFIG = {
    authorizeUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/oauth/token',
    clientId: 'angular-spa-client',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'openid profile email tenant:read',
    logoutUrl: 'https://auth.example.com/logout',
  };

  private accessToken$ = new BehaviorSubject<string | null>(null);
  private tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Step 1: Generate PKCE code verifier (43-128 chars, URL-safe)
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  /**
   * Step 2: Generate code challenge = SHA-256(code_verifier)
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  /**
   * Step 3: Initiate OAuth 2.0 + PKCE login flow
   */
  async login(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);

    // Store PKCE verifier and state in sessionStorage (cleared on tab close)
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_nonce', nonce);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.AUTH_CONFIG.clientId,
      redirect_uri: this.AUTH_CONFIG.redirectUri,
      scope: this.AUTH_CONFIG.scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    // Redirect to authorization server
    window.location.href = `${this.AUTH_CONFIG.authorizeUrl}?${params}`;
  }

  /**
   * Step 6-9: Handle OAuth callback, exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<void> {
    // Validate state to prevent CSRF
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('OAuth state mismatch — possible CSRF attack');
    }

    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    if (!codeVerifier) {
      throw new Error('Missing PKCE code verifier');
    }

    // Exchange authorization code for tokens
    const tokens = await this.http.post<AuthTokens>(
      this.AUTH_CONFIG.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        redirect_uri: this.AUTH_CONFIG.redirectUri,
        client_id: this.AUTH_CONFIG.clientId,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true, // Receive httpOnly cookie for refresh token
      }
    ).toPromise();

    if (!tokens) throw new Error('Token exchange failed');

    // Validate nonce in id_token to prevent replay attacks
    const idPayload = this.decodeJwt(tokens.idToken);
    const storedNonce = sessionStorage.getItem('oauth_nonce');
    if (idPayload.nonce !== storedNonce) {
      throw new Error('Nonce mismatch — possible replay attack');
    }

    // Clean up PKCE artifacts
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_nonce');

    // Store access token in memory only (not localStorage)
    this.setAccessToken(tokens.accessToken, tokens.expiresIn);

    // Navigate to intended route
    const returnUrl = sessionStorage.getItem('returnUrl') || '/dashboard';
    sessionStorage.removeItem('returnUrl');
    this.router.navigateByUrl(returnUrl);
  }

  private setAccessToken(token: string, expiresIn: number): void {
    this.accessToken$.next(token);

    // Schedule token refresh 60 seconds before expiry
    if (this.tokenExpiryTimer) clearTimeout(this.tokenExpiryTimer);
    const refreshIn = (expiresIn - 60) * 1000;
    this.tokenExpiryTimer = setTimeout(() => this.refreshToken(), refreshIn);
  }

  async refreshToken(): Promise<string | null> {
    try {
      const tokens = await this.http.post<AuthTokens>(
        this.AUTH_CONFIG.tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.AUTH_CONFIG.clientId,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true, // Refresh token sent via httpOnly cookie
        }
      ).toPromise();

      if (tokens) {
        this.setAccessToken(tokens.accessToken, tokens.expiresIn);
        return tokens.accessToken;
      }
      return null;
    } catch {
      this.logout();
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken$.getValue();
  }

  logout(): void {
    this.accessToken$.next(null);
    if (this.tokenExpiryTimer) clearTimeout(this.tokenExpiryTimer);

    // Clear all auth state
    sessionStorage.clear();

    // Redirect to IdP logout (single sign-out)
    const params = new URLSearchParams({
      client_id: this.AUTH_CONFIG.clientId,
      returnTo: window.location.origin,
    });
    window.location.href = `${this.AUTH_CONFIG.logoutUrl}?${params}`;
  }

  private decodeJwt(token: string): JwtPayload {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }
}
```

**Why PKCE over Implicit Flow?**

| Aspect | Implicit Flow (Legacy) | Auth Code + PKCE |
|--------|----------------------|------------------|
| Token exposure | Token in URL fragment (leaked via referrer, history) | Code exchanged server-side, token never in URL |
| Refresh tokens | Not supported | Supported via httpOnly cookie |
| Security | Vulnerable to token interception | Code verifier prevents interception |
| OAuth 2.1 status | Deprecated | Recommended for all clients |

---

### 12.4 JWT Refresh Token Rotation

#### Token Rotation Flow

```
┌──────────┐                    ┌──────────────┐                ┌──────────┐
│  Angular  │                    │  Auth Server  │                │   Redis  │
│   SPA     │                    │              │                │  (Token  │
│           │                    │              │                │   Store) │
└─────┬─────┘                    └──────┬───────┘                └────┬─────┘
      │                                 │                             │
      │  1. API call with expired       │                             │
      │     access_token (401)          │                             │
      │                                 │                             │
      │  2. POST /token                 │                             │
      │     grant_type=refresh_token    │                             │
      │     (refresh_token in           │                             │
      │      httpOnly cookie)           │                             │
      │────────────────────────────────>│                             │
      │                                 │                             │
      │                                 │  3. Lookup refresh_token   │
      │                                 │     in token family        │
      │                                 │────────────────────────────>│
      │                                 │                             │
      │                                 │  4. Valid: token exists     │
      │                                 │     and not revoked         │
      │                                 │<────────────────────────────│
      │                                 │                             │
      │                                 │  5. Invalidate OLD          │
      │                                 │     refresh_token           │
      │                                 │────────────────────────────>│
      │                                 │                             │
      │                                 │  6. Store NEW               │
      │                                 │     refresh_token           │
      │                                 │     (same family_id)        │
      │                                 │────────────────────────────>│
      │                                 │                             │
      │  7. Response:                   │                             │
      │     new access_token +          │                             │
      │     new refresh_token           │                             │
      │     (httpOnly cookie)           │                             │
      │<────────────────────────────────│                             │
      │                                 │                             │
      │  ─── THEFT DETECTION ───        │                             │
      │                                 │                             │
      │  8. Attacker uses STOLEN        │                             │
      │     (old) refresh_token         │                             │
      │────────────────────────────────>│                             │
      │                                 │                             │
      │                                 │  9. Token already used!     │
      │                                 │     REVOKE ENTIRE FAMILY    │
      │                                 │────────────────────────────>│
      │                                 │                             │
      │  10. 401 + Force re-login       │                             │
      │      for ALL sessions in family │                             │
      │<────────────────────────────────│                             │
      │                                 │                             │
```

**Key Insight**: Refresh token rotation detects theft. If a stolen token is replayed, the server sees it was already consumed and revokes the entire token family, forcing re-authentication.

#### HTTP Interceptor with Token Refresh Queue

```typescript
// interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  throwError,
  filter,
  take,
  switchMap,
  catchError,
} from 'rxjs';
import { AuthService } from '../services/auth.service';

// Module-level state for the functional interceptor
let isRefreshing = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

/**
 * Functional interceptor (Angular 17+ preferred pattern).
 * Handles 401 responses with queued token refresh — only ONE refresh
 * request fires even when multiple API calls fail simultaneously.
 */
export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth for public endpoints
  const publicPaths = ['/api/public', '/assets/', '/health'];
  if (publicPaths.some((path) => req.url.includes(path))) {
    return next(req);
  }

  // Attach access token from in-memory store
  const token = authService.getAccessToken();
  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/oauth/token')) {
        return handleTokenRefresh(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Queued refresh: only ONE refresh request fires, all others wait.
 * Prevents thundering herd when multiple API calls fail simultaneously.
 */
function handleTokenRefresh(
  req: any,
  next: any,
  authService: AuthService
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshToken$.next(null);

    return authService.refreshToken().pipe(
      switchMap((newToken: string | null) => {
        isRefreshing = false;

        if (newToken) {
          refreshToken$.next(newToken);
          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
              withCredentials: true,
            })
          );
        }

        // Refresh failed — force logout
        authService.logout();
        return throwError(() => new Error('Session expired'));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  }

  // Queue: wait for the ongoing refresh to complete, then retry
  return refreshToken$.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) =>
      next(
        req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
      )
    )
  );
}

// app.config.ts — Register the functional interceptor
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptorFn])),
  ],
};
```

**Trade-offs — Token Refresh Strategies:**

| Strategy | Pros | Cons |
|----------|------|------|
| Silent refresh (iframe) | No cookie dependency | Blocked by third-party cookie policies, CSP issues |
| Refresh token rotation | Theft detection, secure | Requires server-side token family tracking |
| Sliding session | Simple UX | No theft detection, longer exposure window |
| BFF pattern (Backend-for-Frontend) | Tokens never reach browser | Additional infrastructure, latency |

---

### 12.5 Content Security Policy (CSP)

#### Production CSP Header Configuration

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM_NONCE}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://cdn.example.com https://*.gravatar.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self'
    https://api.example.com
    https://auth.example.com
    https://*.analytics.example.com
    wss://realtime.example.com;
  frame-src 'none';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://auth.example.com;
  upgrade-insecure-requests;
  report-uri https://csp-report.example.com/collect;
  report-to csp-endpoint;
```

#### CSP Middleware Implementation

```typescript
// server/csp-middleware.ts (Express/Node.js backend)
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function cspMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate unique nonce per request
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;

  const cspDirectives = [
    // Default: only allow resources from same origin
    "default-src 'self'",

    // Scripts: same origin + nonce-based (no 'unsafe-inline' or 'unsafe-eval')
    // Angular AOT compilation eliminates need for 'unsafe-eval'
    `script-src 'self' 'nonce-${nonce}'`,

    // Styles: Angular uses inline styles for component encapsulation
    // 'unsafe-inline' required for Angular ViewEncapsulation
    // TODO: Migrate to nonce-based styles when Angular supports it
    "style-src 'self' 'unsafe-inline'",

    // Images: self + CDN + data URIs (for inline SVGs)
    "img-src 'self' data: https://cdn.example.com",

    // Fonts: self + Google Fonts CDN
    "font-src 'self' https://fonts.gstatic.com",

    // API connections: restrict to known backends
    "connect-src 'self' https://api.example.com https://auth.example.com wss://realtime.example.com",

    // Prevent framing (clickjacking protection)
    "frame-src 'none'",
    "frame-ancestors 'none'",

    // Block Flash, Java applets
    "object-src 'none'",

    // Prevent base tag hijacking
    "base-uri 'self'",

    // Restrict form submissions
    "form-action 'self' https://auth.example.com",

    // Force HTTPS
    "upgrade-insecure-requests",

    // Report violations (monitor before enforcing)
    "report-uri https://csp-report.example.com/collect",
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // Additional security headers (defense in depth)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Disabled — CSP is the modern replacement
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  next();
}
```

#### CSP Report-Only Mode (Safe Rollout)

```typescript
// Phase 1: Report-Only (monitor without breaking — run 2-4 weeks)
res.setHeader(
  'Content-Security-Policy-Report-Only',
  "default-src 'self'; script-src 'self'; report-uri /csp-report"
);

// Phase 2: Enforce after analyzing reports
res.setHeader(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'nonce-${nonce}'; report-uri /csp-report"
);
```

**Angular-Specific CSP Considerations:**

| Angular Feature | CSP Impact | Solution |
|----------------|-----------|----------|
| AOT Compilation | Eliminates `unsafe-eval` need | Use AOT in production (default since Angular 9) |
| Component styles | Requires `unsafe-inline` for styles | Accept trade-off or use `ViewEncapsulation.None` |
| Dynamic templates | Would need `unsafe-eval` | Never use JIT in production |
| Third-party scripts | Violates strict `script-src` | Use nonce-based loading or subresource integrity |

---
