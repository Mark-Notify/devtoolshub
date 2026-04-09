<div align="center">
  <img src="public/devtools-logo-full.png" alt="DevToolsHub logo" width="72" />

  <h1>DevToolsHub</h1>
  <p>Free, fast, and developer-friendly online tools — no installation required.</p>

  [![Website](https://img.shields.io/badge/website-devtoolshub.org-4f8ef7?style=flat-square&logo=vercel)](https://www.devtoolshub.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
  [![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
</div>

---

## ✨ Tools

| Tool | URL | Description |
|------|-----|-------------|
| 🔧 JSON Formatter | `/json-format-vertical` | Validate & pretty-print JSON with syntax highlighting |
| 🔄 XML ↔ JSON | `/xml-to-json-vertical` | Convert between XML and JSON instantly |
| 🔑 JWT Decoder | `/jwt-decode` | Inspect JWT header, payload, and signature |
| 🔒 Base64 | `/base64` | Encode and decode Base64 strings |
| 📡 Morse Code | `/morse-code-decoder` | Translate text ↔ Morse code with audio playback |
| 📱 QR Code | `/qr-code-generator` | Create custom QR codes with logo & color support |
| 🌐 HTML Render | `/html-render` | Live HTML/CSS/JS preview with resizable split pane |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) — Pages Router |
| Language | TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [daisyUI](https://daisyui.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Auth | [NextAuth.js](https://next-auth.js.org/) (Google OAuth) |
| Database | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| Icons | [Heroicons](https://heroicons.com/) |
| Alerts | [SweetAlert2](https://sweetalert2.github.io/) |
| State | [Recoil](https://recoiljs.org/) |
| Deployment | [Vercel](https://vercel.com/) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas cluster (or local instance)
- Google OAuth credentials — [create here](https://console.cloud.google.com/apis/credentials)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Mark-Notify/devtoolshub.git
cd devtoolshub

# 2. Install dependencies
npm install       # or: yarn install

# 3. Configure environment variables
cp .env.example .env.local
# → Fill in MONGODB_URI, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, etc.

# 4. Start the dev server
npm run dev       # or: yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build     # runs: prisma generate && next build
npm run start
```

---

## 🌐 API Reference

All routes live under `/api/`.

### 🔍 Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | — | Check server & MongoDB connection status |

**200 Response:**
```json
{ "status": "ok", "db": "connected", "timestamp": "2024-01-01T00:00:00.000Z" }
```

**503 Response (DB unreachable):**
```json
{ "status": "error", "db": "disconnected", "message": "Database connection failed" }
```

---

### 📜 History

History is **strictly per-user** — users only see their own records. A public share link can be generated for individual entries.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/get-data` | ✅ Session | List the current user's history (newest first) |
| `POST` | `/api/save-data` | ✅ Session | Save a new history entry |
| `PATCH` | `/api/get-data` | ✅ Session | Generate a public share link for one entry |
| `GET` | `/api/history/share/[id]` | — Public | View a single entry via its `shareId` |
| `GET` | `/api/history/cleanup` | 🔐 CRON_SECRET | Delete all entries older than 1 month |

#### Generate a share link

**Request:**
```http
PATCH /api/get-data
Content-Type: application/json

{ "id": "<MongoDB _id>" }
```

**Response:**
```json
{ "shareId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

Share URL: `https://www.devtoolshub.org/api/history/share/<shareId>`

The share endpoint returns only `tool`, `inputData`, `outputData`, and `createdAt` — **`userEmail` is never exposed**.

---

### ⭐ Favorites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/favorites` | ✅ Session | List favorited tools |
| `POST` | `/api/favorites` | ✅ Session | Add a tool to favorites |
| `DELETE` | `/api/favorites` | ✅ Session | Remove a tool from favorites |

---

### 💾 Snippets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/snippets` | ✅ Session | List saved snippets |
| `POST` | `/api/snippets` | ✅ Session | Create a snippet |
| `PUT` | `/api/snippets` | ✅ Session | Update a snippet |
| `DELETE` | `/api/snippets` | ✅ Session | Delete a snippet |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devtoolshub

# NextAuth.js
NEXTAUTH_SECRET=<random 32-byte base64>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Cron job secret (protects /api/history/cleanup)
CRON_SECRET=<random 32-byte base64>
```

Generate a secret:
```bash
openssl rand -base64 32
```

---

## 🕐 Cron Jobs

`vercel.json` configures Vercel Cron to call `/api/history/cleanup` on the **1st of every month at 02:00 UTC**.

The endpoint requires:
```
Authorization: Bearer <CRON_SECRET>
```

---

## 📁 Project Structure

```
devtoolshub/
├── components/
│   ├── HtmlEditor/          # Live HTML/CSS/JS preview (split-pane)
│   ├── JsonFormat/          # JSON formatter & XML converter
│   ├── Jwt/                 # JWT decoder
│   ├── Layout/              # Header + responsive sidebar
│   ├── QRCode/              # QR code generator
│   └── ...
├── models/                  # Mongoose schemas
│   ├── UserData.ts          # History entries (with optional shareId)
│   ├── Favorite.ts
│   ├── SavedSnippet.ts
│   └── UserPreferences.ts
├── lib/
│   └── mongodb.ts           # Singleton MongoDB connection helper
├── pages/
│   ├── api/
│   │   ├── health.ts        # GET  — DB health check
│   │   ├── get-data.tsx     # GET/PATCH — user history + share link
│   │   ├── save-data.tsx    # POST — save history entry
│   │   ├── history/
│   │   │   ├── cleanup.ts   # GET  — cron: delete entries >1 month
│   │   │   └── share/
│   │   │       └── [id].ts  # GET  — public share endpoint
│   │   ├── favorites.ts
│   │   ├── snippets.ts
│   │   └── auth/
│   ├── [slug].tsx           # Dynamic tool pages
│   └── index.tsx
├── public/                  # Static assets & logo
├── vercel.json              # Cron job configuration
└── .env.example             # Environment variable template
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request

---

## 📝 License

[MIT](LICENSE) © DevToolsHub

