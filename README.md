# Todo Master CRUD Application

A production-grade, full-stack TODO management system built with **React**, **Node.js + Express**, and **MongoDB + Mongoose**.

---

## 🌟 Key Features

- **Full CRUD Capabilities**: Create, Read, Update (inline and title/description), and Delete tasks directly synchronized with MongoDB.
- **Dedicated Collection Guarantee**: All tasks are stored safely in a new, isolated collection named `todos`—preventing any mutation or collision with existing database entities.
- **Modern Glassmorphic Dark UI**: High-impact visual aesthetics featuring ambient glow effects, responsive card grids, fluid micro-interactions, and accessible controls.
- **Filtering & Search**: Live instant search across titles and descriptions with category filter tabs (*All*, *Pending*, *Done*) and date sorting (*Newest First*, *Oldest First*).
- **Progress Tracking**: Real-time progress bar computing and visualizing overall completion metrics.
- **Delete Confirmation Modal**: Accessible dialog requiring explicit user confirmation before executing deletions.
- **Toast Notifications**: Interactive feedback on every database operation.

---

## 🏗️ Architecture & Technologies

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Component-driven architecture, responsive state management |
| **Styling** | Vanilla CSS3 | Custom design system, CSS variables, glassmorphism, Google Fonts (`Outfit`, `Plus Jakarta Sans`) |
| **Backend** | Node.js + Express 4 | RESTful architecture, modular routing, input allowlisting |
| **Database** | MongoDB 7 + Mongoose 8 | Schema validation, timestamps, dedicated `todos` collection |
| **Authentication** | bcryptjs + JWT cookie | Password hashing, 7-day HttpOnly cookie, server-side logout invalidation |
| **Authentication** | bcryptjs + JWT cookie | Password hashing, 7-day HttpOnly cookie, server-side logout invalidation |

---

## 📁 Project Structure

```text
d:\YASH KACHA\TODO\
├── AGENT.md                      # Project guidelines & requirements
├── README.md                     # Documentation
├── package.json                  # Monorepo runner (concurrently)
├── .gitignore                    # Secrets & dependencies guard
├── backend/
│   ├── package.json
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local environment configuration
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js             # Mongoose connection with retry handling
│   │   ├── models/
│   │   │   └── Todo.js           # Mongoose model (collection: 'todos')
│   │   ├── middleware/
│   │   │   ├── validateId.js     # MongoDB ObjectId validator
│   │   │   └── errorHandler.js   # Centralized error handler
│   │   ├── controllers/
│   │   │   ├── todoController.js # Allowlisted CRUD logic
│   │   │   └── aiController.js   # Natural language intent & safety execution
│   │   ├── services/
│   │   │   ├── aiService.js      # OpenRouter integration & system prompting
│   │   │   └── taskTools.js      # Safe task operations & confirmation tokens
│   │   ├── routes/
│   │   │   ├── todoRoutes.js     # REST CRUD routes
│   │   │   └── aiRoutes.js       # AI Chat routes
│   │   └── server.js             # Express app & server bootstrap
│   └── tests/
│       ├── api.test.js           # Automated CRUD test suite (17 assertions)
│       └── ai.test.js            # Automated AI assistant test suite (15 assertions)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html                # Semantic HTML with SEO meta tags
    ├── .env.example
    ├── .env                      # VITE_API_BASE_URL=http://localhost:5000/api
    └── src/
        ├── api/
        │   └── todoService.js    # API service client (CRUD + AI chat)
        ├── components/
        │   ├── Header.jsx        # Brand header, server status & stats
        │   ├── TodoForm.jsx      # Create & Edit form with character limits
        │   ├── TodoList.jsx      # Filterable & searchable task list
        │   ├── TodoItem.jsx      # Task card with toggle, edit & delete triggers
        │   ├── ConfirmModal.jsx  # Accessible deletion confirmation
        │   ├── AiChatModal.jsx   # Floating AI Task Assistant chat widget
        │   └── Toast.jsx         # Status notifications
        ├── styles/
        │   └── index.css         # Glassmorphic dark design system
        ├── App.jsx               # Root state & CRUD coordination
        └── main.jsx              # React DOM entry
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create account and start session | No |
| `POST` | `/api/auth/login` | Start session | No |
| `POST` | `/api/auth/logout` | Invalidate session and clear cookie | Yes |
| `GET` | `/api/auth/me` | Return current user profile | Yes |
| `POST` | `/api/todos` | Create a task for the current user | Yes |
| `GET` | `/api/todos` | List current user's tasks; supports status/search/sort query | Yes |
| `GET` | `/api/todos/:id` | Get one owned task | Yes |
| `PUT`, `PATCH` | `/api/todos/:id` | Update allowlisted task fields | Yes |
| `DELETE` | `/api/todos/:id` | Delete one owned task | Yes |
| `POST` | `/api/ai/chat` | Run AI task actions for the current user | Yes |

Auth endpoints return errors as `{ "error": "message" }`. Wrong login credentials always return `401 Invalid email or password.`. Task reads and writes for another user's task return `404`.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port `27017`

### 1. Start MongoDB
If using the local MongoDB instance:
```bash
mongod --dbpath "./database/db" --port 27017
```

### 2. Configure the backend
Copy `backend/.env.example` to `backend/.env`, set `JWT_SECRET` to a cryptographically random value of at least 32 characters, and set `MONGODB_URI` and `FRONTEND_ORIGIN` for your environment. Keep `.env` private. `OPENROUTER_API_KEY` is only needed for the AI assistant.

### 3. Start Both Backend & Frontend Simultaneously
From the root directory:
```bash
npm run dev
```

### 4. Or Run Independently
- **Backend**:
  ```bash
  cd backend
  npm run dev
  # Server runs at http://localhost:5000
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm run dev
  # Frontend runs at http://localhost:5173
  ```

---

## 🧪 Automated Testing & Verification

Run the complete test suite (CRUD endpoints + AI natural language assistant):
```bash
npm run test:all --prefix backend
```

The backend API test suite creates temporary test accounts and tasks in the configured database. It requires the backend server and MongoDB to be running. The AI suite additionally requires a valid `OPENROUTER_API_KEY`.

## Security Notes

- Passwords are stored as bcrypt hashes; the password hash is excluded from normal user queries and API responses.
- A signed JWT expires after seven days and is stored in an `HttpOnly`, `SameSite=Lax` cookie. Logout increments a user token version, invalidating the issued token.
- Login and registration are limited to 10 attempts per 15 minutes per server process.
- CORS allows only `FRONTEND_ORIGIN` and credentials; task and AI endpoints require authentication and scope database operations to the current user.
- Server secrets are read from environment variables. React renders task and profile text as text, not injected HTML.

Existing task documents without a `userId` are preserved in the `todos` collection but are not shown to any account. Assigning legacy records requires an explicit ownership decision; the app does not guess an owner.

### Historical Test Results
The counts below were present before authentication changes and are not current verification results. The updated authenticated API suite passed 22 assertions against MongoDB during this change.
- **CRUD Operations Suite** (`npm test --prefix backend`):
  - Health check & Input validation (`200 OK`, `400 Bad Request`)
  - Create Todo & verify MongoDB persistence (`201 Created`)
  - Read all Todos & fetch single Todo by ObjectId (`200 OK`)
  - ObjectId format validation & non-existent ID handling (`400`, `404`)
  - Update Todo fields with persistence check (`200 OK`)
  - Delete single Todo & verify deletion (`200 OK`, `404`)
  - **Result**: `17 Passed, 0 Failed`
- **AI Chat Assistant Suite** (`npm run test:ai --prefix backend`):
  - Empty message validation (`400 Bad Request`)
  - Natural language task creation via OpenRouter model (`200 OK`)
  - Natural language task listing & filtering (`200 OK`)
  - Natural language task completion status update (`200 OK`)
  - Safe deletion: requires explicit server-side confirmation token (`200 OK`)
  - Verified task is not deleted prior to confirmation
  - Confirmed deletion executes successfully with valid token (`200 OK`)
  - Reject expired or replayed confirmation tokens
  - **Result**: `15 Passed, 0 Failed`
- **Total**: `32 Passed, 0 Failed`
