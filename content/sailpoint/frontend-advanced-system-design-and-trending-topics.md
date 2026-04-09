# Frontend Advanced System Design & Trending Topics
> 16 commonly asked topics missing from standard interview prep — covering frontend system design, real-time architecture, AI integration, offline-first patterns, and advanced engineering concepts.

---

## 1. Design an Autocomplete / Typeahead Search

**Why they ask:** The #1 most-asked frontend system design question at Google, Meta, Airbnb, Uber. Looks simple but tests debouncing, caching, API design, keyboard navigation, and accessibility.

**Model Answer:**

**Requirements clarification:**
- Show suggestions as user types (after 2+ characters)
- Highlight matching text in suggestions
- Keyboard navigation (arrow keys, Enter to select, Escape to close)
- Handle slow networks gracefully
- Accessible to screen readers

**Architecture:**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Input Box  │────▶│  Controller  │────▶│  API Client  │
│  (UI Layer) │     │  (debounce,  │     │  (fetch +    │
│             │◀────│   cache)     │◀────│   abort)     │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                    ┌─────▼─────┐
                    │  LRU Cache │
                    │  (in-memory)│
                    └───────────┘
```

**Key implementation details:**

```typescript
// Debounce — don't fire on every keystroke
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// AbortController — cancel in-flight requests when user types again
let controller: AbortController | null = null;

async function fetchSuggestions(query: string): Promise<string[]> {
  controller?.abort(); // Cancel previous request
  controller = new AbortController();

  // Check cache first
  const cached = cache.get(query);
  if (cached) return cached;

  const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`, {
    signal: controller.signal
  });
  const data = await res.json();
  cache.set(query, data); // LRU cache
  return data;
}

// LRU Cache — bounded memory
class LRUCache<K, V> {
  private map = new Map<K, V>();
  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val); // Move to end (most recent)
    return val;
  }

  set(key: K, val: V) {
    this.map.delete(key);
    this.map.set(key, val);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value); // Evict oldest
    }
  }
}
```

**Keyboard navigation:**
- Arrow Up/Down → move highlight through suggestions
- Enter → select highlighted suggestion
- Escape → close dropdown
- Use `aria-activedescendant` to announce the highlighted item to screen readers

**Accessibility:**
```html
<input
  role="combobox"
  aria-expanded="true"
  aria-controls="suggestions-list"
  aria-activedescendant="suggestion-2"
/>
<ul id="suggestions-list" role="listbox">
  <li id="suggestion-0" role="option">Angular</li>
  <li id="suggestion-1" role="option">Angular Material</li>
  <li id="suggestion-2" role="option" aria-selected="true">Angular CDK</li>
</ul>
```

**Optimizations:**
- Debounce at 200-300ms
- Minimum 2 characters before searching
- Prefetch popular queries on page load
- Show recent searches from localStorage as instant suggestions
- Highlight matching substring in results

---

## 2. Design an Infinite Scroll / Virtualized Feed

**Why they ask:** Tests pagination strategy, memory management, scroll performance, and intersection observer knowledge. Asked at Meta, Twitter, LinkedIn.

**Model Answer:**

**Two approaches:**

| Approach | How it works | Best for |
|---|---|---|
| **Infinite scroll** | Load more items as user scrolls near bottom | Social feeds, news, search results |
| **Virtualized list** | Only render visible items + buffer | Very long lists (10K+ items), tables |

**Infinite scroll with Intersection Observer:**

```typescript
// Intersection Observer — triggers when sentinel enters viewport
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
      loadNextPage();
    }
  },
  { rootMargin: '200px' } // Start loading 200px before user reaches bottom
);

// Attach to a sentinel element at the bottom of the list
observer.observe(document.getElementById('scroll-sentinel')!);
```

**Pagination strategy — cursor vs offset:**

| Strategy | Pros | Cons |
|---|---|---|
| **Offset** (`?page=3&limit=20`) | Simple, supports "jump to page" | Breaks when items are inserted/deleted (duplicates, skips) |
| **Cursor** (`?after=abc123&limit=20`) | Stable with real-time inserts/deletes | Can't jump to arbitrary page |

For feeds with real-time updates, always use cursor-based pagination.

**Virtualized list (for 10K+ items):**

```html
<!-- Angular CDK Virtual Scrolling -->
<cdk-virtual-scroll-viewport itemSize="80" class="feed-viewport">
  <div *cdkVirtualFor="let item of items; trackBy: trackById" class="feed-item">
    {{ item.title }}
  </div>
</cdk-virtual-scroll-viewport>
```

```typescript
// Component
@Component({
  standalone: true,
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="80" class="feed-viewport">
      <div *cdkVirtualFor="let item of items(); trackBy: trackById" class="feed-item">
        {{ item.title }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`.feed-viewport { height: 600px; }`]
})
export class FeedComponent {
  items = signal<FeedItem[]>([]);
  trackById = (_: number, item: FeedItem) => item.id;
}
// CDK virtual scroll only renders ~20 items instead of 10,000
```

**Memory management:**
- Unload images for off-screen items (set `src` to empty, restore on scroll back)
- Limit DOM nodes — virtualization keeps only ~30 nodes regardless of list size
- Use `content-visibility: auto` for non-virtualized long lists

**Scroll restoration:**
- Save scroll position before navigation: `sessionStorage.setItem('feedScroll', scrollTop)`
- Restore on back navigation
- For cursor-based pagination, also save the cursor and loaded items

**Edge cases:**
- Empty state (no results)
- Error state (API failure mid-scroll — show retry button)
- Loading state (skeleton rows at bottom)
- Rapid scrolling (debounce load requests)
- Duplicate detection (dedupe by item ID)

---

## 3. Design a Real-Time Chat Application

**Why they ask:** Tests WebSocket knowledge, offline handling, optimistic UI, message delivery states, and multi-tab sync. Asked at Meta, Slack, OpenAI.

**Model Answer:**

**Architecture:**

```
┌──────────┐    WebSocket     ┌──────────────┐
│  Client  │◀───────────────▶│  WS Gateway  │
│  (Angular/│                  │  (load        │
│   Client) │                  │   balanced)   │
└──────────┘                  └──────┬───────┘
     │                               │
     │ IndexedDB                     │ Message Queue
     │ (offline store)               │ (Kafka/Redis)
     ▼                               ▼
┌──────────┐                  ┌──────────────┐
│  Local   │                  │  Chat Service│
│  Cache   │                  │  (persist)   │
└──────────┘                  └──────────────┘
```

**WebSocket connection management:**

```typescript
class ChatSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private messageQueue: Message[] = []; // Queue for offline messages

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.flushQueue(); // Send queued messages
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.reconnect(url);
    };
  }

  private reconnect(url: string) {
    // Exponential backoff with jitter
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    setTimeout(() => this.connect(url), delay);
  }

  send(message: Message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message); // Queue for later
    }
  }

  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.ws?.send(JSON.stringify(msg));
    }
  }
}
```

**Message delivery states (WhatsApp model):**

```
Sent (✓)      → message left client
Delivered (✓✓) → server confirmed receipt by recipient's device
Read (✓✓ blue) → recipient opened the conversation
```

**Optimistic UI:**
1. User sends message → immediately show in UI with "sending" state
2. Server acknowledges → update to "sent" (✓)
3. If server rejects → show error, offer retry

**Multi-tab sync:**
```typescript
// BroadcastChannel API — sync state across tabs
const channel = new BroadcastChannel('chat-sync');

// Tab A sends a message
channel.postMessage({ type: 'NEW_MESSAGE', payload: message });

// Tab B receives it
channel.onmessage = (event) => {
  if (event.data.type === 'NEW_MESSAGE') {
    addMessageToUI(event.data.payload);
  }
};
```

**Offline support:**
- Store messages in IndexedDB
- Queue outgoing messages when offline
- Sync when connection restores
- Show "offline" indicator in UI

---

## 4. Design a Notification System (Frontend)

**Why they ask:** Tests real-time updates, state management, multi-channel delivery, and UX patterns for non-intrusive notifications.

**Model Answer:**

**Notification types:**

| Type | Delivery | Persistence | Example |
|---|---|---|---|
| **Toast** | In-app, ephemeral | Disappears after 5s | "File saved" |
| **Banner** | In-app, persistent | Until dismissed | "New version available" |
| **Badge** | In-app, count | Until read | Unread count on bell icon |
| **Push** | OS-level | In notification center | "New message from Alice" |
| **Email/SMS** | External | Permanent | "Your order shipped" |

**Frontend architecture:**

```typescript
// Notification service — central hub
class NotificationService {
  private notifications = signal<Notification[]>([]);
  private unreadCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  // Receive from WebSocket/SSE
  addNotification(notification: Notification) {
    this.notifications.update(list => [notification, ...list]);

    // Show toast for high-priority
    if (notification.priority === 'high') {
      this.showToast(notification);
    }

    // Request OS push permission if not granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
      });
    }
  }

  markAsRead(id: string) {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead() {
    this.notifications.update(list =>
      list.map(n => ({ ...n, read: true }))
    );
  }
}
```

**Toast system with auto-dismiss and stacking:**

```typescript
class ToastManager {
  private toasts = signal<Toast[]>([]);
  private maxVisible = 3;

  show(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    this.toasts.update(list => [...list, { ...toast, id }].slice(-this.maxVisible));

    // Auto-dismiss after duration
    if (toast.duration !== Infinity) {
      setTimeout(() => this.dismiss(id), toast.duration ?? 5000);
    }
  }

  dismiss(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
```

**Real-time delivery via SSE (simpler than WebSocket for one-way):**

```typescript
// Server-Sent Events — server pushes notifications to client
const eventSource = new EventSource('/api/notifications/stream');

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  notificationService.addNotification(notification);
};

eventSource.onerror = () => {
  // Auto-reconnects by default with SSE
  console.log('SSE connection lost, reconnecting...');
};
```

**Rate limiting on the frontend:**
- Don't show more than 3 toasts simultaneously
- Batch rapid notifications (e.g., "5 new messages" instead of 5 separate toasts)
- Respect user preferences (mute, do-not-disturb hours)

---

## 5. Design a Collaborative Editor (Google Docs)

**Why they ask:** Tests understanding of real-time sync, conflict resolution, and complex state management. Asked at Google, Notion, Figma.

**Model Answer:**

**The core problem:** Multiple users editing the same document simultaneously. Edits must converge to the same state regardless of network latency or ordering.

**Two approaches:**

| Approach | How it works | Used by |
|---|---|---|
| **OT (Operational Transformation)** | Transform operations against concurrent operations | Google Docs |
| **CRDT (Conflict-free Replicated Data Types)** | Data structure that merges automatically without conflicts | Figma, Notion, Yjs |

**CRDT approach (modern, recommended):**

```typescript
// Using Yjs — most popular CRDT library for frontend
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Create shared document
const ydoc = new Y.Doc();
const ytext = ydoc.getText('document');

// Connect to sync server
const provider = new WebsocketProvider('wss://sync.example.com', 'doc-123', ydoc);

// Bind to editor (e.g., ProseMirror, TipTap, Monaco)
// Changes automatically sync to all connected clients

// Listen for remote changes
ytext.observe(event => {
  // Update UI with remote edits
  console.log('Remote edit:', event.changes);
});

// Local edit — automatically propagated
ytext.insert(0, 'Hello ');
```

**Cursor presence (show other users' cursors):**

```typescript
// Awareness protocol — share cursor positions
const awareness = provider.awareness;

// Set local cursor position
awareness.setLocalStateField('cursor', {
  anchor: { index: 42 },
  head: { index: 42 },
  user: { name: 'Alice', color: '#ff0000' }
});

// Listen for remote cursors
awareness.on('change', () => {
  const states = awareness.getStates();
  states.forEach((state, clientId) => {
    if (clientId !== ydoc.clientID) {
      renderRemoteCursor(state.cursor);
    }
  });
});
```

**Offline support:**
- CRDT operations are stored locally in IndexedDB
- When reconnected, local and remote states merge automatically (CRDTs guarantee convergence)
- No conflict resolution needed — that's the whole point of CRDTs

**Architecture:**
```
Client A ──┐                    ┌── Client B
            │    WebSocket      │
            ▼                   ▼
         ┌─────────────────────────┐
         │     Sync Server         │
         │  (y-websocket / Hocuspocus) │
         └────────┬────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Persistence    │
         │  (PostgreSQL /  │
         │   Redis)        │
         └─────────────────┘
```

---

## 6. AI/LLM Integration in Frontend Applications

**Why they ask:** The hottest topic in 2025-2026. Every company is building AI features. Architects must know how to stream LLM responses, build chat UIs, and handle AI-specific UX patterns.

**Model Answer:**

**Streaming LLM responses (token-by-token rendering):**

```typescript
// Server-Sent Events for streaming AI responses
async function streamCompletion(prompt: string, onToken: (token: string) => void) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Parse SSE format: "data: {\"token\": \"Hello\"}\n\n"
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
    for (const line of lines) {
      const data = JSON.parse(line.slice(6));
      onToken(data.token);
    }
  }
}

// Usage — append tokens to UI as they arrive
let fullResponse = '';
await streamCompletion('Explain closures', (token) => {
  fullResponse += token;
  updateUI(fullResponse); // Re-render with each token
});
```

**Chat UI architecture:**

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'sending' | 'streaming' | 'complete' | 'error';
  timestamp: number;
}

// State management for chat
class ChatStore {
  messages = signal<ChatMessage[]>([]);
  isStreaming = signal(false);

  async sendMessage(content: string) {
    // Add user message immediately
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      status: 'complete',
      timestamp: Date.now(),
    };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Add placeholder for assistant response
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      status: 'streaming',
      timestamp: Date.now(),
    };
    this.messages.update(msgs => [...msgs, assistantMsg]);
    this.isStreaming.set(true);

    // Stream response
    await streamCompletion(content, (token) => {
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantMsg.id
          ? { ...m, content: m.content + token }
          : m
        )
      );
    });

    // Mark complete
    this.messages.update(msgs =>
      msgs.map(m => m.id === assistantMsg.id
        ? { ...m, status: 'complete' }
        : m
      )
    );
    this.isStreaming.set(false);
  }
}
```

**AI-specific UX patterns:**
- Typing indicator / streaming animation while tokens arrive
- "Stop generating" button (AbortController to cancel the stream)
- Markdown rendering for AI responses (code blocks, lists, tables)
- Copy code button on code blocks
- Regenerate response button
- Token count / context window indicator
- Rate limiting feedback ("You've reached your limit, try again in 60s")

**Performance considerations:**
- Virtualize long chat histories (don't render 1000 messages)
- Debounce markdown re-parsing during streaming (parse every 100ms, not every token)
- Use `requestAnimationFrame` for smooth token-by-token rendering
- Lazy-load syntax highlighting for code blocks

---

## 7. Feature Flags & A/B Testing Architecture

**Why they ask:** Architects must decouple deployment from release. Feature flags are how modern teams ship safely and run experiments.

**Model Answer:**

**Feature flag evaluation — client-side vs server-side:**

| Approach | Pros | Cons |
|---|---|---|
| **Client-side** (LaunchDarkly, Unleash) | Fast evaluation, no server round-trip | Flags visible in JS bundle, flash of wrong content |
| **Server-side** (evaluated at API/SSR layer) | Secure, no flash | Requires server round-trip or SSR |
| **Edge** (evaluated at CDN) | Fast + secure | More complex infrastructure |

**Implementation pattern:**

```typescript
// Feature flag service
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private flags = signal<Record<string, boolean | string>>({});

  async initialize(userId: string) {
    // Fetch flags for this user from flag service
    const response = await fetch(`/api/flags?userId=${userId}`);
    const flags = await response.json();
    this.flags.set(flags);
  }

  isEnabled(flagName: string): boolean {
    return this.flags()[flagName] === true;
  }

  getVariant(flagName: string): string {
    return this.flags()[flagName] as string ?? 'control';
  }
}

// Usage in component
@Component({
  template: `
    @if (flags.isEnabled('new-checkout-flow')) {
      <app-new-checkout />
    } @else {
      <app-legacy-checkout />
    }
  `
})
export class CheckoutPage {
  flags = inject(FeatureFlagService);
}
```

**A/B testing architecture:**

```typescript
// Experiment tracking
interface Experiment {
  name: string;
  variant: 'control' | 'treatment-a' | 'treatment-b';
  userId: string;
}

class ExperimentService {
  private analytics = inject(AnalyticsService);

  trackExposure(experiment: Experiment) {
    this.analytics.track('experiment_exposure', {
      experiment: experiment.name,
      variant: experiment.variant,
      userId: experiment.userId,
    });
  }

  trackConversion(experimentName: string, metric: string) {
    this.analytics.track('experiment_conversion', {
      experiment: experimentName,
      metric, // e.g., 'checkout_completed', 'signup_clicked'
    });
  }
}
```

**Best practices:**
- Feature flags should have an expiration date — clean up after rollout
- Use a kill switch for every major feature (instant rollback without deploy)
- Separate operational flags (kill switches) from experiment flags (A/B tests)
- Never nest feature flags (flag A inside flag B) — combinatorial explosion
- Log flag evaluations for debugging ("why did user X see variant B?")
- Gradual rollout: 1% → 5% → 25% → 50% → 100%

**Tools:** LaunchDarkly, Unleash (open source), Statsig, Flagsmith, GrowthBook.

---

## 8. Offline-First / PWA Architecture

**Why they ask:** Tests understanding of Service Workers, caching strategies, and building resilient apps that work without network.

**Model Answer:**

**Service Worker lifecycle:**
```
Install → Activate → Fetch (intercept requests)
```

**Caching strategies:**

| Strategy | How it works | Best for |
|---|---|---|
| **Cache First** | Check cache, fallback to network | Static assets (JS, CSS, images) |
| **Network First** | Try network, fallback to cache | API data that should be fresh |
| **Stale While Revalidate** | Return cache immediately, update cache from network in background | Frequently updated content |
| **Network Only** | Always fetch from network | Real-time data, auth endpoints |
| **Cache Only** | Only serve from cache | App shell, offline page |

**Implementation with Workbox (Google's Service Worker toolkit):**

```javascript
// service-worker.js using Workbox
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache app shell (built files)
precacheAndRoute(self.__WB_MANIFEST);

// Cache images — cache first, expire after 30 days
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
);

// API calls — network first, fallback to cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 })],
  })
);
```

**IndexedDB for offline data:**

```typescript
// Store data locally for offline access
class OfflineStore {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open('app-offline', 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore('pending-actions', { keyPath: 'id' });
        db.createObjectStore('cached-data', { keyPath: 'key' });
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  // Queue actions when offline, sync when back online
  async queueAction(action: { type: string; payload: any }) {
    const tx = this.db!.transaction('pending-actions', 'readwrite');
    tx.objectStore('pending-actions').add({
      id: crypto.randomUUID(),
      ...action,
      timestamp: Date.now(),
    });
  }

  async syncPendingActions() {
    const tx = this.db!.transaction('pending-actions', 'readonly');
    const actions = await this.getAllFromStore(tx.objectStore('pending-actions'));

    for (const action of actions) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(action),
        });
        // Remove from queue after successful sync
        const deleteTx = this.db!.transaction('pending-actions', 'readwrite');
        deleteTx.objectStore('pending-actions').delete(action.id);
      } catch {
        break; // Stop syncing if network fails again
      }
    }
  }
}

// Sync when back online
window.addEventListener('online', () => offlineStore.syncPendingActions());
```

**Background Sync API:**
```javascript
// In service worker — retry failed requests when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});
```

**PWA installability checklist:**
- `manifest.json` with name, icons, start_url, display: standalone
- Service worker registered
- Served over HTTPS
- Responsive design

---

## 9. WebSocket & Real-Time Architecture

**Why they ask:** Tests understanding of when to use WebSocket vs SSE vs polling, connection management, and scaling real-time features.

**Model Answer:**

**Comparison:**

| Protocol | Direction | Reconnect | Best for |
|---|---|---|---|
| **WebSocket** | Bidirectional | Manual | Chat, gaming, collaborative editing |
| **SSE (Server-Sent Events)** | Server → Client only | Automatic | Notifications, live feeds, stock prices |
| **Long Polling** | Request-response | Per request | Legacy fallback, simple updates |
| **HTTP/2 Push** | Server → Client | N/A | Preloading resources (deprecated in most browsers) |

**When to use what:**
- Need bidirectional communication? → WebSocket
- Server pushes updates, client only listens? → SSE (simpler, auto-reconnect, works through proxies)
- Need to support very old browsers? → Long polling
- Real-time + offline support? → WebSocket + IndexedDB queue

**SSE implementation (often overlooked, simpler than WebSocket):**

```typescript
// Client — auto-reconnects on failure
const eventSource = new EventSource('/api/events');

eventSource.addEventListener('price-update', (event) => {
  const data = JSON.parse(event.data);
  updateStockPrice(data.symbol, data.price);
});

eventSource.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data);
  showNotification(data);
});

eventSource.onerror = () => {
  console.log('Connection lost, auto-reconnecting...');
  // SSE auto-reconnects — no manual logic needed
};
```

**WebSocket connection management patterns:**

```typescript
class ReliableWebSocket {
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // Heartbeat to detect dead connections
      this.heartbeatInterval = setInterval(() => {
        this.ws?.send(JSON.stringify({ type: 'ping' }));
      }, 30000);
    };

    this.ws.onclose = (event) => {
      clearInterval(this.heartbeatInterval!);
      if (!event.wasClean) {
        this.reconnectWithBackoff(url);
      }
    };
  }

  private reconnectWithBackoff(url: string, attempt = 0) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    const jitter = Math.random() * 1000;
    setTimeout(() => this.connect(url), delay + jitter);
  }
}
```

**Scaling WebSocket connections:**
- Use a message broker (Redis Pub/Sub, Kafka) to fan out messages across multiple WS server instances
- Sticky sessions or connection-aware load balancing
- Connection limits per user (prevent resource exhaustion)
- Graceful degradation — fall back to SSE or polling if WebSocket fails

---

## 10. Frontend Data Structures & Algorithms

**Why they ask:** Machine coding rounds test implementation skills. Architects should know when and why to use specific data structures.

**Model Answer:**

**Debounce & Throttle (most asked):**

```typescript
// Debounce — wait until user stops typing
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Throttle — execute at most once per interval
function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}
```

**Trie for autocomplete:**

```typescript
class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
  frequency = 0;
}

class Trie {
  root = new TrieNode();

  insert(word: string, frequency = 1) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEnd = true;
    node.frequency += frequency;
  }

  search(prefix: string): string[] {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }
    // DFS to collect all words with this prefix
    const results: { word: string; freq: number }[] = [];
    this.dfs(node, prefix, results);
    return results
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 10)
      .map(r => r.word);
  }

  private dfs(node: TrieNode, prefix: string, results: { word: string; freq: number }[]) {
    if (node.isEnd) results.push({ word: prefix, freq: node.frequency });
    for (const [char, child] of node.children) {
      this.dfs(child, prefix + char, results);
    }
  }
}
```

**Event Delegation (DOM performance):**

```typescript
// Instead of attaching 1000 click handlers to 1000 list items:
// Attach ONE handler to the parent
document.getElementById('list')!.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest('[data-item-id]');
  if (target) {
    const itemId = target.getAttribute('data-item-id');
    handleItemClick(itemId!);
  }
});
```

**Other structures to know:**
- **Map/Set** — O(1) lookup, better than object for dynamic keys
- **WeakMap/WeakRef** — for caches that don't prevent garbage collection
- **Priority Queue** — for notification ordering, task scheduling
- **Circular Buffer** — for fixed-size log buffers, undo history

---

## 11. Build Tools & Module Systems Deep Dive

**Why they ask:** Architects choose and configure build tooling. Understanding bundler internals helps debug performance issues and make informed tool choices.

**Model Answer:**

**Build tool comparison (2025-2026):**

| Tool | Language | Speed | Use case |
|---|---|---|---|
| **Vite** | Go (esbuild) + Rust (Rollup 4) | Very fast | Default for new projects, dev server + production build |
| **esbuild** | Go | Fastest | Library bundling, simple apps |
| **Webpack** | JavaScript | Slow | Legacy, Module Federation |
| **Turbopack** | Rust | Fast | Next.js (still maturing) |
| **Rspack** | Rust | Fast | Webpack-compatible drop-in replacement |
| **Angular CLI (esbuild)** | Go | Fast | Angular 17+ default builder |

**Why Vite won:**
- Dev server uses native ES modules — no bundling during development
- HMR (Hot Module Replacement) is near-instant regardless of app size
- Production build uses Rollup (optimized, tree-shaken output)
- Plugin ecosystem compatible with Rollup plugins

**ES Modules vs CommonJS:**

```javascript
// ESM — static imports, tree-shakeable
import { debounce } from './utils.js'; // Bundler knows at build time what's used

// CommonJS — dynamic, NOT tree-shakeable
const { debounce } = require('./utils'); // Bundler can't statically analyze
```

Tree shaking only works with ESM because imports are statically analyzable. This is why modern libraries ship ESM builds.

**Code splitting strategies:**

```typescript
// 1. Route-based splitting (most common)
const routes = [
  { path: '/dashboard', loadComponent: () => import('./dashboard.component') },
  { path: '/settings', loadComponent: () => import('./settings.component') },
];

// 2. Component-level splitting (Angular @defer)
// In template:
// @defer (on viewport) {
//   <app-heavy-chart [data]="chartData()" />
// } @placeholder {
//   <div class="chart-skeleton"></div>
// }

// 3. Library splitting — separate vendor chunk
// angular.json or custom webpack config
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['@angular/core', '@angular/common'],
        charts: ['d3', 'ngx-charts'],
      }
    }
  }
}
```

**Bundle analysis:**
- `npx vite-bundle-visualizer` — treemap of what's in your bundle
- `webpack-bundle-analyzer` — for webpack projects
- `source-map-explorer` — works with any bundler's source maps
- Set size budgets in CI — fail build if bundle exceeds threshold

---

## 12. Error Boundaries & Resilience Patterns

**Why they ask:** Production apps must handle failures gracefully. Architects design for resilience, not just the happy path.

**Model Answer:**

**Layers of resilience:**

```
┌─────────────────────────────────────────┐
│  Global Error Boundary (catch-all)      │
│  ┌───────────────────────────────────┐  │
│  │  Feature Error Boundary           │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Component Error Boundary   │  │  │
│  │  │  (widget-level isolation)   │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Circuit breaker pattern for flaky APIs:**

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,      // Open after 5 failures
    private resetTimeout: number = 30000 // Try again after 30s
  ) {}

  async execute<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open'; // Try one request
      } else {
        return fallback; // Return cached/fallback data
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return fallback;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Usage
const apiBreaker = new CircuitBreaker(3, 15000);
const users = await apiBreaker.execute(
  () => fetch('/api/users').then(r => r.json()),
  cachedUsers // Fallback to cached data
);
```

**Retry with exponential backoff:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
```

**Graceful degradation patterns:**
- Non-critical widget fails → show placeholder, don't crash the page
- API timeout → show cached data with "last updated X minutes ago"
- Image fails to load → show fallback placeholder
- Third-party script fails (analytics, chat widget) → silently ignore
- WebSocket disconnects → fall back to polling

---

## 13. Web Workers & Multithreading

**Why they ask:** Tests understanding of main thread performance and when to offload work. Critical for CPU-intensive frontend tasks.

**Model Answer:**

**When to use Web Workers:**
- Parsing large JSON/CSV files
- Image processing (filters, resizing)
- Complex calculations (sorting 100K+ items, search indexing)
- Markdown/syntax highlighting for large documents
- Encryption/hashing

**Dedicated Worker:**

```typescript
// worker.ts
self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SORT_LARGE_DATASET': {
      const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
      self.postMessage({ type: 'SORT_COMPLETE', data: sorted });
      break;
    }
    case 'PARSE_CSV': {
      const rows = parseCSV(data); // CPU-intensive parsing
      self.postMessage({ type: 'PARSE_COMPLETE', data: rows });
      break;
    }
  }
};

// main.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

worker.postMessage({ type: 'SORT_LARGE_DATASET', data: hugeArray });

worker.onmessage = (event) => {
  if (event.data.type === 'SORT_COMPLETE') {
    updateUI(event.data.data);
  }
};
```

**Comlink — ergonomic Worker API:**

```typescript
// worker.ts
import { expose } from 'comlink';

const api = {
  async processImage(imageData: ImageData): Promise<ImageData> {
    // Heavy image processing
    return applyFilter(imageData);
  },

  async searchIndex(query: string): Promise<SearchResult[]> {
    // Full-text search on large dataset
    return index.search(query);
  }
};

expose(api);

// main.ts
import { wrap } from 'comlink';

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const api = wrap<typeof import('./worker').api>(worker);

// Use like a normal async function — Comlink handles serialization
const results = await api.searchIndex('angular signals');
```

**Transferable objects (zero-copy transfer):**

```typescript
// Instead of copying large ArrayBuffers, transfer ownership
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
worker.postMessage({ type: 'PROCESS', buffer }, [buffer]);
// buffer is now empty in main thread — ownership transferred to worker
// No copy overhead!
```

**SharedWorker (shared across tabs):**

```typescript
// Shared across all tabs of the same origin
const shared = new SharedWorker('shared-worker.js');
shared.port.postMessage({ type: 'SUBSCRIBE', channel: 'notifications' });
shared.port.onmessage = (event) => {
  // All tabs receive the same data — single WebSocket connection
};
```

---

## 14. Frontend Caching Strategies Deep Dive

**Why they ask:** Caching is the #1 performance lever. Architects must understand the full caching stack from browser to CDN.

**Model Answer:**

**The caching stack (from closest to user to farthest):**

```
Browser Memory Cache (fastest, per-tab, lost on close)
    ↓
Browser Disk Cache (HTTP cache, persists across sessions)
    ↓
Service Worker Cache (programmable, offline support)
    ↓
CDN Edge Cache (geographic distribution)
    ↓
Origin Server Cache (Redis, Varnish)
    ↓
Database
```

**HTTP caching headers:**

```
# Immutable assets (JS/CSS with content hash in filename)
Cache-Control: public, max-age=31536000, immutable
# main.a1b2c3.js — cached for 1 year, never revalidated

# HTML pages (always revalidate)
Cache-Control: no-cache
ETag: "abc123"
# Browser always checks with server, serves cached if ETag matches (304)

# API responses (fresh for 60s, serve stale while revalidating)
Cache-Control: public, max-age=60, stale-while-revalidate=300
# Serve cached for 60s, then serve stale for up to 5 min while fetching fresh
```

**In-memory caching (application level):**

```typescript
// Simple TTL cache
class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V, ttlMs: number) {
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }
}

// Usage in API service
const userCache = new TTLCache<string, User>();

async function getUser(id: string): Promise<User> {
  const cached = userCache.get(id);
  if (cached) return cached;

  const user = await fetch(`/api/users/${id}`).then(r => r.json());
  userCache.set(id, user, 5 * 60 * 1000); // Cache for 5 minutes
  return user;
}
```

**Stale-while-revalidate pattern (application level):**

```typescript
async function fetchWithSWR<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);

  // Return stale data immediately
  if (cached) {
    // Revalidate in background
    fetcher().then(fresh => cache.set(key, fresh));
    return cached;
  }

  // No cache — fetch and cache
  const data = await fetcher();
  cache.set(key, data);
  return data;
}
```

**Cache invalidation strategies:**
- **Time-based** — TTL expiry (simplest)
- **Event-based** — invalidate on mutation (POST/PUT/DELETE invalidates related GET cache)
- **Version-based** — content hash in filename (immutable caching)
- **Tag-based** — tag cache entries, invalidate all entries with a tag

---

## 15. Event-Driven Architecture on the Frontend

**Why they ask:** Tests understanding of decoupled communication patterns, undo/redo, and scalable component interaction.

**Model Answer:**

**Event bus pattern (decoupled communication):**

```typescript
// Type-safe event bus
type EventMap = {
  'user:login': { userId: string; name: string };
  'user:logout': void;
  'cart:updated': { itemCount: number };
  'notification:new': { message: string; type: 'info' | 'error' };
};

class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.listeners.get(event)?.delete(handler);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.listeners.get(event)?.forEach(handler => handler(data));
  }
}

// Usage — components don't need to know about each other
const bus = new EventBus();

// Header component listens
bus.on('cart:updated', ({ itemCount }) => {
  updateCartBadge(itemCount);
});

// Cart component emits
bus.emit('cart:updated', { itemCount: 3 });
```

**Undo/Redo with Command Pattern:**

```typescript
interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

class UndoManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  execute(command: Command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }

  canUndo = () => this.undoStack.length > 0;
  canRedo = () => this.redoStack.length > 0;
}

// Example command
class ChangeColorCommand implements Command {
  private previousColor: string;
  description = 'Change color';

  constructor(private element: HTMLElement, private newColor: string) {
    this.previousColor = element.style.backgroundColor;
  }

  execute() { this.element.style.backgroundColor = this.newColor; }
  undo() { this.element.style.backgroundColor = this.previousColor; }
}
```

**When to use event-driven patterns:**
- Cross-feature communication without direct imports
- Micro-frontend communication (shell ↔ remote apps)
- Plugin/extension systems
- Undo/redo functionality
- Analytics tracking (emit events, analytics service listens)

**When NOT to use:**
- Parent-child communication (use props/inputs instead)
- Simple state updates (use signals/state management)
- When you need guaranteed delivery order (events are fire-and-forget)

---

## 16. Frontend Logging & Debugging at Scale

**Why they ask:** Production debugging is an architect responsibility. Structured logging and observability separate senior engineers from juniors.

**Model Answer:**

**Structured logging:**

```typescript
// Logger service with context
class Logger {
  private context: Record<string, any> = {};

  setContext(ctx: Record<string, any>) {
    this.context = { ...this.context, ...ctx };
  }

  info(message: string, data?: Record<string, any>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, any>) {
    this.log('error', message, {
      ...data,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
    });
  }

  private log(level: string, message: string, data?: Record<string, any>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // In development — pretty print
    if (isDev) {
      console[level as 'info' | 'warn' | 'error'](message, entry);
    }

    // In production — send to logging service
    if (isProd && level !== 'debug') {
      this.sendToService(entry);
    }
  }

  private sendToService(entry: any) {
    // Batch logs and send periodically (not on every log call)
    logBuffer.push(entry);
    if (logBuffer.length >= 10) {
      navigator.sendBeacon('/api/logs', JSON.stringify(logBuffer));
      logBuffer.length = 0;
    }
  }
}

// Usage
const logger = new Logger();
logger.setContext({ userId: 'abc123', sessionId: 'xyz789', appVersion: '2.1.0' });

logger.info('Page loaded', { route: '/dashboard', loadTime: 1234 });
logger.error('API call failed', error, { endpoint: '/api/users', statusCode: 500 });
```

**Correlation IDs for request tracing:**

```typescript
// Generate a correlation ID per user session
const correlationId = crypto.randomUUID();

// Attach to every API request
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  req = req.clone({
    setHeaders: { 'X-Correlation-ID': correlationId }
  });

  const start = Date.now();
  return next(req).pipe(
    tap({
      next: () => logger.info('API success', {
        method: req.method,
        url: req.url,
        duration: Date.now() - start,
        correlationId,
      }),
      error: (err) => logger.error('API failure', err, {
        method: req.method,
        url: req.url,
        duration: Date.now() - start,
        correlationId,
      }),
    })
  );
};
```

**Source maps in production:**
- Upload source maps to Sentry/Datadog during CI build
- Do NOT serve source maps publicly (security risk — exposes source code)
- Stack traces in error reports automatically map to original source

**Performance logging:**

```typescript
// Log Core Web Vitals
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP((metric) => logger.info('LCP', { value: metric.value, rating: metric.rating }));
onINP((metric) => logger.info('INP', { value: metric.value, rating: metric.rating }));
onCLS((metric) => logger.info('CLS', { value: metric.value, rating: metric.rating }));
```

**Best practices:**
- Use `navigator.sendBeacon()` for logging — guaranteed delivery even on page unload
- Batch logs (send every 10 entries or every 5 seconds, whichever comes first)
- Include session ID, user ID, app version, and route in every log entry
- Log levels: debug (dev only), info (user actions), warn (recoverable issues), error (failures)
- Never log PII (passwords, tokens, emails) — sanitize before sending
- Set up alerts on error rate spikes, not individual errors

---

## Quick Reference — Topics by Category

| Category | Questions |
|---|---|
| **Frontend System Design** | 1, 2, 3, 4, 5 |
| **Trending / AI** | 6, 7, 8 |
| **Real-Time Architecture** | 3, 4, 9 |
| **Data Structures & Algorithms** | 10 |
| **Build Tools & Bundling** | 11 |
| **Resilience & Error Handling** | 12 |
| **Performance & Multithreading** | 13, 14 |
| **Architecture Patterns** | 15 |
| **Observability & Debugging** | 16 |

---

*These 16 topics fill the gaps left by standard interview prep guides. Frontend system design questions (1-5) are the most heavily weighted at FAANG/top companies. AI integration (6) and feature flags (7) are the hottest trending topics in 2025-2026.*