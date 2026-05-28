# HTML & JavaScript Code Review Cheatsheet

A 73-point reference for reviewing HTML/JS code. Each point includes a short
explanation and a **bad vs good** snippet. Use it to brush up before code
reviews, interviews, or self-review.

**Categories**

1. [Security (1–12, 51–55)](#security)
2. [Accessibility (13–22, 56–60)](#accessibility)
3. [Bugs & Correctness (23–30, 61–63)](#bugs--correctness)
4. [Performance (31–36, 64–66)](#performance)
5. [Architecture & Design (37–42, 71–73)](#architecture--design)
6. [Code Quality & Modern JS (43–48)](#code-quality--modern-js)
7. [HTML Semantics (49–50, 67–70)](#html-semantics)

---

## Security

### 1. Never use `eval()` to parse data

`eval` runs arbitrary code. If the input is ever attacker-controlled, you get RCE.

```js
// ❌ Bad
function loadConfig(str) {
  return eval('(' + str + ')');
}

// ✅ Good
function loadConfig(str) {
  return JSON.parse(str);
}
```

---

### 2. Escape user content before injecting into HTML

Concatenating user data into `innerHTML` is stored XSS.

```js
// ❌ Bad
container.innerHTML = '<div>' + user.name + '</div>';

// ✅ Good — use textContent or escape
const div = document.createElement('div');
div.textContent = user.name;
container.appendChild(div);
```

---

### 3. Never log secrets to the console

Tokens, passwords, and PII in `console.log` end up in browser DevTools, extensions, and log aggregators.

```js
// ❌ Bad
console.log('Auth token:', localStorage.getItem('token'));

// ✅ Good — log nothing, or log a redacted reference
console.log('Auth token loaded:', !!localStorage.getItem('token'));
```

---

### 4. Don't store JWTs in `localStorage`

Any XSS reads `localStorage`. Use HttpOnly, Secure, SameSite cookies set by the server.

```js
// ❌ Bad
localStorage.setItem('auth_token', token);
fetch('/api', { headers: { Authorization: 'Bearer ' + token } });

// ✅ Good — server sets HttpOnly cookie; browser sends it automatically
fetch('/api', { credentials: 'include' });
```

---

### 5. Don't trust client-side JWT decoding for authorization

The signature isn't verified in the browser. Authorization decisions belong on the server.

```js
// ❌ Bad
const user = parseJwt(token);
if (user.role === 'admin') showAdminPanel();

// ✅ Good — server returns what the user is allowed to see
const me = await fetch('/api/me').then(r => r.json());
if (me.canAccessAdmin) showAdminPanel();
```

---

### 6. Always URL-encode query parameters

Unencoded user input in URLs breaks parsing and enables parameter injection.

```js
// ❌ Bad
fetch('/api/search?q=' + query);

// ✅ Good
fetch('/api/search?q=' + encodeURIComponent(query));

// ✅ Better — URLSearchParams handles edge cases
const params = new URLSearchParams({ q: query });
fetch('/api/search?' + params);
```

---

### 7. Protect state-changing endpoints from CSRF

Any cookie-authenticated POST/DELETE/PUT needs CSRF protection.

```js
// ❌ Bad — no CSRF token
fetch('/api/users', { method: 'DELETE', credentials: 'include' });

// ✅ Good
fetch('/api/users', {
  method: 'DELETE',
  credentials: 'include',
  headers: { 'X-CSRF-Token': getCsrfToken() }
});
```

---

### 8. Require re-authentication for destructive operations

Bulk deletes, password changes, and admin actions should ask for the password again or step up to MFA.

```js
// ❌ Bad
function purgeAllUsers() {
  fetch('/api/users', { method: 'DELETE' });
}

// ✅ Good
async function purgeAllUsers() {
  const password = await promptPassword();
  await fetch('/api/users', {
    method: 'DELETE',
    headers: { 'X-Reauth-Password': password }
  });
}
```

---

### 9. Always use HTTPS for API calls

HTTP transmits tokens, sessions, and PII in cleartext.

```js
// ❌ Bad
fetch('http://api.example.com/users');

// ✅ Good
fetch('https://api.example.com/users');
```

---

### 10. Set a Content-Security-Policy

CSP is a strong defense-in-depth against XSS.

```html
<!-- ❌ Bad — no CSP, inline handlers run freely -->
<button onclick="doThing()">Click</button>

<!-- ✅ Good — strict CSP and event listeners attached in JS -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; object-src 'none';">
<button id="btn">Click</button>
<script>document.getElementById('btn').addEventListener('click', doThing);</script>
```

---

### 11. Never use `dangerouslySetInnerHTML` (or innerHTML) with user input

Same XSS class as #2 — explicit callout because frameworks have escape hatches.

```jsx
// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: user.bio }} />

// ✅ Good — render text, or sanitize with DOMPurify
<div>{user.bio}</div>
// or, if HTML is required:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />
```

---

### 12. Use cryptographically secure randomness for tokens

`Math.random()` is predictable and unsuitable for security.

```js
// ❌ Bad
const token = Math.random().toString(36).slice(2);

// ✅ Good
const bytes = new Uint8Array(32);
crypto.getRandomValues(bytes);
const token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
```

---

## Accessibility

### 13. Always provide `alt` for images

Decorative images use `alt=""`. Meaningful images need a description.

```html
<!-- ❌ Bad -->
<img src="/logo.png" />

<!-- ✅ Good -->
<img src="/logo.png" alt="Acme Corp logo" />
<img src="/decoration.png" alt="" />
```

---

### 14. Use real `<button>` elements for buttons

`<div onclick>` is not keyboard-accessible by default.

```html
<!-- ❌ Bad -->
<div class="btn" onclick="save()">Save</div>

<!-- ✅ Good -->
<button type="button" class="btn" id="save">Save</button>
<script>document.getElementById('save').addEventListener('click', save);</script>
```

---

### 15. Associate labels with form controls

`placeholder` is not a label. Screen readers don't reliably announce it.

```html
<!-- ❌ Bad -->
<input type="text" placeholder="Email" />

<!-- ✅ Good -->
<label for="email">Email</label>
<input type="email" id="email" name="email" />
```

---

### 16. Match `<label for>` to input `id`

Mismatched IDs break the association silently.

```html
<!-- ❌ Bad -->
<label for="user-role">Role</label>
<select id="user-type">…</select>

<!-- ✅ Good -->
<label for="user-role">Role</label>
<select id="user-role">…</select>
```

---

### 17. Manage focus when opening and closing modals

Focus must move into the modal on open and return to the trigger on close.

```js
// ❌ Bad
function openModal() { modal.style.display = 'block'; }

// ✅ Good
let lastFocus;
function openModal() {
  lastFocus = document.activeElement;
  modal.style.display = 'block';
  modal.querySelector('[autofocus], button, [href], input')?.focus();
}
function closeModal() {
  modal.style.display = 'none';
  lastFocus?.focus();
}
```

---

### 18. Announce dynamic status messages with `aria-live`

Toasts, inline errors, and async results need a live region.

```html
<!-- ❌ Bad -->
<div id="status"></div>

<!-- ✅ Good -->
<div id="status" role="status" aria-live="polite"></div>
```

---

### 19. Don't skip heading levels

Headings should form a hierarchy. Don't pick `<h5>` because it "looks right."

```html
<!-- ❌ Bad -->
<h1>Page</h1>
<h5>Section</h5>

<!-- ✅ Good — style with CSS, structure with semantics -->
<h1>Page</h1>
<h2 class="section-heading">Section</h2>
```

---

### 20. Set `lang` on the `<html>` element

Screen readers use it to pick the right pronunciation.

```html
<!-- ❌ Bad -->
<html>

<!-- ✅ Good -->
<html lang="en">
```

---

### 21. Don't use `tabindex` greater than 0

Positive `tabindex` breaks the natural tab order.

```html
<!-- ❌ Bad -->
<button tabindex="5">Save</button>

<!-- ✅ Good — rely on DOM order, use tabindex="0" only to make non-focusable elements focusable -->
<button>Save</button>
```

---

### 22. Don't hide focus indicators

Removing `:focus` outlines makes the page unusable for keyboard users.

```css
/* ❌ Bad */
button:focus { outline: none; }

/* ✅ Good — provide a visible alternative */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

---

## Bugs & Correctness

### 23. Always check `response.ok` before parsing

Failed responses still resolve the promise. `.json()` may throw or return garbage.

```js
// ❌ Bad
const data = await fetch('/api/users').then(r => r.json());

// ✅ Good
const resp = await fetch('/api/users');
if (!resp.ok) throw new Error(`API ${resp.status}`);
const data = await resp.json();
```

---

### 24. Preserve `this` when passing methods as callbacks

Bare method references lose their object context.

```js
// ❌ Bad
button.addEventListener('click', ThemeManager.setTheme);

// ✅ Good
button.addEventListener('click', () => ThemeManager.setTheme('dark'));
// or
button.addEventListener('click', ThemeManager.setTheme.bind(ThemeManager));
```

---

### 25. Guard against null/undefined input

A defensive function never assumes its input is well-formed.

```js
// ❌ Bad
function parseJwt(token) {
  return JSON.parse(atob(token.split('.')[1]));
}

// ✅ Good
function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}
```

---

### 26. Cover the default case in conditional logic

Missing branches return `undefined` and surface as bugs in the UI.

```js
// ❌ Bad
function getRole(type) {
  if (type === 1) return 'Standard';
  if (type === 2) return 'Admin';
  if (type === 3) return 'SuperAdmin';
}

// ✅ Good
function getRole(type) {
  switch (type) {
    case 1: return 'Standard';
    case 2: return 'Admin';
    case 3: return 'SuperAdmin';
    default: return 'Unknown';
  }
}
```

---

### 27. Avoid mutating function arguments

In-place mutation creates spooky action at a distance.

```js
// ❌ Bad
function format(users) {
  for (const u of users) u.display = `${u.name} <${u.email}>`;
  return users;
}

// ✅ Good
function format(users) {
  return users.map(u => ({ ...u, display: `${u.name} <${u.email}>` }));
}
```

---

### 28. Clean up timers, listeners, and subscriptions

Leaks keep code running after the user navigates away.

```js
// ❌ Bad
setInterval(loadUsers, 30000);

// ✅ Good
const id = setInterval(loadUsers, 30000);
window.addEventListener('beforeunload', () => clearInterval(id));
```

---

### 29. Handle browser back/forward when using `pushState`

`pushState` updates the URL but not the view — you must listen for `popstate`.

```js
// ❌ Bad
function navigate(view) {
  history.pushState(null, '', '/' + view);
  render(view);
}

// ✅ Good
function navigate(view) {
  history.pushState({ view }, '', '/' + view);
  render(view);
}
window.addEventListener('popstate', e => render(e.state?.view ?? 'home'));
```

---

### 30. Cancel stale async requests

Without cancellation, slow responses can overwrite fresh ones.

```js
// ❌ Bad
async function search(q) {
  const r = await fetch('/api/search?q=' + q);
  render(await r.json());
}

// ✅ Good
let controller;
async function search(q) {
  controller?.abort();
  controller = new AbortController();
  try {
    const r = await fetch('/api/search?q=' + encodeURIComponent(q), { signal: controller.signal });
    render(await r.json());
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  }
}
```

---

## Performance

### 31. Paginate large lists

Rendering thousands of rows freezes the browser.

```js
// ❌ Bad
const users = await fetch('/api/users').then(r => r.json());
renderAll(users);

// ✅ Good
const users = await fetch('/api/users?page=1&pageSize=25').then(r => r.json());
renderPage(users.items);
```

---

### 32. Debounce expensive event handlers

Search-as-you-type that fires per keystroke hammers the network.

```js
// ❌ Bad
input.addEventListener('input', e => search(e.target.value));

// ✅ Good
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
input.addEventListener('input', debounce(e => search(e.target.value), 300));
```

---

### 33. Build DOM with fragments instead of string concatenation in a loop

Repeated `innerHTML +=` reparses the entire subtree each time.

```js
// ❌ Bad
let html = '';
for (const u of users) html += '<li>' + u.name + '</li>';
list.innerHTML = html;

// ✅ Good
const frag = document.createDocumentFragment();
for (const u of users) {
  const li = document.createElement('li');
  li.textContent = u.name;
  frag.appendChild(li);
}
list.replaceChildren(frag);
```

---

### 34. Use event delegation for many similar handlers

Attaching a handler per row scales poorly.

```js
// ❌ Bad
document.querySelectorAll('.row').forEach(row =>
  row.addEventListener('click', handle));

// ✅ Good — one listener on the parent
list.addEventListener('click', e => {
  const row = e.target.closest('.row');
  if (row) handle(row);
});
```

---

### 35. Don't trigger layout in a loop

Reading layout properties (`offsetWidth`, `clientHeight`) after writes forces synchronous reflow.

```js
// ❌ Bad
for (const el of items) {
  el.style.height = el.offsetHeight + 10 + 'px'; // read+write+read+write...
}

// ✅ Good — read all, then write all
const heights = items.map(el => el.offsetHeight);
items.forEach((el, i) => el.style.height = heights[i] + 10 + 'px');
```

---

### 36. Lazy-load heavy assets and code

Don't ship everything up front.

```html
<!-- ❌ Bad -->
<img src="/big.jpg" />
<script src="/heavy.js"></script>

<!-- ✅ Good -->
<img src="/big.jpg" loading="lazy" />
<script src="/heavy.js" defer></script>
```

---

## Architecture & Design

### 37. Avoid global mutable state

Globals can be mutated by anyone, anywhere.

```js
// ❌ Bad
var users = [];
function load() { users = fetched; }

// ✅ Good
const store = (() => {
  let users = [];
  return {
    set: u => { users = u; },
    get: () => users.slice()
  };
})();
```

---

### 38. Separate inline handlers from HTML

Inline `onclick` couples markup to logic and breaks under CSP.

```html
<!-- ❌ Bad -->
<button onclick="save()">Save</button>

<!-- ✅ Good -->
<button id="save-btn">Save</button>
<script>document.getElementById('save-btn').addEventListener('click', save);</script>
```

---

### 39. Don't hardcode environment-specific URLs

Configuration belongs in environment files or a runtime config.

```js
// ❌ Bad
fetch('http://localhost:3000/api/users');

// ✅ Good
fetch(`${window.APP_CONFIG.apiBase}/api/users`);
```

---

### 40. Single Responsibility — one function, one job

Functions that do many things via a `type` argument are hard to test and extend.

```js
// ❌ Bad
function processData(data, type, opts) {
  if (type === 'filter') { /* … */ }
  else if (type === 'sort') { /* … */ }
  else if (type === 'csv') { /* … */ }
}

// ✅ Good
function filterByType(data, type) { /* … */ }
function sortBy(data, field) { /* … */ }
function toCsv(data) { /* … */ }
```

---

### 41. Keep validation pure

A validator that writes to storage or makes network calls hides side effects.

```js
// ❌ Bad
function validate(data) {
  const ok = data.name && data.email;
  localStorage.setItem('lastValidation', Date.now());
  return ok;
}

// ✅ Good
function validate(data) {
  return Boolean(data.name && data.email);
}
```

---

### 42. Don't repeat yourself

Duplicate functions drift apart over time.

```js
// ❌ Bad
function formatDate(d) { /* … */ }
function formatUserDate(d) { /* identical body */ }

// ✅ Good — one function, used everywhere
function formatDate(d) { /* … */ }
```

---

## Code Quality & Modern JS

### 43. Use `const` and `let`, not `var`

`var` is function-scoped and hoisted in surprising ways.

```js
// ❌ Bad
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0); // prints 3, 3, 3

// ✅ Good
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0); // prints 0, 1, 2
```

---

### 44. Use strict equality `===`

`==` does type coercion with surprising results.

```js
// ❌ Bad
if (count == '0') { /* truthy when count is 0 or '0' */ }
if (value == null) { /* matches null AND undefined */ }

// ✅ Good
if (count === 0) { /* … */ }
if (value === null || value === undefined) { /* … */ }
```

---

### 45. Strip debug flags before shipping

Hardcoded `DEBUG = true` ends up in production.

```js
// ❌ Bad
const DEBUG = true;
if (DEBUG) console.log('state', state);

// ✅ Good — build-time constant, dead-code-eliminated in production
if (process.env.NODE_ENV !== 'production') {
  console.log('state', state);
}
```

---

### 46. Prefer optional chaining and nullish coalescing

Cleaner than long `&&` chains and safer than `||` for falsy values.

```js
// ❌ Bad
const name = user && user.profile && user.profile.name || 'Anonymous';

// ✅ Good
const name = user?.profile?.name ?? 'Anonymous';
```

---

### 47. Show user-visible loading and error states

Silent failures confuse users.

```js
// ❌ Bad
async function load() {
  const data = await fetch('/api').then(r => r.json());
  render(data);
}

// ✅ Good
async function load() {
  setLoading(true);
  try {
    const r = await fetch('/api');
    if (!r.ok) throw new Error('Failed');
    render(await r.json());
  } catch (e) {
    showError(e.message);
  } finally {
    setLoading(false);
  }
}
```

---

### 48. Escape special characters in CSV exports

Commas, quotes, and newlines inside fields corrupt the file.

```js
// ❌ Bad
const csv = users.map(u => `${u.name},${u.email}`).join('\n');

// ✅ Good
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const csv = users.map(u => [u.name, u.email].map(csvCell).join(',')).join('\n');
```

---

## HTML Semantics

### 49. Use semantic landmarks instead of generic `<div>`s

Landmarks help assistive tech and SEO.

```html
<!-- ❌ Bad -->
<div class="header">…</div>
<div class="main">…</div>
<div class="footer">…</div>

<!-- ✅ Good -->
<header>…</header>
<nav>…</nav>
<main>…</main>
<footer>…</footer>
```

---

### 50. Mark up forms and links correctly

`<a>` is for navigation, `<button>` is for actions. Don't swap them.

```html
<!-- ❌ Bad -->
<a href="#" onclick="deleteUser()">Delete</a>
<button onclick="window.location='/about'">About</button>

<!-- ✅ Good -->
<button type="button" onclick="deleteUser()">Delete</button>
<a href="/about">About</a>
```

---

## How to Use This Document

1. **Before a code review** — skim the categories relevant to the PR (frontend → accessibility, API changes → security/correctness).
2. **During a review** — search for the bad-pattern keyword (`innerHTML`, `eval`, `localStorage`, `var`, `==`).
3. **In an interview** — group your feedback by priority: security → correctness → accessibility → architecture → performance → style.
4. **As a reference** — each entry is self-contained, so jump to whichever number matches the issue you're seeing.

---

# Part 2 — Additional Topics (51–73)

## Security (cont.)

### 51. Add `rel="noopener noreferrer"` to `target="_blank"` links

Without it, the new tab can navigate the original via `window.opener` (tabnabbing) and the referrer leaks.

```html
<!-- ❌ Bad -->
<a href="https://other.com" target="_blank">External</a>

<!-- ✅ Good -->
<a href="https://other.com" target="_blank" rel="noopener noreferrer">External</a>
```

---

### 52. Use Subresource Integrity for third-party scripts

A compromised CDN can serve modified code. SRI ensures the bytes match a known hash.

```html
<!-- ❌ Bad -->
<script src="https://cdn.example.com/lib.js"></script>

<!-- ✅ Good -->
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-…"
        crossorigin="anonymous"></script>
```

---

### 53. Validate redirect targets against an allowlist

Open redirects enable phishing. Never redirect to a user-supplied URL without checking it.

```js
// ❌ Bad
window.location = new URLSearchParams(location.search).get('next');

// ✅ Good
const allowed = ['/dashboard', '/profile', '/settings'];
const next = new URLSearchParams(location.search).get('next');
if (allowed.includes(next)) window.location = next;
else window.location = '/dashboard';
```

---

### 54. Guard against prototype pollution

Merging untrusted JSON into objects can poison `Object.prototype`.

```js
// ❌ Bad
function merge(target, source) {
  for (const k in source) target[k] = source[k];
  return target;
}
merge({}, JSON.parse('{"__proto__":{"isAdmin":true}}'));
// Now ({}).isAdmin === true everywhere

// ✅ Good — reject dangerous keys, or use Object.create(null)
function merge(target, source) {
  for (const k of Object.keys(source)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    target[k] = source[k];
  }
  return target;
}
```

---

### 55. Avoid catastrophic regex backtracking (ReDoS)

Nested quantifiers on user input can hang the event loop.

```js
// ❌ Bad — exponential on input like "aaaaaaaaaaaaaaaaaaaaa!"
const ok = /^(a+)+$/.test(userInput);

// ✅ Good — anchor and avoid nested quantifiers
const ok = /^a+$/.test(userInput);
// or use a length cap before regex:
if (userInput.length > 100) return false;
```

---

## Accessibility (cont.)

### 56. Meet color-contrast minimums

WCAG AA requires 4.5:1 for normal text, 3:1 for large text and UI components.

```css
/* ❌ Bad — light grey on white, fails AA */
.muted { color: #aaa; background: #fff; }

/* ✅ Good — passes 4.5:1 */
.muted { color: #595959; background: #fff; }
```

---

### 57. Don't rely on color alone to convey meaning

Colorblind users miss red-only error states. Pair color with an icon, text, or shape.

```html
<!-- ❌ Bad -->
<input class="invalid" /> <!-- red border only -->

<!-- ✅ Good -->
<input class="invalid" aria-invalid="true" aria-describedby="err-1" />
<p id="err-1" class="error">⚠ Email is required</p>
```

---

### 58. Wire form errors with `aria-invalid` and `aria-describedby`

Screen readers need to associate the error with its field.

```html
<!-- ❌ Bad -->
<input type="email" />
<span class="error">Invalid email</span>

<!-- ✅ Good -->
<label for="email">Email</label>
<input type="email" id="email" aria-invalid="true" aria-describedby="email-err" />
<p id="email-err" class="error">Please enter a valid email address</p>
```

---

### 59. Provide a skip-to-content link

Lets keyboard and screen reader users jump past navigation.

```html
<!-- ❌ Bad -->
<body>
  <nav>…lots of links…</nav>
  <main>…</main>

<!-- ✅ Good -->
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <nav>…</nav>
  <main id="main" tabindex="-1">…</main>
```

---

### 60. Ensure touch targets are at least 44×44 CSS pixels

Small targets on mobile fail WCAG 2.5.5 and frustrate users.

```css
/* ❌ Bad */
.icon-btn { width: 24px; height: 24px; padding: 0; }

/* ✅ Good */
.icon-btn { min-width: 44px; min-height: 44px; padding: 10px; }
```

---

## Bugs & Correctness (cont.)

### 61. Don't trust floating-point math for money or comparisons

Decimal arithmetic in JS isn't exact.

```js
// ❌ Bad
0.1 + 0.2 === 0.3; // false
const total = price * quantity; // rounding errors accumulate

// ✅ Good — work in integer minor units (cents)
const cents = Math.round(price * 100) * quantity;
const display = (cents / 100).toFixed(2);

// or use a library: dinero.js, decimal.js
```

---

### 62. Store dates in UTC, format in the user's timezone

Storing local time creates ambiguity around DST and travel.

```js
// ❌ Bad
const created = new Date().toString(); // "Mon May 28 2026 14:32:00 GMT+0530"
db.save(created);

// ✅ Good
const created = new Date().toISOString(); // "2026-05-28T09:02:00.000Z"
db.save(created);

// On display:
new Date(stored).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
```

---

### 63. Handle async errors in event handlers and promises

Unhandled rejections silently swallow bugs.

```js
// ❌ Bad
button.addEventListener('click', async () => {
  const data = await fetch('/api').then(r => r.json()); // throws on network error
  render(data);
});

// ✅ Good
button.addEventListener('click', async () => {
  try {
    const r = await fetch('/api');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    render(await r.json());
  } catch (e) {
    showError(e.message);
  }
});

// And catch what slipped through:
window.addEventListener('unhandledrejection', e => reportError(e.reason));
window.addEventListener('error', e => reportError(e.error));
```

---

## Performance (cont.)

### 64. Set `width` and `height` on images to prevent layout shift

Reserves space before the image loads. Improves Core Web Vital CLS.

```html
<!-- ❌ Bad -->
<img src="/hero.jpg" />

<!-- ✅ Good -->
<img src="/hero.jpg" width="1200" height="600" alt="…" />
```

---

### 65. Run independent awaits in parallel with `Promise.all`

Sequential `await` in a loop multiplies latency.

```js
// ❌ Bad — N round trips, serially
const results = [];
for (const id of ids) {
  results.push(await fetch('/api/' + id).then(r => r.json()));
}

// ✅ Good — N round trips, in parallel
const results = await Promise.all(
  ids.map(id => fetch('/api/' + id).then(r => r.json()))
);

// ✅ Even better — use allSettled if one failure shouldn't kill all
const settled = await Promise.allSettled(ids.map(id => fetch('/api/' + id)));
```

---

### 66. Code-split with dynamic `import()`

Don't ship the admin bundle to anonymous visitors.

```js
// ❌ Bad — admin code in main bundle
import { AdminDashboard } from './admin';
if (user.isAdmin) renderAdmin();

// ✅ Good — loaded on demand
if (user.isAdmin) {
  const { AdminDashboard } = await import('./admin');
  renderAdmin(AdminDashboard);
}
```

---

## HTML Semantics (cont.)

### 67. Always declare charset and viewport

Wrong charset causes mojibake. No viewport meta makes mobile rendering broken.

```html
<!-- ❌ Bad -->
<head>
  <title>App</title>
</head>

<!-- ✅ Good -->
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>App</title>
</head>
```

---

### 68. Add `autocomplete` attributes to form fields

Helps password managers and improves UX. Disabling autofill needs an explicit reason.

```html
<!-- ❌ Bad -->
<input type="text" name="email" />
<input type="password" name="password" />

<!-- ✅ Good -->
<input type="email" name="email" autocomplete="email" />
<input type="password" name="password" autocomplete="current-password" />
<!-- New password creation: autocomplete="new-password" -->
```

---

### 69. Use the right input `type` and `inputmode`

The browser provides validation, the right keyboard, and better UX for free.

```html
<!-- ❌ Bad -->
<input type="text" placeholder="Email" />
<input type="text" placeholder="Phone" />
<input type="text" placeholder="Card number" />

<!-- ✅ Good -->
<input type="email" autocomplete="email" />
<input type="tel" inputmode="tel" autocomplete="tel" />
<input type="text" inputmode="numeric" autocomplete="cc-number" pattern="[0-9 ]+" />
```

---

### 70. Hint critical resources with `preconnect` and `preload`

Saves the connection-establishment cost for known dependencies.

```html
<!-- ❌ Bad — browser discovers font URL only after parsing CSS -->
<link rel="stylesheet" href="/styles.css" />

<!-- ✅ Good -->
<link rel="preconnect" href="https://fonts.example.com" crossorigin />
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/styles.css" />
```

---

## Architecture & Design (cont.)

### 71. Install global error and rejection handlers

Catch what slips past per-call try/catch and report it.

```js
// ❌ Bad — errors disappear into the console
async function load() { /* may throw */ }
load();

// ✅ Good
window.addEventListener('error', e => {
  reportError({ message: e.message, source: e.filename, line: e.lineno });
});
window.addEventListener('unhandledrejection', e => {
  reportError({ message: 'Unhandled rejection', reason: String(e.reason) });
});
```

---

### 72. Prefer typed code (TypeScript or JSDoc)

Types catch a large share of the bugs that show up in plain-JS code reviews.

```js
// ❌ Bad — silent at call sites, breaks at runtime
function getUserType(obj) {
  if (obj.type == 1) return 'Standard';
  // ...
}

// ✅ Good — TypeScript
type UserType = 1 | 2 | 3;
function getUserType(obj: { type: UserType }): string {
  switch (obj.type) {
    case 1: return 'Standard';
    case 2: return 'Admin';
    case 3: return 'SuperAdmin';
  }
}

// ✅ Good — JSDoc for plain JS
/**
 * @param {{ type: 1 | 2 | 3 }} obj
 * @returns {string}
 */
function getUserType(obj) { /* … */ }
```

---

### 73. Demand tests with non-trivial changes

Untested code is unverified code. New features and bug fixes should ship with tests.

```js
// ❌ Bad — review comment: "Looks good, ship it." (no tests added)

// ✅ Good — review comment: "Add a test that covers the empty-input case
//    and the type-3 admin path. The bug we just fixed should fail without
//    your change and pass with it."

// Example using Vitest/Jest
describe('getUserType', () => {
  it('returns Standard for type 1', () => {
    expect(getUserType({ type: 1 })).toBe('Standard');
  });
  it('returns Unknown for unrecognized types', () => {
    expect(getUserType({ type: 99 })).toBe('Unknown');
  });
});
```
