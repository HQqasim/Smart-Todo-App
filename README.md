# smart.todo

A full-stack todo app with AI-powered task prioritization, built with React, Node.js/Express, SQLite, and the Anthropic API.

![smart.todo screenshot](screenshot.png)

## Features

- ✅ **Full CRUD** — create, read, update (inline double-click), delete tasks
- ✦ **AI Prioritization** — one click sends your tasks to Claude, which assigns HIGH / MED / LOW priority with a short reason for each
- 🔍 **Filter views** — All, Active, Done
- 🧹 **Clear completed** — bulk delete finished tasks
- ⚡ **Persistent storage** — SQLite, no external database needed

## Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | React 18 + Vite                |
| Backend   | Node.js + Express              |
| Database  | SQLite (via better-sqlite3)    |
| AI        | Anthropic API (claude-sonnet)  |

## Getting Started

### Prerequisites
- Node.js 18+
- An Anthropic API key → [get one here](https://console.anthropic.com)

### Backend

```bash
cd backend
npm install
ANTHROPIC_API_KEY=your_key_here npm start
```

Server runs on `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`

## API Endpoints

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | `/todos`            | Fetch all todos          |
| POST   | `/todos`            | Create a todo            |
| PATCH  | `/todos/:id`        | Update text/completed    |
| DELETE | `/todos/:id`        | Delete a todo            |
| POST   | `/todos/prioritize` | AI-prioritize all active |

## How AI Prioritization Works

When you click **✦ AI PRIORITIZE**, the backend sends all incomplete tasks to Claude with a prompt asking it to analyze urgency and importance. Claude returns a JSON array of `{ id, priority, reason }` objects — the backend updates the database and returns the full updated list with reasoning shown inline.

## Project Structure

```
smart-todo/
├── backend/
│   ├── server.js       # Express API + SQLite + Anthropic
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx     # Main React component
    │   ├── index.css   # Global styles
    │   └── main.jsx    # Entry point
    ├── index.html
    └── vite.config.js  # Proxy to backend
```

## License

MIT
