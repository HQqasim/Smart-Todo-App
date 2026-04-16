import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const db = new Database('todos.db');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

// Init DB
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'none',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// GET all todos
app.get('/todos', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
  res.json(todos);
});

// POST create todo
app.post('/todos', (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
  const result = db.prepare('INSERT INTO todos (text) VALUES (?)').run(text.trim());
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.json(todo);
});

// PATCH update todo
app.patch('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { text, completed, priority } = req.body;
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!todo) return res.status(404).json({ error: 'Not found' });

  const updated = {
    text: text ?? todo.text,
    completed: completed !== undefined ? (completed ? 1 : 0) : todo.completed,
    priority: priority ?? todo.priority,
  };

  db.prepare('UPDATE todos SET text = ?, completed = ?, priority = ? WHERE id = ?')
    .run(updated.text, updated.completed, updated.priority, id);

  res.json(db.prepare('SELECT * FROM todos WHERE id = ?').get(id));
});

// DELETE todo
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  res.json({ success: true });
});

// POST AI prioritize
app.post('/todos/prioritize', async (req, res) => {
  const todos = db.prepare('SELECT * FROM todos WHERE completed = 0').all();
  if (todos.length === 0) return res.json({ todos: [] });

  const taskList = todos.map(t => `ID ${t.id}: ${t.text}`).join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a productivity assistant. Analyze these tasks and assign a priority level to each one.

Tasks:
${taskList}

Respond ONLY with a JSON array like this (no markdown, no extra text):
[{"id": 1, "priority": "high", "reason": "short reason"}, ...]

Priority levels: "high" (urgent/important), "medium" (should do soon), "low" (can wait)`
    }]
  });

  const raw = message.content[0].text.trim();
  const priorities = JSON.parse(raw);

  const updateStmt = db.prepare('UPDATE todos SET priority = ? WHERE id = ?');
  for (const { id, priority } of priorities) {
    updateStmt.run(priority, id);
  }

  const updated = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
  res.json({ todos: updated, reasons: priorities });
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
