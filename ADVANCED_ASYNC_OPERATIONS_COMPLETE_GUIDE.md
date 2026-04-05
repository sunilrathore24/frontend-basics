# Advanced Async Operations - Complete Guide
## Web Workers, WebSockets, Caching, SSR, and Data Change Algorithms

*Comprehensive guide covering advanced async patterns in both Angular and Vanilla JavaScript*

---

## Table of Contents
1. [Web Workers](#web-workers)
2. [WebSockets](#websockets)
3. [Caching Strategies](#caching-strategies)
4. [IndexedDB](#indexeddb)
5. [Service Workers & PWA](#service-workers--pwa)
6. [Data Change Detection Algorithms](#data-change-detection-algorithms)
7. [Real-Time Data Synchronization](#real-time-data-synchronization)
8. [Performance Optimization Patterns](#performance-optimization-patterns)

---

## 1. Web Workers

### What Are Web Workers?

Web Workers allow you to run JavaScript in background threads, separate from the main UI thread. This prevents heavy computations from blocking the user interface.

**Key Benefits:**
- True parallel execution (separate thread)
- Non-blocking UI
- CPU-intensive tasks don't freeze the page
- Improved responsiveness

**Limitations:**
- No DOM access
- No access to window object
- Communication via message passing only
- Cannot share memory directly

### Vanilla JavaScript Web Workers

**Creating a Web Worker:**

```javascript
// main.js - Main thread
class WorkerManager {
  constructor() {
    // Create worker from separate file
    this.worker = new Worker('worker.js');
    
    // Listen for messages from worker
    this.worker.onmessage = (event) => {
      console.log('Result from worker:', event.data);
      this.handleWorkerResult(event.data);
    };
    
    // Handle errors
    this.worker.onerror = (error) => {
      console.error('Worker error:', error.message);
    };
  }
  
  // Send data to worker
  processData(data) {
    this.worker.postMessage({
      type: 'PROCESS',
      payload: data
    });
  }
  
  handleWorkerResult(result) {
    // Update UI with result
    document.getElementById('result').textContent = result;
  }
  
  // Clean up
  terminate() {
    this.worker.terminate();
  }
}

// Usage
const manager = new WorkerManager();
manager.processData({ numbers: [1, 2, 3, 4, 5] });
```

**Worker File:**

```javascript
// worker.js - Worker thread
// This runs in a separate thread

// Listen for messages from main thread
self.onmessage = function(event) {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'PROCESS':
      const result = processHeavyComputation(payload);
      // Send result back to main thread
      self.postMessage(result);
      break;
      
    case 'CANCEL':
      // Handle cancellation
      self.close(); // Terminate worker from inside
      break;
  }
};

function processHeavyComputation(data) {
  // Expensive operation that would block UI
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

// Worker can also import scripts
importScripts('utils.js', 'math-lib.js');
```

### Real-World Example: Image Processing

```javascript
// main.js
class ImageProcessor {
  constructor() {
    this.worker = new Worker('image-worker.js');
    this.setupWorker();
  }
  
  setupWorker() {
    this.worker.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'PROGRESS':
          this.updateProgress(data.percent);
          break;
        case 'COMPLETE':
          this.displayProcessedImage(data.imageData);
          break;
        case 'ERROR':
          this.handleError(data.error);
          break;
      }
    };
  }
  
  processImage(imageData, filters) {
    this.worker.postMessage({
      type: 'PROCESS_IMAGE',
      imageData: imageData,
      filters: filters
    }, [imageData.data.buffer]); // Transfer ownership for performance
  }
  
  updateProgress(percent) {
    document.getElementById('progress').style.width = `${percent}%`;
  }
  
  displayProcessedImage(imageData) {
    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
  }
}

// image-worker.js
self.onmessage = function(event) {
  const { type, imageData, filters } = event.data;
  
  if (type === 'PROCESS_IMAGE') {
    const pixels = imageData.data;
    const totalPixels = pixels.length / 4;
    
    // Apply filters
    for (let i = 0; i < pixels.length; i += 4) {
      // Apply grayscale
      if (filters.grayscale) {
        const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = avg;
      }
      
      // Apply brightness
      if (filters.brightness) {
        pixels[i] += filters.brightness;
        pixels[i + 1] += filters.brightness;
        pixels[i + 2] += filters.brightness;
      }
      
      // Report progress every 10%
      if (i % (totalPixels * 0.1) === 0) {
        self.postMessage({
          type: 'PROGRESS',
          data: { percent: (i / pixels.length) * 100 }
        });
      }
    }
    
    // Send processed image back
    self.postMessage({
      type: 'COMPLETE',
      data: { imageData }
    }, [imageData.data.buffer]);
  }
};
```

### Angular Web Workers

**Setting up Web Workers in Angular:**

```typescript
// Generate worker
// ng generate web-worker app/workers/data-processor

// data-processor.worker.ts
/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { type, payload } = data;
  
  switch (type) {
    case 'PROCESS_DATA':
      const result = processLargeDataset(payload);
      postMessage({ type: 'RESULT', data: result });
      break;
      
    case 'CALCULATE':
      const calculation = performCalculation(payload);
      postMessage({ type: 'CALCULATION_RESULT', data: calculation });
      break;
  }
});

function processLargeDataset(data: any[]): any[] {
  // Heavy processing
  return data.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));
}

function performCalculation(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + Math.sqrt(num), 0);
}
```

**Using Worker in Angular Component:**

```typescript
// data-processor.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataProcessorService {
  private worker: Worker;
  private results$ = new Subject<any>();
  
  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./workers/data-processor.worker', import.meta.url)
      );
      
      this.worker.onmessage = ({ data }) => {
        this.results$.next(data);
      };
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.results$.error(error);
      };
    } else {
      console.warn('Web Workers not supported');
    }
  }
  
  processData(data: any[]): Observable<any> {
    return new Observable(observer => {
      const subscription = this.results$.subscribe({
        next: (result) => {
          if (result.type === 'RESULT') {
            observer.next(result.data);
            observer.complete();
          }
        },
        error: (err) => observer.error(err)
      });
      
      this.worker.postMessage({
        type: 'PROCESS_DATA',
        payload: data
      });
      
      return () => subscription.unsubscribe();
    });
  }
  
  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

// component.ts
@Component({
  selector: 'app-data-processor',
  template: `
    <button (click)="processLargeDataset()">Process Data</button>
    <div *ngIf="processing">Processing...</div>
    <div *ngIf="result">
      Processed {{ result.length }} items
    </div>
  `
})
export class DataProcessorComponent {
  processing = false;
  result: any[] = [];
  
  constructor(private processor: DataProcessorService) {}
  
  processLargeDataset() {
    this.processing = true;
    const largeDataset = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      value: Math.random()
    }));
    
    this.processor.processData(largeDataset).subscribe({
      next: (result) => {
        this.result = result;
        this.processing = false;
      },
      error: (error) => {
        console.error('Processing failed:', error);
        this.processing = false;
      }
    });
  }
}
```

### Shared Workers

Shared Workers can be accessed by multiple scripts, even from different windows/tabs.

```javascript
// shared-worker.js
const connections = [];

self.onconnect = function(event) {
  const port = event.ports[0];
  connections.push(port);
  
  port.onmessage = function(e) {
    // Broadcast to all connections
    connections.forEach(conn => {
      if (conn !== port) {
        conn.postMessage(e.data);
      }
    });
  };
  
  port.start();
};

// main.js
const worker = new SharedWorker('shared-worker.js');

worker.port.onmessage = function(event) {
  console.log('Message from shared worker:', event.data);
};

worker.port.postMessage('Hello from tab 1');
```

### Best Practices for Web Workers

1. **Use for CPU-intensive tasks only**
```javascript
// ✅ Good use cases:
// - Image/video processing
// - Large dataset manipulation
// - Complex calculations
// - Encryption/decryption
// - Data parsing (CSV, JSON)

// ❌ Bad use cases:
// - Simple DOM manipulation
// - Small calculations
// - API calls (use main thread)
```

2. **Transfer ownership for large data**
```javascript
// ❌ Bad: Copies data (slow for large arrays)
worker.postMessage(largeArray);

// ✅ Good: Transfers ownership (fast, zero-copy)
worker.postMessage(largeArray, [largeArray.buffer]);
```

3. **Handle errors gracefully**
```javascript
worker.onerror = (error) => {
  console.error('Worker error:', {
    message: error.message,
    filename: error.filename,
    lineno: error.lineno
  });
  
  // Fallback to main thread
  processDataOnMainThread();
};
```

4. **Clean up workers**
```typescript
@Component({})
export class MyComponent implements OnDestroy {
  private worker: Worker;
  
  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
```

---

## 2. WebSockets

### What Are WebSockets?

WebSockets provide full-duplex communication channels over a single TCP connection, enabling real-time, bidirectional communication between client and server.

**Key Benefits:**
- Real-time updates
- Lower latency than HTTP polling
- Reduced server load
- Persistent connection
- Bidirectional communication

**Use Cases:**
- Chat applications
- Live notifications
- Real-time dashboards
- Collaborative editing
- Live sports scores
- Stock tickers
- Multiplayer games

### Vanilla JavaScript WebSocket

**Basic WebSocket Implementation:**

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.onConnected();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError(error);
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.onDisconnected();
      this.attemptReconnect();
    };
  }
  
  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected');
    }
  }
  
  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
  }
  
  off(messageType, handler) {
    if (this.messageHandlers.has(messageType)) {
      const handlers = this.messageHandlers.get(messageType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  handleMessage(data) {
    const { type, payload } = data;
    
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in handler for ${type}:`, error);
        }
      });
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  // Override these methods
  onConnected() {}
  onDisconnected() {}
  onError(error) {}
}

// Usage
const ws = new WebSocketClient('wss://api.example.com/ws');

ws.on('message', (data) => {
  console.log('New message:', data);
  displayMessage(data);
});

ws.on('notification', (data) => {
  console.log('Notification:', data);
  showNotification(data);
});

// Send message
ws.send('chat', {
  text: 'Hello, World!',
  userId: '123'
});

// Clean up
window.addEventListener('beforeunload', () => {
  ws.close();
});
```

### Advanced WebSocket with Heartbeat

```javascript
class RobustWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,
      ...options
    };
    
    this.ws = null;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.isConnected = false;
    
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle heartbeat response
      if (data.type === 'pong') {
        this.handlePong();
        return;
      }
      
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      this.isConnected = false;
      this.stopHeartbeat();
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', {});
        
        // Set timeout for pong response
        this.heartbeatTimeoutTimer = setTimeout(() => {
          console.warn('Heartbeat timeout - closing connection');
          this.ws.close();
        }, this.options.heartbeatTimeout);
      }
    }, this.options.heartbeatInterval);
  }
  
  handlePong() {
    // Clear timeout - connection is alive
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }
  
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }
  
  send(type, payload) {
    const message = JSON.stringify({ type, payload });
    
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }
  
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.options.reconnectDelay * 
                    Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms`);
      setTimeout(() => this.connect(), delay);
    }
  }
  
  close() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

### Angular WebSocket Service

```typescript
// websocket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, timer, EMPTY } from 'rxjs';
import { 
  webSocket, 
  WebSocketSubject, 
  WebSocketSubjectConfig 
} from 'rxjs/webSocket';
import { 
  retryWhen, 
  tap, 
  delayWhen, 
  catchError,
  share
} from 'rxjs/operators';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket$: WebSocketSubject<WebSocketMessage> | null = null;
  private messagesSubject$ = new Subject<WebSocketMessage>();
  public messages$ = this.messagesSubject$.asObservable();
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  
  constructor() {}
  
  connect(url: string): Observable<WebSocketMessage> {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket(url);
      
      this.socket$.pipe(
        tap({
          error: error => console.error('WebSocket error:', error)
        }),
        retryWhen(errors =>
          errors.pipe(
            tap(err => {
              console.error('WebSocket error, retrying...', err);
              this.reconnectAttempts++;
            }),
            delayWhen(() => {
              const delay = this.reconnectInterval * 
                           Math.pow(2, this.reconnectAttempts - 1);
              return timer(Math.min(delay, 30000));
            })
          )
        ),
        catchError(error => {
          console.error('WebSocket connection failed:', error);
          return EMPTY;
        }),
        share()
      ).subscribe(
        message => this.messagesSubject$.next(message),
        error => console.error('WebSocket subscription error:', error)
      );
    }
    
    return this.messages$;
  }
  
  private getNewWebSocket(url: string): WebSocketSubject<WebSocketMessage> {
    const config: WebSocketSubjectConfig<WebSocketMessage> = {
      url,
      openObserver: {
        next: () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket disconnected');
          this.socket$ = null;
        }
      }
    };
    
    return webSocket<WebSocketMessage>(config);
  }
  
  send(message: WebSocketMessage): void {
    if (this.socket$) {
      this.socket$.next(message);
    } else {
      console.error('WebSocket not connected');
    }
  }
  
  close(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
  
  ngOnDestroy(): void {
    this.close();
  }
}

// chat.component.ts
@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-container">
      <div class="messages">
        <div *ngFor="let msg of messages" class="message">
          <strong>{{ msg.user }}:</strong> {{ msg.text }}
        </div>
      </div>
      
      <div class="input-area">
        <input 
          [(ngModel)]="newMessage" 
          (keyup.enter)="sendMessage()"
          placeholder="Type a message..."
        >
        <button (click)="sendMessage()">Send</button>
      </div>
      
      <div class="status" [class.connected]="isConnected">
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  newMessage = '';
  isConnected = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(private ws: WebSocketService) {}
  
  ngOnInit() {
    this.ws.connect('wss://api.example.com/chat')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          if (message.type === 'chat') {
            this.messages.push(message.payload);
          } else if (message.type === 'connected') {
            this.isConnected = true;
          }
        },
        error: (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
        }
      });
  }
  
  sendMessage() {
    if (this.newMessage.trim()) {
      this.ws.send({
        type: 'chat',
        payload: {
          text: this.newMessage,
          user: 'CurrentUser',
          timestamp: new Date().toISOString()
        }
      });
      this.newMessage = '';
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws.close();
  }
}
```

### WebSocket vs HTTP Polling vs Server-Sent Events

| Feature | WebSocket | HTTP Polling | Server-Sent Events |
|---------|-----------|--------------|-------------------|
| Direction | Bidirectional | Client → Server | Server → Client |
| Connection | Persistent | Multiple requests | Persistent |
| Overhead | Low | High | Medium |
| Real-time | Yes | No (delayed) | Yes |
| Browser Support | Excellent | Universal | Good |
| Complexity | Medium | Low | Low |
| Use Case | Chat, games | Simple updates | Notifications |

### Best Practices

1. **Always implement reconnection logic**
```javascript
// ✅ Good: Automatic reconnection with exponential backoff
class ReconnectingWebSocket {
  attemptReconnect() {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempts),
      this.maxDelay
    );
    setTimeout(() => this.connect(), delay);
  }
}
```

2. **Implement heartbeat/ping-pong**
```javascript
// Keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

3. **Handle connection states**
```javascript
switch (ws.readyState) {
  case WebSocket.CONNECTING:
    // Show connecting indicator
    break;
  case WebSocket.OPEN:
    // Enable send button
    break;
  case WebSocket.CLOSING:
  case WebSocket.CLOSED:
    // Show disconnected state
    break;
}
```

4. **Queue messages when disconnected**
```javascript
const messageQueue = [];

function send(message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  } else {
    messageQueue.push(message);
  }
}

ws.onopen = () => {
  // Flush queue
  while (messageQueue.length > 0) {
    ws.send(messageQueue.shift());
  }
};
```

---

## 3. Caching Strategies

### Why Caching Matters

Caching reduces:
- Server load (fewer requests)
- Network latency (faster responses)
- Bandwidth usage (less data transfer)
- User wait time (instant responses)

### Types of Caching

1. **Memory Cache** - In-memory storage (fastest, volatile)
2. **HTTP Cache** - Browser cache (fast, persistent)
3. **Service Worker Cache** - Programmable cache (flexible, offline-capable)
4. **IndexedDB** - Client-side database (large data, persistent)
5. **LocalStorage/SessionStorage** - Key-value storage (simple, limited)

### Memory Cache (In-Memory)

**Simple Memory Cache:**

```javascript
class MemoryCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live in milliseconds
  }
  
  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    const age = Date.now() - item.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  has(key) {
    return this.get(key) !== null;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

// Usage
const cache = new MemoryCache(50, 5 * 60 * 1000); // 50 items, 5 min TTL

// Cache API response
async function fetchUser(userId) {
  const cacheKey = `user:${userId}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit!');
    return cached;
  }
  
  // Fetch from API
  console.log('Cache miss, fetching...');
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();
  
  // Store in cache
  cache.set(cacheKey, user);
  
  return user;
}
```

**LRU (Least Recently Used) Cache:**

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  set(key, value) {
    // Delete if exists (to reorder)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Add to end
    this.cache.set(key, value);
    
    // Remove oldest if over capacity
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Usage
const lruCache = new LRUCache(3);

lruCache.set('a', 1);
lruCache.set('b', 2);
lruCache.set('c', 3);
console.log(lruCache.cache); // Map { 'a' => 1, 'b' => 2, 'c' => 3 }

lruCache.get('a'); // Access 'a'
console.log(lruCache.cache); // Map { 'b' => 2, 'c' => 3, 'a' => 1 }

lruCache.set('d', 4); // Evicts 'b' (least recently used)
console.log(lruCache.cache); // Map { 'c' => 3, 'a' => 1, 'd' => 4 }
```

### Angular Caching Service

```typescript
// cache.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private observableCache = new Map<string, Observable<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Get cached value or null if not found/expired
   */
  get<T>(key: string, ttl: number = this.defaultTTL): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  /**
   * Set cache value
   */
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * Cache Observable result
   */
  cacheObservable<T>(
    key: string,
    observable: Observable<T>,
    ttl: number = this.defaultTTL
  ): Observable<T> {
    // Check memory cache first
    const cached = this.get<T>(key, ttl);
    if (cached !== null) {
      return of(cached);
    }
    
    // Check if Observable is already in flight
    if (this.observableCache.has(key)) {
      return this.observableCache.get(key)!;
    }
    
    // Create new Observable with caching
    const shared = observable.pipe(
      tap(value => {
        this.set(key, value);
        this.observableCache.delete(key);
      }),
      shareReplay(1)
    );
    
    this.observableCache.set(key, shared);
    return shared;
  }
  
  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.observableCache.delete(key);
  }
  
  /**
   * Invalidate by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.observableCache.delete(key);
    });
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.observableCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(
    private http: HttpClient,
    private cache: CacheService
  ) {}
  
  getUser(userId: string): Observable<User> {
    const cacheKey = `user:${userId}`;
    
    return this.cache.cacheObservable(
      cacheKey,
      this.http.get<User>(`/api/users/${userId}`),
      5 * 60 * 1000 // 5 minutes
    );
  }
  
  updateUser(userId: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`/api/users/${userId}`, data).pipe(
      tap(() => {
        // Invalidate cache after update
        this.cache.invalidate(`user:${userId}`);
      })
    );
  }
  
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${userId}`).pipe(
      tap(() => {
        // Invalidate user cache and related caches
        this.cache.invalidatePattern(/^user:/);
      })
    );
  }
}
```

### HTTP Cache Headers

**Understanding Cache-Control:**

```javascript
// Server-side (Node.js/Express)
app.get('/api/data', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    'ETag': generateETag(data),
    'Last-Modified': new Date().toUTCString()
  });
  res.json(data);
});

// Different caching strategies:

// 1. No caching (always fresh)
'Cache-Control': 'no-store'

// 2. Validate before use (conditional requests)
'Cache-Control': 'no-cache'

// 3. Cache for 1 hour
'Cache-Control': 'public, max-age=3600'

// 4. Cache privately (browser only, not CDN)
'Cache-Control': 'private, max-age=3600'

// 5. Cache but revalidate when stale
'Cache-Control': 'public, max-age=3600, must-revalidate'
```

**Client-side Cache Control:**

```javascript
// Fetch with cache control
async function fetchWithCache(url, cacheStrategy = 'default') {
  const response = await fetch(url, {
    cache: cacheStrategy
    // Options:
    // 'default' - Use HTTP cache
    // 'no-store' - Never cache
    // 'reload' - Always fetch from network
    // 'no-cache' - Validate before using cache
    // 'force-cache' - Use cache even if stale
    // 'only-if-cached' - Only use cache, fail if not cached
  });
  
  return response.json();
}

// Check cache headers
fetch('/api/data').then(response => {
  console.log('Cache-Control:', response.headers.get('Cache-Control'));
  console.log('ETag:', response.headers.get('ETag'));
  console.log('Age:', response.headers.get('Age'));
});
```

### Cache Invalidation Strategies

**1. Time-based (TTL):**

```javascript
class TTLCache {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    const expiresAt = Date.now() + this.ttl;
    this.cache.set(key, { value, expiresAt });
    
    // Auto-cleanup
    setTimeout(() => {
      this.cache.delete(key);
    }, this.ttl);
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
}
```

**2. Event-based:**

```typescript
// Invalidate cache on specific events
@Injectable({ providedIn: 'root' })
export class CacheInvalidationService {
  constructor(
    private cache: CacheService,
    private eventBus: EventBusService
  ) {
    this.setupInvalidationListeners();
  }
  
  private setupInvalidationListeners() {
    // Invalidate user cache when user updates
    this.eventBus.on('user:updated').subscribe(({ userId }) => {
      this.cache.invalidate(`user:${userId}`);
    });
    
    // Invalidate all user caches when logout
    this.eventBus.on('auth:logout').subscribe(() => {
      this.cache.invalidatePattern(/^user:/);
    });
    
    // Invalidate product cache when inventory changes
    this.eventBus.on('inventory:changed').subscribe(({ productId }) => {
      this.cache.invalidate(`product:${productId}`);
    });
  }
}
```

**3. Version-based:**

```javascript
class VersionedCache {
  constructor() {
    this.cache = new Map();
    this.version = 1;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      version: this.version
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item || item.version !== this.version) {
      return null;
    }
    return item.value;
  }
  
  // Invalidate all by incrementing version
  invalidateAll() {
    this.version++;
  }
}
```

### Cache Warming

**Preload critical data:**

```typescript
@Injectable({ providedIn: 'root' })
export class CacheWarmingService {
  constructor(
    private userService: UserService,
    private productService: ProductService,
    private cache: CacheService
  ) {}
  
  async warmCache() {
    console.log('Warming cache...');
    
    // Preload frequently accessed data
    const promises = [
      this.warmUserCache(),
      this.warmProductCache(),
      this.warmCategoryCache()
    ];
    
    await Promise.all(promises);
    console.log('Cache warmed successfully');
  }
  
  private async warmUserCache() {
    // Preload current user and their data
    const user = await this.userService.getCurrentUser().toPromise();
    const [profile, preferences] = await Promise.all([
      this.userService.getProfile(user.id).toPromise(),
      this.userService.getPreferences(user.id).toPromise()
    ]);
  }
  
  private async warmProductCache() {
    // Preload popular products
    const products = await this.productService
      .getPopularProducts()
      .toPromise();
  }
  
  private async warmCategoryCache() {
    // Preload categories
    const categories = await this.productService
      .getCategories()
      .toPromise();
  }
}

// Warm cache on app initialization
@Component({})
export class AppComponent implements OnInit {
  constructor(private cacheWarming: CacheWarmingService) {}
  
  ngOnInit() {
    this.cacheWarming.warmCache();
  }
}
```

### Best Practices

1. **Cache key naming convention**
```javascript
// ✅ Good: Descriptive, hierarchical
const cacheKey = `user:${userId}:profile`;
const cacheKey = `product:${productId}:reviews:page:${page}`;

// ❌ Bad: Unclear, collision-prone
const cacheKey = userId;
const cacheKey = 'data';
```

2. **Set appropriate TTL**
```javascript
// Static data: Long TTL
cache.set('categories', data, 24 * 60 * 60 * 1000); // 24 hours

// Dynamic data: Short TTL
cache.set('stock', data, 60 * 1000); // 1 minute

// User-specific: Medium TTL
cache.set('user-profile', data, 5 * 60 * 1000); // 5 minutes
```

3. **Implement cache size limits**
```javascript
class BoundedCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

4. **Monitor cache performance**
```typescript
@Injectable({ providedIn: 'root' })
export class CacheMonitoringService {
  private hits = 0;
  private misses = 0;
  
  recordHit() {
    this.hits++;
  }
  
  recordMiss() {
    this.misses++;
  }
  
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }
  
  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate().toFixed(2) + '%'
    };
  }
}
```

---

## 4. IndexedDB

### What is IndexedDB?

IndexedDB is a low-level API for client-side storage of significant amounts of structured data, including files/blobs. It's a NoSQL database built into the browser.

**Key Features:**
- Large storage capacity (typically 50MB+, can be much more)
- Asynchronous API (non-blocking)
- Transactional database
- Supports indexes for fast queries
- Can store complex objects
- Persistent across sessions

**Use Cases:**
- Offline data storage
- Large datasets (product catalogs, maps)
- File/blob storage
- Application state persistence
- Sync queue for offline operations

### Basic IndexedDB Operations

```javascript
class IndexedDBManager {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }
  
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      // Called when database is created or version changes
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores (tables)
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          
          // Create indexes for fast queries
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', {
            keyPath: 'id'
          });
          
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('price', 'price', { unique: false });
        }
      };
    });
  }
  
  async add(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async get(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async update(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async delete(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async clear(storeName) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async query(storeName, indexName, value) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Usage
const db = new IndexedDBManager('MyApp', 1);

async function example() {
  await db.open();
  
  // Add user
  const userId = await db.add('users', {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  });
  
  // Get user
  const user = await db.get('users', userId);
  console.log('User:', user);
  
  // Update user
  await db.update('users', {
    id: userId,
    name: 'John Smith',
    email: 'john@example.com',
    age: 31
  });
  
  // Query by index
  const usersByEmail = await db.query('users', 'email', 'john@example.com');
  console.log('Found:', usersByEmail);
  
  // Get all users
  const allUsers = await db.getAll('users');
  console.log('All users:', allUsers);
  
  // Delete user
  await db.delete('users', userId);
  
  db.close();
}
```

### Advanced IndexedDB Patterns

**Cursor for large datasets:**

```javascript
async function iterateWithCursor(storeName, callback) {
  const transaction = this.db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      
      if (cursor) {
        // Process current item
        callback(cursor.value);
        
        // Move to next item
        cursor.continue();
      } else {
        // No more items
        resolve();
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Usage: Process large dataset without loading all into memory
await iterateWithCursor('products', (product) => {
  console.log('Processing:', product.name);
  // Process one product at a time
});
```

**Range queries:**

```javascript
async function getProductsByPriceRange(minPrice, maxPrice) {
  const transaction = this.db.transaction(['products'], 'readonly');
  const store = transaction.objectStore('products');
  const index = store.index('price');
  
  // Create range
  const range = IDBKeyRange.bound(minPrice, maxPrice);
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(range);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Usage
const affordableProducts = await getProductsByPriceRange(10, 50);
```

### Angular IndexedDB Service

```typescript
// indexeddb.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbName = 'MyAngularApp';
  private version = 1;
  
  constructor() {
    this.initDB();
  }
  
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create stores
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offline-queue')) {
          db.createObjectStore('offline-queue', { 
            keyPath: 'id',
            autoIncrement: true 
          });
        }
      };
    });
  }
  
  set<T>(storeName: string, key: string, value: T): Observable<void> {
    return from(this.setAsync(storeName, key, value));
  }
  
  private async setAsync<T>(
    storeName: string,
    key: string,
    value: T
  ): Promise<void> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        key,
        value,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  get<T>(storeName: string, key: string): Observable<T | null> {
    return from(this.getAsync<T>(storeName, key));
  }
  
  private async getAsync<T>(
    storeName: string,
    key: string
  ): Promise<T | null> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  delete(storeName: string, key: string): Observable<void> {
    return from(this.deleteAsync(storeName, key));
  }
  
  private async deleteAsync(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  clear(storeName: string): Observable<void> {
    return from(this.clearAsync(storeName));
  }
  
  private async clearAsync(storeName: string): Promise<void> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// offline-queue.service.ts
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  constructor(
    private db: IndexedDBService,
    private http: HttpClient
  ) {
    this.processQueueWhenOnline();
  }
  
  async addToQueue(request: {
    url: string;
    method: string;
    body?: any;
  }): Promise<void> {
    await this.db.set('offline-queue', Date.now().toString(), request)
      .toPromise();
  }
  
  private processQueueWhenOnline() {
    window.addEventListener('online', () => {
      this.processQueue();
    });
  }
  
  private async processQueue() {
    // Get all queued requests
    // Process them one by one
    // Remove from queue on success
  }
}
```

---

## 5. Service Workers & Progressive Web Apps (PWA)

### What are Service Workers?

Service Workers are scripts that run in the background, separate from web pages, enabling features like:
- Offline functionality
- Background sync
- Push notifications
- Network request interception
- Cache management

**Key Characteristics:**
- Runs on a separate thread (like Web Workers)
- Cannot access DOM directly
- Programmable network proxy
- Terminated when not in use
- HTTPS required (except localhost)

### Service Worker Lifecycle

```
Install → Waiting → Activate → Idle → Fetch/Message → Terminate
```

**Lifecycle Events:**
1. **Install** - Service worker is being installed
2. **Activate** - Service worker is activated (old version replaced)
3. **Fetch** - Intercept network requests
4. **Message** - Receive messages from pages

### Basic Service Worker

```javascript
// sw.js - Service Worker file
const CACHE_NAME = 'my-app-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force activation
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return cached response
        if (response) {
          return response;
        }
        
        // Clone request (can only be used once)
        const fetchRequest = event.request.clone();
        
        // Fetch from network
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone response (can only be used once)
          const responseToCache = response.clone();
          
          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
});
```

**Register Service Worker:**

```javascript
// main.js - Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New Service Worker found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available! Please refresh.');
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

function showUpdateNotification() {
  if (confirm('New version available! Reload to update?')) {
    window.location.reload();
  }
}
```

### Caching Strategies

**1. Cache First (Offline First):**

```javascript
// Best for: Static assets, app shell
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version or fetch from network
        return cachedResponse || fetch(event.request);
      })
  );
});
```

**2. Network First (Online First):**

```javascript
// Best for: Dynamic content, API calls
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh data
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
```

**3. Stale While Revalidate:**

```javascript
// Best for: Frequently updated content
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Fetch fresh data in background
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Update cache
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        
        // Return cached immediately, update in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

**4. Network Only:**

```javascript
// Best for: Real-time data, POST requests
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
```

**5. Cache Only:**

```javascript
// Best for: Pre-cached resources
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
```

### Advanced Service Worker Patterns

**Dynamic Caching with Limits:**

```javascript
const CACHE_NAME = 'dynamic-v1';
const MAX_CACHE_SIZE = 50;

async function cacheWithLimit(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  // Remove oldest if at limit
  if (keys.length >= MAX_CACHE_SIZE) {
    await cache.delete(keys[0]);
  }
  
  await cache.put(request, response);
}

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          cacheWithLimit(CACHE_NAME, event.request, response.clone());
        }
        return response;
      });
    })
  );
});
```

**Selective Caching:**

```javascript
const CACHE_URLS = {
  images: /\.(png|jpg|jpeg|svg|gif)$/,
  styles: /\.css$/,
  scripts: /\.js$/,
  api: /\/api\//
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't cache API POST requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Cache images
  if (CACHE_URLS.images.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, 'images-cache'));
    return;
  }
  
  // Network first for API
  if (CACHE_URLS.api.test(url.pathname)) {
    event.respondWith(networkFirst(event.request, 'api-cache'));
    return;
  }
  
  // Default: network only
  event.respondWith(fetch(event.request));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  const response = await fetch(request);
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
```

### Background Sync

```javascript
// sw.js - Register sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Get queued messages from IndexedDB
  const messages = await getQueuedMessages();
  
  // Send each message
  for (const message of messages) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message)
      });
      
      // Remove from queue on success
      await removeFromQueue(message.id);
    } catch (error) {
      console.error('Sync failed:', error);
      // Will retry on next sync
    }
  }
}

// main.js - Request background sync
async function sendMessage(message) {
  // Try to send immediately
  try {
    await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(message)
    });
  } catch (error) {
    // Failed, queue for background sync
    await queueMessage(message);
    
    // Register sync
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-messages');
  }
}
```

### Push Notifications

```javascript
// sw.js - Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/images/icon.png',
    badge: '/images/badge.png',
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// main.js - Subscribe to push notifications
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
  });
  
  // Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### Angular PWA

**Install Angular PWA:**

```bash
ng add @angular/pwa
```

**This automatically:**
- Adds service worker configuration
- Creates `ngsw-config.json`
- Adds manifest.json
- Adds icons
- Updates angular.json

**ngsw-config.json:**

```json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api",
      "urls": ["/api/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness"
      }
    }
  ]
}
```

**Using Angular Service Worker:**

```typescript
// app.component.ts
import { SwUpdate } from '@angular/service-worker';

@Component({})
export class AppComponent implements OnInit {
  constructor(private swUpdate: SwUpdate) {}
  
  ngOnInit() {
    // Check for updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          if (confirm('New version available. Load new version?')) {
            window.location.reload();
          }
        }
      });
      
      // Check for updates every hour
      interval(60 * 60 * 1000).subscribe(() => {
        this.swUpdate.checkForUpdate();
      });
    }
  }
}

// offline.service.ts
@Injectable({ providedIn: 'root' })
export class OfflineService {
  isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  
  constructor() {
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
    });
    
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }
}
```

---

## 6. Data Change Detection Algorithms

### Dirty Checking (Angular < 2)

**How it works:**
- Store old values
- Compare with new values on every check
- Update if different

```javascript
class DirtyChecker {
  constructor() {
    this.watchers = [];
  }
  
  watch(obj, property, callback) {
    this.watchers.push({
      obj,
      property,
      oldValue: obj[property],
      callback
    });
  }
  
  digest() {
    let dirty = false;
    
    this.watchers.forEach(watcher => {
      const newValue = watcher.obj[watcher.property];
      
      if (newValue !== watcher.oldValue) {
        watcher.callback(newValue, watcher.oldValue);
        watcher.oldValue = newValue;
        dirty = true;
      }
    });
    
    // Run again if changes detected (up to 10 times)
    if (dirty && this.digestCount < 10) {
      this.digestCount++;
      this.digest();
    } else {
      this.digestCount = 0;
    }
  }
}

// Usage
const checker = new DirtyChecker();
const user = { name: 'John', age: 30 };

checker.watch(user, 'name', (newVal, oldVal) => {
  console.log(`Name changed: ${oldVal} → ${newVal}`);
});

user.name = 'Jane';
checker.digest(); // Logs: Name changed: John → Jane
```

**Problems:**
- Performance issues with many watchers
- Deep object comparison expensive
- Unpredictable digest cycles

### Immutable Data Patterns

**Concept:** Never mutate data, always create new references

```javascript
// ❌ Mutable (hard to detect changes)
const user = { name: 'John', age: 30 };
user.age = 31; // Same reference, hard to detect

// ✅ Immutable (easy to detect changes)
const user = { name: 'John', age: 30 };
const updatedUser = { ...user, age: 31 }; // New reference!

// Reference check is fast
console.log(user === updatedUser); // false - change detected!
```

**Immutable Update Patterns:**

```javascript
// Arrays
const items = [1, 2, 3];

// Add
const newItems = [...items, 4];

// Remove
const filtered = items.filter(item => item !== 2);

// Update
const updated = items.map(item => 
  item === 2 ? 20 : item
);

// Objects
const user = { name: 'John', age: 30, address: { city: 'NYC' } };

// Update top-level property
const updated = { ...user, age: 31 };

// Update nested property
const updated = {
  ...user,
  address: {
    ...user.address,
    city: 'LA'
  }
};

// Using Immer library (recommended for complex updates)
import produce from 'immer';

const updated = produce(user, draft => {
  draft.age = 31;
  draft.address.city = 'LA';
});
```

### Observable Pattern (RxJS)

**Concept:** Subscribe to changes, get notified automatically

```typescript
import { BehaviorSubject } from 'rxjs';

class UserStore {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  
  updateUser(user: User) {
    this.userSubject.next(user);
    // All subscribers automatically notified
  }
}

// Usage
const store = new UserStore();

store.user$.subscribe(user => {
  console.log('User changed:', user);
  updateUI(user);
});

store.updateUser({ name: 'John', age: 30 });
// Automatically triggers subscriber
```

### Signals (Angular 16+)

**Concept:** Fine-grained reactivity with automatic dependency tracking

```typescript
import { signal, computed, effect } from '@angular/core';

// Create signal
const count = signal(0);

// Computed value (auto-updates)
const doubleCount = computed(() => count() * 2);

// Effect (runs when dependencies change)
effect(() => {
  console.log('Count:', count());
  console.log('Double:', doubleCount());
});

// Update signal
count.set(5);
// Automatically triggers:
// - doubleCount recomputation
// - effect execution

// Update based on current value
count.update(value => value + 1);
```

**Signals vs Observables:**

| Feature | Signals | Observables |
|---------|---------|-------------|
| Synchronous | Yes | No |
| Always has value | Yes | No |
| Lazy | No | Yes |
| Automatic cleanup | Yes | Manual |
| Learning curve | Low | High |
| Use case | Component state | Async operations |

### Change Detection Strategies Comparison

```typescript
// 1. Default Change Detection
@Component({
  changeDetection: ChangeDetectionStrategy.Default
})
// Checks on every event, timer, HTTP response
// Simple but can be slow

// 2. OnPush Change Detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
// Only checks when:
// - Input reference changes
// - Event from component
// - Async pipe emits
// - Manual markForCheck()
// Fast but requires immutable patterns

// 3. Signals (Angular 16+)
@Component({})
export class MyComponent {
  count = signal(0);
  // Automatically tracks dependencies
  // Only updates what changed
  // Fastest, simplest
}
```

---

## 7. Real-Time Data Synchronization

### Optimistic Updates

**Concept:** Update UI immediately, sync with server in background

```typescript
@Injectable({ providedIn: 'root' })
export class OptimisticUpdateService {
  private items = signal<Item[]>([]);
  
  constructor(private http: HttpClient) {}
  
  async updateItem(id: string, changes: Partial<Item>) {
    // 1. Store original state
    const originalItems = this.items();
    const originalItem = originalItems.find(item => item.id === id);
    
    // 2. Update UI immediately (optimistic)
    this.items.update(items =>
      items.map(item =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
    
    try {
      // 3. Sync with server
      const updated = await this.http
        .put<Item>(`/api/items/${id}`, changes)
        .toPromise();
      
      // 4. Update with server response
      this.items.update(items =>
        items.map(item => item.id === id ? updated : item)
      );
    } catch (error) {
      // 5. Rollback on error
      this.items.set(originalItems);
      
      // Show error to user
      this.showError('Update failed. Changes reverted.');
      throw error;
    }
  }
  
  async deleteItem(id: string) {
    const originalItems = this.items();
    
    // Optimistic delete
    this.items.update(items => items.filter(item => item.id !== id));
    
    try {
      await this.http.delete(`/api/items/${id}`).toPromise();
    } catch (error) {
      // Rollback
      this.items.set(originalItems);
      this.showError('Delete failed. Item restored.');
      throw error;
    }
  }
  
  private showError(message: string) {
    // Show error notification
  }
}
```

### Conflict Resolution

**Last Write Wins:**

```typescript
class LastWriteWinsSync {
  async sync(localData: any, remoteData: any) {
    // Compare timestamps
    if (localData.updatedAt > remoteData.updatedAt) {
      // Local is newer, push to server
      return this.pushToServer(localData);
    } else {
      // Remote is newer, use remote
      return remoteData;
    }
  }
}
```

**Three-Way Merge:**

```typescript
class ThreeWayMerge {
  merge(base: any, local: any, remote: any) {
    const merged = { ...base };
    
    // Apply local changes
    Object.keys(local).forEach(key => {
      if (local[key] !== base[key]) {
        merged[key] = local[key];
      }
    });
    
    // Apply remote changes (if no conflict)
    Object.keys(remote).forEach(key => {
      if (remote[key] !== base[key]) {
        // Check for conflict
        if (local[key] !== base[key] && local[key] !== remote[key]) {
          // Conflict! Need resolution strategy
          merged[key] = this.resolveConflict(key, local[key], remote[key]);
        } else {
          merged[key] = remote[key];
        }
      }
    });
    
    return merged;
  }
  
  resolveConflict(key: string, localValue: any, remoteValue: any) {
    // Strategy 1: Always prefer remote
    return remoteValue;
    
    // Strategy 2: Always prefer local
    // return localValue;
    
    // Strategy 3: Ask user
    // return this.askUser(key, localValue, remoteValue);
    
    // Strategy 4: Merge arrays
    // if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
    //   return [...new Set([...localValue, ...remoteValue])];
    // }
  }
}
```

### Operational Transformation (OT)

**For collaborative editing:**

```typescript
class OperationalTransform {
  // Transform operations to handle concurrent edits
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [op1, { ...op2, position: op2.position + op1.text.length }];
      } else if (op1.position > op2.position) {
        return [{ ...op1, position: op1.position + op2.text.length }, op2];
      } else {
        // Same position, use timestamp or client ID
        return op1.timestamp < op2.timestamp
          ? [op1, { ...op2, position: op2.position + op1.text.length }]
          : [{ ...op1, position: op1.position + op2.text.length }, op2];
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [op1, { ...op2, position: op2.position - op1.length }];
      } else {
        return [{ ...op1, position: op1.position + op2.text.length }, op2];
      }
    }
    
    // Handle other combinations...
    return [op1, op2];
  }
}

interface Operation {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
  timestamp: number;
}
```

### Real-Time Sync with WebSocket

```typescript
@Injectable({ providedIn: 'root' })
export class RealTimeSyncService {
  private ws: WebSocket;
  private localChanges: Map<string, any> = new Map();
  private syncQueue: any[] = [];
  
  constructor() {
    this.connect();
  }
  
  private connect() {
    this.ws = new WebSocket('wss://api.example.com/sync');
    
    this.ws.onopen = () => {
      console.log('Sync connected');
      this.flushSyncQueue();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleRemoteChange(message);
    };
    
    this.ws.onclose = () => {
      console.log('Sync disconnected, reconnecting...');
      setTimeout(() => this.connect(), 1000);
    };
  }
  
  localUpdate(id: string, changes: any) {
    // Store local change
    this.localChanges.set(id, {
      ...this.localChanges.get(id),
      ...changes,
      timestamp: Date.now()
    });
    
    // Send to server
    this.sendChange({
      type: 'update',
      id,
      changes,
      timestamp: Date.now()
    });
  }
  
  private sendChange(change: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(change));
    } else {
      // Queue for later
      this.syncQueue.push(change);
    }
  }
  
  private handleRemoteChange(message: any) {
    const { type, id, changes, timestamp } = message;
    
    // Check if we have local changes
    const localChange = this.localChanges.get(id);
    
    if (localChange && localChange.timestamp > timestamp) {
      // Local is newer, ignore remote
      return;
    }
    
    // Apply remote change
    this.applyChange(id, changes);
    
    // Clear local change
    this.localChanges.delete(id);
  }
  
  private flushSyncQueue() {
    while (this.syncQueue.length > 0) {
      const change = this.syncQueue.shift();
      this.sendChange(change);
    }
  }
  
  private applyChange(id: string, changes: any) {
    // Update local state
    // Notify subscribers
  }
}
```

---

## 8. Performance Optimization Patterns

### Debouncing

**Concept:** Delay execution until after a pause in events

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage: Search input
const searchInput = document.getElementById('search');
const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query);
  performSearch(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch((e.target as HTMLInputElement).value);
});

// Angular with RxJS
@Component({})
export class SearchComponent {
  searchControl = new FormControl('');
  
  results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => this.searchService.search(query))
  );
}
```

### Throttling

**Concept:** Limit execution to once per time period

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage: Scroll event
const throttledScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
  updateScrollIndicator();
}, 100);

window.addEventListener('scroll', throttledScroll);

// Angular with RxJS
@Component({})
export class ScrollComponent {
  scroll$ = fromEvent(window, 'scroll').pipe(
    throttleTime(100),
    map(() => window.scrollY)
  );
  
  ngOnInit() {
    this.scroll$.subscribe(position => {
      console.log('Scroll:', position);
    });
  }
}
```

### Virtual Scrolling

**Concept:** Only render visible items in large lists

```typescript
// Angular CDK Virtual Scroll
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items" class="item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 400px;
      width: 100%;
    }
    .item {
      height: 50px;
    }
  `]
})
export class VirtualScrollComponent {
  items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));
}

// Vanilla JS Virtual Scroll
class VirtualScroll {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight);
    this.startIndex = 0;
    
    this.render();
    this.setupScrollListener();
  }
  
  render() {
    const endIndex = Math.min(
      this.startIndex + this.visibleCount + 5, // Buffer
      this.items.length
    );
    
    const visibleItems = this.items.slice(this.startIndex, endIndex);
    
    this.container.innerHTML = visibleItems
      .map((item, index) => `
        <div style="
          position: absolute;
          top: ${(this.startIndex + index) * this.itemHeight}px;
          height: ${this.itemHeight}px;
        ">
          ${item.name}
        </div>
      `)
      .join('');
    
    // Set container height
    this.container.style.height = `${this.items.length * this.itemHeight}px`;
  }
  
  setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      const newStartIndex = Math.floor(
        this.container.scrollTop / this.itemHeight
      );
      
      if (newStartIndex !== this.startIndex) {
        this.startIndex = newStartIndex;
        this.render();
      }
    });
  }
}
```

### Lazy Loading Images

```typescript
// Intersection Observer for lazy loading
class LazyImageLoader {
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement);
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before visible
      }
    );
  }
  
  observe(img: HTMLImageElement) {
    this.observer.observe(img);
  }
  
  loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.add('loaded');
      this.observer.unobserve(img);
    }
  }
}

// Usage
const loader = new LazyImageLoader();
document.querySelectorAll('img[data-src]').forEach(img => {
  loader.observe(img as HTMLImageElement);
});

// Angular Directive
@Directive({
  selector: 'img[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad: string;
  
  private observer: IntersectionObserver;
  
  constructor(private el: ElementRef) {}
  
  ngOnInit() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.loadImage();
      }
    });
    
    this.observer.observe(this.el.nativeElement);
  }
  
  private loadImage() {
    const img = this.el.nativeElement as HTMLImageElement;
    img.src = this.appLazyLoad;
    this.observer.disconnect();
  }
  
  ngOnDestroy() {
    this.observer.disconnect();
  }
}
```

### Request Batching

```typescript
class RequestBatcher {
  private queue: Array<{
    id: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay = 50; // ms
  
  async request(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });
      
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.flush();
        }, this.batchDelay);
      }
    });
  }
  
  private async flush() {
    const batch = this.queue.splice(0);
    this.batchTimeout = null;
    
    if (batch.length === 0) return;
    
    try {
      // Send batch request
      const ids = batch.map(item => item.id);
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      
      const results = await response.json();
      
      // Resolve individual promises
      batch.forEach(item => {
        const result = results[item.id];
        if (result) {
          item.resolve(result);
        } else {
          item.reject(new Error('Not found'));
        }
      });
    } catch (error) {
      // Reject all
      batch.forEach(item => item.reject(error));
    }
  }
}

// Usage
const batcher = new RequestBatcher();

// These 3 requests will be batched into 1
Promise.all([
  batcher.request('user-1'),
  batcher.request('user-2'),
  batcher.request('user-3')
]).then(users => {
  console.log('Got users:', users);
});
```

### Memoization

```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage
const expensiveCalculation = memoize((n: number) => {
  console.log('Computing...');
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += Math.sqrt(i);
  }
  return result;
});

console.log(expensiveCalculation(1000000)); // Computes
console.log(expensiveCalculation(1000000)); // Returns cached

// Angular Pipe with Memoization
@Pipe({ name: 'memoizedFilter', pure: true })
export class MemoizedFilterPipe implements PipeTransform {
  private cache = new Map<string, any[]>();
  
  transform(items: any[], filter: string): any[] {
    const key = `${JSON.stringify(items)}-${filter}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const result = items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
    
    this.cache.set(key, result);
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return result;
  }
}
```

---

## Summary & Best Practices

### When to Use Each Technology

| Technology | Use Case | Performance | Complexity |
|------------|----------|-------------|------------|
| Web Workers | CPU-intensive tasks | High | Medium |
| WebSockets | Real-time bidirectional | High | Medium |
| Service Workers | Offline, caching | High | High |
| IndexedDB | Large data storage | Medium | High |
| Memory Cache | Frequent access data | Very High | Low |
| HTTP Cache | Static resources | High | Low |
| Signals | Component state | Very High | Low |
| RxJS | Async operations | High | High |

### Performance Checklist

- ✅ Use Web Workers for heavy computations
- ✅ Implement proper caching strategies
- ✅ Use virtual scrolling for large lists
- ✅ Debounce user input
- ✅ Throttle scroll/resize events
- ✅ Lazy load images and routes
- ✅ Batch API requests
- ✅ Use immutable data patterns
- ✅ Implement optimistic updates
- ✅ Add offline support with Service Workers
- ✅ Monitor and measure performance

### Common Pitfalls to Avoid

1. **Not cleaning up subscriptions/workers**
```typescript
// ❌ Memory leak
ngOnInit() {
  this.data$.subscribe(data => this.data = data);
}

// ✅ Proper cleanup
private destroy$ = new Subject<void>();

ngOnInit() {
  this.data$.pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

2. **Blocking the main thread**
```typescript
// ❌ Blocks UI
function processLargeArray(items) {
  return items.map(item => expensiveOperation(item));
}

// ✅ Use Web Worker
const worker = new Worker('processor.worker.js');
worker.postMessage(items);
```

3. **Not implementing offline support**
```typescript
// ✅ Always check online status
if (navigator.onLine) {
  await syncWithServer();
} else {
  await queueForLater();
}
```

4. **Inefficient caching**
```typescript
// ❌ No cache limits
cache.set(key, value);

// ✅ Implement LRU or size limits
if (cache.size >= MAX_SIZE) {
  cache.delete(cache.keys().next().value);
}
cache.set(key, value);
```

---

## Conclusion

This guide covered advanced async operations essential for building modern, performant web applications:

1. **Web Workers** - Parallel processing without blocking UI
2. **WebSockets** - Real-time bidirectional communication
3. **Caching** - Multiple strategies for optimal performance
4. **IndexedDB** - Client-side database for large data
5. **Service Workers** - Offline functionality and PWA features
6. **Change Detection** - Efficient data synchronization
7. **Real-Time Sync** - Optimistic updates and conflict resolution
8. **Performance Patterns** - Debouncing, throttling, virtual scrolling

Master these patterns to build fast, responsive, offline-capable applications that provide excellent user experiences even under challenging network conditions.

---

**Further Reading:**
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [MDN WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Angular PWA](https://angular.io/guide/service-worker-intro)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular Signals](https://angular.io/guide/signals)

**Interview Preparation:**
- Practice implementing each pattern from scratch
- Understand trade-offs between different approaches
- Be ready to explain when to use each technology
- Know common pitfalls and how to avoid them
- Prepare real-world examples from your experience

Good luck with your interviews! 🚀
