# Knowledge Vault — Personal Wiki & Knowledge Base

A full-stack personal wiki application for creating, organizing, and interlinking markdown articles. Built with React, Express, and MongoDB.

![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Internal Wiki Links](#internal-wiki-links)
- [Markdown Support](#markdown-support)
- [Architecture Decisions](#architecture-decisions)

---

## Features

### Core
- **Create & edit articles** — Full Markdown editor with live preview
- **Internal wiki links** — Use `[[Article Title]]` to link between articles (Wikipedia-style)
- **Tagging system** — Tag articles for organization; browse by tag on the dedicated Tags page
- **Full-text search** — Debounced search powered by MongoDB text index
- **Version history** — Every edit is saved; browse timeline and restore any past version

### User & Social
- **Session-based auth** — Register/login with email & password (bcrypt-hashed)
- **Per-user favorites** — Star articles for quick access; filter favorites in sidebar
- **Ownership model** — Only the author can edit/delete their articles; everyone can read

### UX Polish
- **Responsive design** — Mobile hamburger menu + fixed top bar; full sidebar on desktop
- **Unsaved changes guard** — Browser `beforeunload` + in-app confirmation dialog
- **Public/private toggle** — Mark articles as public or private via a switch in the editor
- **404 page** — Friendly not-found page for invalid routes
- **Rate limiting** — Auth endpoints limited to 15 attempts per 15-minute window

---

## Tech Stack

| Layer       | Technology                                                        |
| ----------- | ----------------------------------------------------------------- |
| Frontend    | React 18, TypeScript, Vite, Wouter (routing), TanStack React Query |
| UI          | shadcn/ui (Radix primitives), Tailwind CSS, Lucide icons          |
| Backend     | Express 5, TypeScript, tsx (runtime)                              |
| Database    | MongoDB (Mongoose ODM), MongoDB Atlas compatible                  |
| Auth        | express-session + memorystore, bcryptjs                           |
| Validation  | Zod (shared schemas for client & server)                         |
| Markdown    | react-markdown with custom wiki-link renderer                    |

---

## Project Structure

```
Knowledge-Vault/
├── client/                     # React frontend
│   ├── index.html
│   ├── public/                 # Static assets
│   └── src/
│       ├── App.tsx             # Router & providers
│       ├── index.css           # Global styles
│       ├── main.tsx            # Entry point
│       ├── components/
│       │   ├── ArticleCard.tsx       # Card with markdown preview
│       │   ├── ArticleEditor.tsx     # Create/edit form with preview
│       │   ├── MarkdownContent.tsx   # Wiki-link–aware markdown renderer
│       │   ├── Sidebar.tsx           # Navigation sidebar + mobile top bar
│       │   └── ui/                   # shadcn/ui primitives
│       ├── hooks/
│       │   ├── use-articles.ts       # Article/tag/version/favorite queries
│       │   ├── use-auth.ts           # Auth queries & mutations
│       │   ├── use-mobile.tsx        # Mobile breakpoint hook
│       │   └── use-toast.ts          # Toast notifications
│       ├── lib/
│       │   ├── queryClient.ts        # React Query client config
│       │   └── utils.ts              # cn() class merge utility
│       └── pages/
│           ├── Home.tsx              # Article grid + search + tag filter
│           ├── ArticleView.tsx       # Full article reader
│           ├── CreateArticle.tsx     # New article page (auth-gated)
│           ├── EditArticle.tsx       # Edit article page (auth-gated)
│           ├── ArticleHistory.tsx    # Version history timeline
│           ├── AuthPage.tsx          # Login / Register
│           ├── TagsPage.tsx          # Browse all tags
│           └── not-found.tsx         # 404 page
├── server/
│   ├── index.ts          # Express app bootstrap, session, logging
│   ├── routes.ts         # All API route handlers
│   ├── storage.ts        # Data access layer (MongoStorage)
│   ├── models.ts         # Mongoose schemas (User, Article, Version, Favorite)
│   ├── db.ts             # MongoDB connection
│   ├── static.ts         # Production static file serving
│   └── vite.ts           # Vite dev server integration
├── shared/
│   ├── schema.ts         # Zod schemas shared by client & server
│   └── routes.ts         # API contract (paths, methods, input/output schemas)
├── script/
│   └── build.ts          # Production build script
├── .env                  # Environment variables (not committed)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Knowledge-Vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root (see [Environment Variables](#environment-variables))

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at **http://localhost:5000**.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required — MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/knowledge_vault

# Optional — session secret (random one is generated if not set)
SESSION_SECRET=your-super-secret-key

# Optional — server port (default: 5000)
PORT=5000
```

> **Note:** If `SESSION_SECRET` is not set, the server generates a random secret on startup. Sessions will not persist across server restarts in that case.

---

## Available Scripts

| Command         | Description                                      |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Start dev server (Express + Vite HMR) on port 5000 |
| `npm run build` | Build for production (client + server bundle)    |
| `npm start`     | Run production build                             |
| `npm run check` | TypeScript type checking (no emit)               |

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Path                  | Auth | Description              |
| ------ | --------------------- | ---- | ------------------------ |
| POST   | `/api/auth/register`  | No   | Create account           |
| POST   | `/api/auth/login`     | No   | Sign in (rate-limited)   |
| POST   | `/api/auth/logout`    | No   | Destroy session          |
| GET    | `/api/auth/me`        | No   | Current user or `null`   |

### Articles

| Method | Path                   | Auth     | Description                    |
| ------ | ---------------------- | -------- | ------------------------------ |
| GET    | `/api/articles`        | No       | List articles (search, tag, page, limit, favorite) |
| GET    | `/api/articles/:id`    | No       | Get single article             |
| POST   | `/api/articles`        | Required | Create article                 |
| PUT    | `/api/articles/:id`    | Owner    | Update article                 |
| DELETE | `/api/articles/:id`    | Owner    | Delete article + versions      |

### Wiki Links

| Method | Path                              | Auth | Description                        |
| ------ | --------------------------------- | ---- | ---------------------------------- |
| POST   | `/api/articles/resolve-titles`    | No   | Resolve `[[Title]]` → article IDs |

### Favorites

| Method | Path                          | Auth     | Description             |
| ------ | ----------------------------- | -------- | ----------------------- |
| GET    | `/api/favorites`              | Required | List user's favorite IDs |
| POST   | `/api/favorites/:articleId`   | Required | Add favorite            |
| DELETE | `/api/favorites/:articleId`   | Required | Remove favorite         |

### Tags & Versions

| Method | Path                                                | Auth     | Description                |
| ------ | --------------------------------------------------- | -------- | -------------------------- |
| GET    | `/api/tags`                                         | No       | List all tags with counts  |
| GET    | `/api/articles/:id/versions`                        | No       | List version history       |
| POST   | `/api/articles/:id/versions/:versionId/restore`     | Required | Restore a past version     |

---

## Authentication

- **Session-based** using `express-session` + `memorystore`
- Passwords hashed with **bcryptjs** (12 salt rounds)
- Session cookie: 7-day expiry, `httpOnly`, `sameSite: lax`, `secure` in production
- Auth endpoints are **rate-limited** (15 requests per 15-minute window)
- For production, replace `memorystore` with a persistent store like `connect-mongo` or `connect-redis`

---

## Internal Wiki Links

Link between articles using double-bracket syntax anywhere in article content:

```markdown
See [[Education]] for more details.
Also check [[My Research Notes]].
```

**How it works:**
1. The `MarkdownContent` component extracts all `[[Title]]` patterns from content
2. Titles are batch-resolved via `POST /api/articles/resolve-titles` (case-insensitive)
3. **Existing articles** render as **blue clickable links** navigating to the target article
4. **Non-existing articles** render as **red dashed links** (Wikipedia-style "red links") with a hover tooltip

Wiki links work in the article view, editor preview, and version history.

---

## Markdown Support

Articles are written in standard Markdown with these features:

- Headings, bold, italic, strikethrough
- Bullet and numbered lists
- Code blocks (fenced with triple backticks)
- Blockquotes
- Horizontal rules
- Standard links: `[text](url)` — external links open in a new tab
- Images: `![alt](url)`
- Internal links: `[[Article Title]]` — see above

---

## Architecture Decisions

| Decision                  | Rationale                                                          |
| ------------------------- | ------------------------------------------------------------------ |
| Shared Zod schemas        | Single source of truth for validation on both client and server    |
| Express 5                 | Native async error handling, modern routing                        |
| Wouter over React Router  | Lightweight (~1.5 KB), sufficient for this SPA                     |
| TanStack React Query      | Declarative caching, background refetch, optimistic updates        |
| MongoDB text index        | Fast full-text search without external search engine               |
| Session auth over JWT     | Simpler for server-rendered/SPA hybrid; server can revoke sessions |
| MemoryStore (dev)         | Zero config for development; swappable for production              |
| Wiki-link via custom renderer | No remark plugins needed; preprocessing keeps it simple        |

---

## License

MIT