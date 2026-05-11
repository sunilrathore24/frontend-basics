# React — Core Fundamentals

> A practical guide to learning React properly.
> Angular comparisons appear only as footnotes where they help — the goal is to think in React.

---

## How React Works — The Mental Model First

Before any code, understand this: **React is a UI library that re-renders your component whenever its state changes.**

That's it. Everything else — hooks, Virtual DOM, reconciliation — is just the machinery that makes that statement true efficiently.

The one shift to make early: **you describe what the UI should look like for a given state. React figures out how to get there.** You don't manipulate the DOM. You don't say "add this element" or "update that text." You say "when state is X, the UI looks like this" — and React handles the rest.

---

## 1. Components — The Building Block

A React component is a **function that returns UI**. That's the whole definition.

```jsx
function Welcome() {
  return <h1>Hello, world</h1>;
}
```

Components can be composed inside each other — this is how you build anything complex in React. Small, focused components composed together.

```jsx
function Avatar({ name }) {
  return <img src={`/avatars/${name}.jpg`} alt={name} />;
}

function UserCard({ name, role }) {
  return (
    <div className="card">
      <Avatar name={name} />
      <h2>{name}</h2>
      <p>{role}</p>
    </div>
  );
}

function Page() {
  return (
    <main>
      <UserCard name="Sunil" role="Frontend Lead" />
      <UserCard name="Priya" role="Designer" />
    </main>
  );
}
```

**Rules:**
- Component names must start with a capital letter (`UserCard`, not `userCard`)
- Must return a single root element — wrap multiple elements in `<>...</>` (Fragment) if needed
- Every render = the function runs again. This is by design, not a problem.

> 🔵 *Angular note: think standalone component but no class, no decorator, no separate template file.*

---

## 2. JSX — UI as Code

JSX is the syntax that looks like HTML inside JavaScript. It's not a template language — it compiles to plain JavaScript function calls.

```jsx
// This JSX
const el = <h1 className="title">Hello</h1>;

// Compiles to this
const el = React.createElement('h1', { className: 'title' }, 'Hello');
```

JSX rules to internalize:

```jsx
// 1. Use className, not class
<div className="container">

// 2. Use camelCase for attributes
<input onChange={handler} maxLength={10} />

// 3. Every tag must close
<br />
<img src="..." />

// 4. Expressions go inside {}
<p>{user.name}</p>
<p>{2 + 2}</p>
<p>{isAdmin ? 'Admin' : 'User'}</p>

// 5. Wrap multiple elements in a Fragment
return (
  <>
    <h1>Title</h1>
    <p>Body</p>
  </>
);
```

JSX is just JavaScript — anything valid in JS works inside `{}`. This makes it very powerful without needing to learn special template syntax.

---

## 3. Props — Passing Data Into Components

Props are how a parent passes data to a child. They flow **one direction — downward**. A child never modifies its own props.

```jsx
// Child defines what props it accepts
function Button({ label, color, onClick }) {
  return (
    <button
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// Parent passes them
function App() {
  return (
    <Button
      label="Save"
      color="blue"
      onClick={() => console.log('saved')}
    />
  );
}
```

**Passing different types:**
```jsx
<Component
  text="hello"           // string — plain quotes
  count={42}             // number — use {}
  isActive={true}        // boolean — use {}
  isVisible              // boolean true shorthand
  user={userObject}      // object
  items={[1, 2, 3]}      // array
  onSave={handleSave}    // function
/>
```

**Default props:**
```jsx
function Card({ title = 'Untitled', size = 'md' }) {
  // title and size have defaults if not passed
}
```

**Spreading props:**
```jsx
const buttonProps = { label: 'Save', color: 'blue' };
<Button {...buttonProps} />
```

> 🔵 *Angular note: props = `@Input()`. Callback props = `@Output()` + EventEmitter, but just a function.*

---

## 4. State — Making UI Dynamic

State is data that, when changed, causes the component to re-render. Declare it with `useState`.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);  // [value, setter]

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}
```

**The rules of state:**

```jsx
// ❌ Never mutate state directly — React won't re-render
state.name = 'Sunil';
items.push(newItem);

// ✅ Always create a new value with the setter
setName('Sunil');
setItems([...items, newItem]);

// ✅ When new state depends on old state, use the functional form
setCount(prev => prev + 1);   // safer than setCount(count + 1) in async situations
```

**Updating objects and arrays:**
```jsx
// Object — spread and override the changed key
const [user, setUser] = useState({ name: '', email: '' });
setUser(prev => ({ ...prev, email: 'new@email.com' }));

// Array — add item
setItems(prev => [...prev, newItem]);

// Array — remove item
setItems(prev => prev.filter(item => item.id !== id));

// Array — update item
setItems(prev => prev.map(item =>
  item.id === id ? { ...item, done: true } : item
));
```

**Where to put state:**
Put state as **low** in the component tree as possible. If only one component needs it, keep it there. If two siblings need it, lift it to their common parent.

> 🔵 *Angular note: `useState` is like signals — `const [x, setX] = useState(v)` maps to `x = signal(v)` and `setX()` maps to `x.set()`.*

---

## 5. Handling Events

Events in React use camelCase and receive a function, not a string.

```jsx
function Form() {
  const handleClick = () => {
    console.log('clicked');
  };

  const handleChange = (e) => {
    console.log(e.target.value);   // e is the native browser event
  };

  const handleSubmit = (e) => {
    e.preventDefault();            // always prevent default on form submit
    // process form
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

**Passing arguments to handlers:**
```jsx
// ✅ Wrap in arrow function to pass arguments
<button onClick={() => deleteItem(item.id)}>Delete</button>

// ❌ This calls deleteItem immediately on render, not on click
<button onClick={deleteItem(item.id)}>Delete</button>
```

---

## 6. Conditional Rendering

Since JSX is JavaScript, use JavaScript for conditions.

```jsx
function UserPanel({ user, isLoading, error }) {
  // Early return pattern — great for loading/error states
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {/* && operator — render only if true */}
      {user.isAdmin && <AdminBadge />}

      {/* Ternary — render one or the other */}
      {user.isPremium
        ? <PremiumBanner />
        : <UpgradePrompt />
      }

      {/* Null to render nothing */}
      {user.notifications.length > 0
        ? <NotificationList items={user.notifications} />
        : null
      }
    </div>
  );
}
```

---

## 7. Rendering Lists

Use `.map()` to render arrays. Every item needs a `key` — a stable, unique identifier that helps React track which items changed.

```jsx
function ProductList({ products }) {
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>          {/* key is required */}
          <h3>{product.name}</h3>
          <p>{product.price}</p>
        </li>
      ))}
    </ul>
  );
}
```

**Key rules:**
```jsx
// ✅ Use a stable unique ID from your data
<li key={user.id}>

// ✅ String keys are fine too
<li key={user.email}>

// ❌ Avoid array index as key — causes bugs when list reorders
<li key={index}>
```

Keys must be unique among siblings, not globally. They are not passed as props — the child can't see its own key.

---

## 8. Forms and Controlled Inputs

React controls form inputs by making state the single source of truth.

```jsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}                               // state drives the input
        onChange={e => setEmail(e.target.value)}    // input updates state
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

For complex forms with validation, use **React Hook Form** — it's the ecosystem standard:

```jsx
import { useForm } from 'react-hook-form';

function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    await registerUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^\S+@\S+$/, message: 'Invalid email' }
        })}
      />
      {errors.email && <p>{errors.email.message}</p>}

      <input
        type="password"
        {...register('password', { minLength: { value: 8, message: 'Min 8 chars' } })}
      />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

---

## 9. useEffect — Syncing with the Outside World

`useEffect` runs code **after** the component renders. Use it for anything that reaches outside React — API calls, subscriptions, timers, DOM manipulation.

```jsx
useEffect(() => {
  // runs after render

  return () => {
    // optional cleanup — runs before next effect or when component unmounts
  };
}, [/* dependency array */]);
```

**The dependency array controls when it runs:**

```jsx
// Run once after first render (fetch initial data)
useEffect(() => {
  fetchDashboardData().then(setData);
}, []);

// Run when userId changes
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);

// Cleanup example — event listeners, subscriptions, timers
useEffect(() => {
  const timer = setInterval(() => setTime(Date.now()), 1000);
  return () => clearInterval(timer);   // cleanup when component unmounts
}, []);

// WebSocket example
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com');
  ws.onmessage = (e) => setMessages(prev => [...prev, e.data]);
  return () => ws.close();
}, []);
```

**Common mistake — missing dependencies:**
```jsx
// ❌ userId used inside but not in dependency array
// Effect won't re-run when userId changes
useEffect(() => {
  fetchUser(userId).then(setUser);
}, []);

// ✅ Include everything the effect uses
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);
```

> 🔵 *Angular note: `[]` = ngOnInit, `[dep]` = ngOnChanges watching that dep, cleanup return = ngOnDestroy.*

---

## 10. Custom Hooks — Reusable Logic

Custom hooks are functions starting with `use` that encapsulate reusable stateful logic. This is React's primary code-sharing mechanism.

```jsx
// useLocalStorage.js — reusable hook
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  const setStoredValue = (newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue];
}

// useWindowSize.js
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

// Usage — clean component, logic is reused
function Dashboard() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const { width } = useWindowSize();

  return (
    <div className={theme}>
      {width < 768 ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
}
```

Custom hooks are the React pattern for everything Angular uses services for — data fetching, browser APIs, shared state logic.

> 🔵 *Angular note: custom hook ≈ injectable service, but just a function with no DI ceremony.*

---

## 11. Data Fetching — The Right Way

Raw `useEffect` + `useState` for fetching gets repetitive. **TanStack Query (React Query)** is the ecosystem standard — handles loading, error, caching, background refetch, and pagination.

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch
function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],                               // cache key
    queryFn: () => fetch('/api/users').then(r => r.json()),
    staleTime: 5 * 60 * 1000,                         // cache for 5 mins
  });

  if (isLoading) return <Spinner />;
  if (error) return <p>Something went wrong</p>;

  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}

// Mutate (POST/PUT/DELETE)
function AddUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newUser) => fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] }); // refetch list
    }
  });

  return (
    <button onClick={() => mutation.mutate({ name: 'Sunil' })}>
      {mutation.isPending ? 'Adding...' : 'Add User'}
    </button>
  );
}
```

Set up once at the app root:
```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}
```

---

## 12. Context — Sharing State Without Prop Drilling

When state needs to be accessible by many components at different levels, use Context instead of passing props through every layer.

```jsx
import { createContext, useContext, useState } from 'react';

// 1. Create the context
const ThemeContext = createContext(null);

// 2. Create a provider component — wrap state logic here
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Create a custom hook for clean consumption
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

// 4. Wrap your app (or subtree)
function App() {
  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

// 5. Consume anywhere in the tree
function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className={theme}>
      <button onClick={toggleTheme}>Toggle</button>
    </nav>
  );
}
```

**When to use Context vs state:**
- Local UI state (open/closed, input value) → `useState` in the component
- Shared between siblings → lift state to common parent
- Needed across many levels (theme, auth, locale) → Context
- Complex shared state with many updates → Zustand or Redux Toolkit

---

## 13. Global State Management — Zustand

For apps with complex shared state, Zustand is simple and powerful. No actions, reducers, or selectors ceremony.

```jsx
import { create } from 'zustand';

// Define your store
const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product) => set(state => ({
    items: [...state.items, { ...product, qty: 1 }]
  })),

  removeItem: (id) => set(state => ({
    items: state.items.filter(item => item.id !== id)
  })),

  updateQty: (id, qty) => set(state => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, qty } : item
    )
  })),

  // Derived value
  get total() {
    return get().items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }
}));

// Use in any component — no Provider needed
function CartIcon() {
  const items = useCartStore(state => state.items);
  return <span>{items.length} items</span>;
}

function ProductPage({ product }) {
  const addItem = useCartStore(state => state.addItem);
  return <button onClick={() => addItem(product)}>Add to cart</button>;
}
```

---

## 14. Routing — React Router v6

React has no built-in router. React Router v6 is the standard.

```jsx
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

// App setup
function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />       {/* /admin */}
          <Route path="settings" element={<Settings />} />   {/* /admin/settings */}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Navigation
function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/users">Users</Link>
    </nav>
  );
}

// Route params
function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <p>User ID: {id}</p>
      <button onClick={() => navigate('/users')}>Back</button>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
}

// Lazy loading routes
import { lazy, Suspense } from 'react';
const Admin = lazy(() => import('./pages/Admin'));

<Route path="/admin" element={
  <Suspense fallback={<Spinner />}>
    <Admin />
  </Suspense>
} />
```

---

## 15. Content Projection — children Prop

Pass UI elements into a component using the `children` prop — React's built-in slot system.

```jsx
// Simple children — single slot
function Card({ title, children }) {
  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}

<Card title="Summary">
  <p>Any content here</p>
  <button>Action</button>
</Card>

// Named slots — pass components as props
function PageLayout({ header, sidebar, children }) {
  return (
    <div className="layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

<PageLayout
  header={<TopNav />}
  sidebar={<SideMenu />}
>
  <DashboardContent />
</PageLayout>
```

---

## 16. Performance — When and How to Optimize

React is fast by default. Don't add optimizations upfront — profile first with React DevTools, then fix actual bottlenecks.

**Three tools, three problems:**

```jsx
// 1. React.memo — skip re-render if props didn't change
//    Use when a child re-renders often but its props rarely change
const UserCard = React.memo(function UserCard({ user }) {
  return <div>{user.name}</div>;
});

// 2. useMemo — memoize an expensive calculation
//    Use when a calculation is genuinely slow (sorting thousands of items, etc.)
const sortedProducts = useMemo(
  () => products.sort((a, b) => a.price - b.price),
  [products]   // recalculate only when products changes
);

// 3. useCallback — stable function reference
//    Use when passing callbacks to React.memo children (otherwise memo is useless)
const handleDelete = useCallback((id) => {
  setItems(prev => prev.filter(item => item.id !== id));
}, []);   // stable reference — won't cause child re-renders
```

**For long lists (1000+ items):** use `react-window` or `@tanstack/virtual` for virtualization.

**Profile before optimizing:**
- Open React DevTools → Profiler tab
- Record an interaction
- Look for components with long render bars
- Fix those specifically — don't wrap everything in memo

> 🔵 *Angular note: `React.memo` = OnPush, `useMemo` = pure pipe, `useCallback` = stable class method reference.*

---

## 17. TypeScript with React

TypeScript works seamlessly with React. Type your props, state, events and refs.

```tsx
// Props interface
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  onClick: () => void;
  children?: React.ReactNode;   // for components that accept children
}

function Button({ label, variant = 'primary', isLoading = false, onClick }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? <Spinner /> : label}
    </button>
  );
}

// State typing
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Product[]>([]);
const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

// Event typing
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelected(e.target.value);
};

// useRef typing
const inputRef = useRef<HTMLInputElement>(null);

// Generic custom hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [url]);

  return { data, loading };
}
```

---

## 18. Common Patterns You'll Use Daily

### Loading / Error / Empty states
```jsx
function DataView({ queryKey, fetchFn, renderItem }) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn: fetchFn });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner message={error.message} />;
  if (!data?.length) return <EmptyState message="Nothing here yet" />;

  return <ul>{data.map(renderItem)}</ul>;
}
```

### Compound components — related components that share implicit state
```jsx
// Tabs built as compound components
function Tabs({ children }) {
  const [active, setActive] = useState(0);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.Tab = function Tab({ index, label }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      className={active === index ? 'active' : ''}
      onClick={() => setActive(index)}
    >
      {label}
    </button>
  );
};

// Usage reads naturally
<Tabs>
  <Tabs.Tab index={0} label="Overview" />
  <Tabs.Tab index={1} label="Details" />
</Tabs>
```

### Lifting state up — sharing state between siblings
```jsx
// State lives in the common parent, not in either sibling
function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <>
      <SearchBar query={query} onQueryChange={setQuery} />
      <SearchResults query={query} />
    </>
  );
}
```

---

## 19. Project Structure — How React Apps Are Organized

React doesn't enforce structure. This is a solid starting point for most apps:

```
src/
  components/         # Shared, reusable UI components
    Button/
      Button.tsx
      Button.test.tsx
      index.ts        # export { Button } from './Button'

  pages/              # Route-level components (one per route)
    Home.tsx
    UserDetail.tsx
    Admin/
      index.tsx
      Dashboard.tsx

  hooks/              # Custom hooks — reusable logic
    useAuth.ts
    useWindowSize.ts
    useDebounce.ts

  store/              # Global state (Zustand stores)
    cartStore.ts
    authStore.ts

  services/           # API calls — pure functions, no state
    userService.ts
    productService.ts

  types/              # Shared TypeScript types/interfaces
    user.ts
    product.ts

  utils/              # Pure utility functions
    formatDate.ts
    formatCurrency.ts

  App.tsx             # Root component + router setup
  main.tsx            # Entry point
```

**Principles:**
- Keep components small and focused — one responsibility each
- Co-locate tests with the component they test
- Use barrel files (`index.ts`) for clean imports
- Move logic to custom hooks when a component gets complex

---

## 20. The React Ecosystem — What to Learn and When

Don't learn everything upfront. Add tools as your app needs them.

### Day 1 — Core (must know)
- `useState`, `useEffect`, `useContext` — the three foundational hooks
- React Router v6 — routing
- TypeScript + React — type safety

### Week 2 — Data and Forms
- **TanStack Query** — data fetching, caching, server state
- **React Hook Form** — forms with validation
- **Axios** — HTTP (optional, fetch works fine for most cases)

### Week 3–4 — State and Architecture
- **Zustand** — global state without boilerplate
- **React DevTools** — profiler, component inspector, state viewer
- Component patterns: compound components, render props, composition

### Later — Scale
- **Redux Toolkit** — if your team already uses Redux or state is very complex
- **react-window / TanStack Virtual** — virtualized lists
- **Vite** — fast build tool (likely already in your setup)
- **Vitest + Testing Library** — unit and component tests

---

## Key Rules to Internalize

1. **State is immutable** — always create a new value, never mutate in place
2. **Data flows down, events bubble up** — props go down, callbacks go up
3. **Keep state as low as possible** — only lift it when multiple components need it
4. **Don't optimize early** — profile first, then add `memo`/`useMemo`/`useCallback`
5. **One component, one responsibility** — if it's doing too much, split it
6. **Hooks at the top level only** — never inside conditions, loops, or nested functions
7. **Keys must be stable and unique** — never use array index for dynamic lists
8. **`e.preventDefault()`** on every form submit — always

---

## What to Build to Learn (In Order)

The fastest way to get confident is to build things that force each concept:

1. **Counter + Todo list** — useState, lists, events, controlled inputs
2. **User profile page** — props, conditional rendering, useEffect + fetch
3. **Multi-page app** — React Router, lazy loading, useParams
4. **Search with filters** — lifting state, derived state, performance basics
5. **Auth flow (login/logout)** — Context, protected routes, global state
6. **Full CRUD app** — TanStack Query, React Hook Form, Zustand

Build these in order. By the end of #6, you'll be writing idiomatic React with confidence.
