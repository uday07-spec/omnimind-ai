# 🧠 OmniMind AI

A production-ready, full-stack AI-powered multimodal workspace. Upload PDFs, images, audio, and video — then chat with Google Gemini about them and generate executive synthesis reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide React, React Router v6, Axios |
| **Backend** | Node.js, Express.js, JWT Auth, bcryptjs, Multer, Zod |
| **Database** | MongoDB (Mongoose) |
| **AI** | Google Gemini 1.5 Flash (multimodal) |

---

## Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI
- **Google Gemini API key** — get one at [aistudio.google.com](https://aistudio.google.com)

---

## 🚀 Quick Start

### 1. Clone / Navigate to project

```bash
cd cbuskundham
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/omnimind
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GEMINI_API_KEY=your_actual_gemini_api_key_here
CLIENT_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs at: **http://localhost:5000**
Health check: **http://localhost:5000/api/health**

### 3. Set up the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 📁 Project Structure

```
cbuskundham/
├── backend/
│   ├── .env                        # ← Your secrets (never commit!)
│   ├── .env.example                # Template
│   ├── server.js                   # Express entry point
│   ├── controllers/
│   │   ├── authController.js       # Register, login, logout, me
│   │   ├── chatController.js       # Chat & synthesize endpoints
│   │   ├── projectController.js    # CRUD for projects
│   │   └── uploadController.js     # File upload + AI summarization
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js                 # User schema (bcrypt hashing)
│   │   ├── Project.js              # Project/workspace schema
│   │   ├── MediaItem.js            # Uploaded file metadata + AI summary
│   │   └── ChatMessage.js          # Chat history schema
│   ├── routes/
│   │   ├── auth.js                 # /api/auth/*
│   │   └── projects.js             # /api/projects/*
│   ├── utils/
│   │   ├── gemini.js               # Gemini AI helpers (summarize/chat/synthesize)
│   │   └── fileHelper.js           # Multer config + MIME type classifier
│   └── uploads/                    # Uploaded files stored here
└── frontend/
    ├── src/
    │   ├── api/axios.js            # Axios instance with auth interceptors
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Global auth state + session restore
    │   │   └── ToastContext.jsx    # Global notification system
    │   ├── components/
    │   │   ├── Navbar.jsx          # Top navigation bar
    │   │   ├── Toast.jsx           # Toast notification container
    │   │   ├── ProjectCard.jsx     # Dashboard project cards
    │   │   ├── FileUploader.jsx    # Drag-and-drop file upload zone
    │   │   ├── MediaCard.jsx       # Uploaded media item cards
    │   │   └── ChatMessage.jsx     # Chat bubble component
    │   └── pages/
    │       ├── Login.jsx           # Authentication
    │       ├── Register.jsx        # Registration
    │       ├── Dashboard.jsx       # Project list & creation
    │       └── ProjectWorkspace.jsx # Main workspace (split panel)
    └── vite.config.js             # Proxy: /api + /uploads → :5000
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT cookie + token |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user (protected) |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all your projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get project + media + chat history |
| DELETE | `/api/projects/:id` | Delete project and all its assets |

### Media & AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects/:id/upload` | Upload file → auto AI summarization |
| DELETE | `/api/projects/:id/media/:mediaId` | Delete media item |
| POST | `/api/projects/:id/chat` | Chat with Gemini about your files |
| POST | `/api/projects/:id/synthesize` | Generate cross-modal executive summary |

---

## 🔐 Security Notes

- JWT stored in **httpOnly cookie** (XSS safe) AND `localStorage` (for Bearer header)
- Gemini API key is **backend-only** — never sent to the browser
- All project routes require authentication and ownership verification
- Multer limits: **50 MB** per upload, allowlisted MIME types only
- Passwords hashed with **bcryptjs** (salt rounds: 12)

---

## 🎨 UI Features

- **Dark theme** throughout (gray-950 / gray-900 base)
- **Split-panel workspace**: Media Library (left) + AI Chat (right)
- **Drag-and-drop** file uploader with live progress
- **Markdown rendering** for AI responses (with code highlighting)
- **Color-coded** media type badges (image/pdf/audio/video/text)
- **Collapsible AI summaries** per uploaded file
- **Global toast notifications** (success/error/info)
- **Responsive** — mobile tab switching for library vs chat panels
- **Session persistence** — survives page refresh via `/auth/me`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (use a long random string) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CLIENT_ORIGIN` | No | Frontend origin for CORS (default: http://localhost:5173) |

---

## Supported File Types

| Type | Formats |
|---|---|
| Images | PNG, JPG, JPEG, GIF, WEBP |
| Documents | PDF |
| Audio | MP3, WAV, OGG, M4A |
| Video | MP4, WEBM, MOV |
| Text | TXT, CSV, JSON, MD |

Max file size: **50 MB**
