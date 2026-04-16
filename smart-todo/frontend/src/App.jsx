import { useState, useEffect, useRef } from 'react'

const API = '/todos'

const PRIORITY_META = {
  high:   { label: 'HIGH',   color: 'var(--high)',  bg: 'var(--high-dim)' },
  medium: { label: 'MED',    color: 'var(--med)',   bg: 'var(--med-dim)'  },
  low:    { label: 'LOW',    color: 'var(--low)',   bg: 'var(--low-dim)'  },
  none:   { label: '—',      color: 'var(--muted)', bg: 'transparent'     },
}

function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.none
  return (
    <span style={{
      fontFamily: 'var(--mono)',
      fontSize: '10px',
      fontWeight: 500,
      letterSpacing: '0.08em',
      color: meta.color,
      background: meta.bg,
      border: `1px solid ${meta.color}33`,
      borderRadius: '4px',
      padding: '2px 7px',
      minWidth: '42px',
      textAlign: 'center',
      flexShrink: 0,
    }}>
      {meta.label}
    </span>
  )
}

function TodoItem({ todo, onToggle, onDelete, onEdit, reason }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const inputRef = useRef()

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = () => {
    if (draft.trim() && draft !== todo.text) onEdit(todo.id, draft.trim())
    setEditing(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: todo.completed ? 'transparent' : 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${PRIORITY_META[todo.priority]?.color || 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      opacity: todo.completed ? 0.45 : 1,
      transition: 'all var(--transition)',
      marginBottom: '8px',
      animation: 'slideIn 0.2s ease',
    }}>
      {/* Checkbox */}
      <button onClick={() => onToggle(todo.id, !todo.completed)} style={{
        width: '20px', height: '20px', borderRadius: '50%',
        border: `2px solid ${todo.completed ? 'var(--accent)' : 'var(--border)'}`,
        background: todo.completed ? 'var(--accent)' : 'transparent',
        cursor: 'pointer', flexShrink: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--transition)',
      }}>
        {todo.completed && <span style={{ color: '#000', fontSize: '11px', fontWeight: 700 }}>✓</span>}
      </button>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input ref={inputRef} value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            style={{
              width: '100%', background: 'var(--surface2)',
              border: '1px solid var(--accent)', borderRadius: '6px',
              color: 'var(--text)', fontFamily: 'var(--font)',
              fontSize: '14px', padding: '4px 8px', outline: 'none',
            }}
          />
        ) : (
          <span onDoubleClick={() => !todo.completed && setEditing(true)} style={{
            fontSize: '14px', fontWeight: 400,
            textDecoration: todo.completed ? 'line-through' : 'none',
            cursor: todo.completed ? 'default' : 'text',
            display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{todo.text}</span>
        )}
        {reason && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
            ↳ {reason}
          </span>
        )}
      </div>

      <PriorityBadge priority={todo.priority} />

      {/* Delete */}
      <button onClick={() => onDelete(todo.id)} style={{
        background: 'none', border: 'none', color: 'var(--muted)',
        cursor: 'pointer', fontSize: '16px', padding: '0 2px',
        lineHeight: 1, flexShrink: 0,
        transition: 'color var(--transition)',
      }}
        onMouseEnter={e => e.target.style.color = 'var(--high)'}
        onMouseLeave={e => e.target.style.color = 'var(--muted)'}
      >×</button>
    </div>
  )
}

export default function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [reasons, setReasons] = useState({})
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const inputRef = useRef()

  useEffect(() => { fetchTodos() }, [])

  const fetchTodos = async () => {
    setLoading(true)
    try {
      const res = await fetch(API)
      setTodos(await res.json())
    } catch { setError('Cannot connect to backend. Is the server running?') }
    finally { setLoading(false) }
  }

  const addTodo = async () => {
    if (!input.trim()) return
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input.trim() })
    })
    const todo = await res.json()
    setTodos(prev => [todo, ...prev])
    setInput('')
    inputRef.current?.focus()
  }

  const toggleTodo = async (id, completed) => {
    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  const deleteTodo = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const editTodo = async (id, text) => {
    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  const prioritize = async () => {
    setAiLoading(true)
    setReasons({})
    try {
      const res = await fetch(`${API}/prioritize`, { method: 'POST' })
      const data = await res.json()
      setTodos(data.todos)
      const reasonMap = {}
      for (const r of data.reasons || []) reasonMap[r.id] = r.reason
      setReasons(reasonMap)
    } catch { setError('AI prioritization failed.') }
    finally { setAiLoading(false) }
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const activePriority = ['high', 'medium', 'low'].reduce((acc, p) => {
    acc[p] = todos.filter(t => !t.completed && t.priority === p).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '680px', margin: '0 auto' }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .add-btn:hover { background: var(--accent) !important; color: #000 !important; }
        .ai-btn:hover:not(:disabled) { background: var(--accent-dim) !important; border-color: var(--accent) !important; color: var(--accent) !important; }
        .filter-btn:hover { color: var(--text) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
            smart<span style={{ color: 'var(--accent)' }}>.</span>todo
          </h1>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
            AI-POWERED
          </span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--mono)' }}>
          Add tasks. Let AI figure out what matters.
        </p>
      </div>

      {/* Priority stats */}
      {todos.some(t => !t.completed && t.priority !== 'none') && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[['high', 'var(--high)'], ['medium', 'var(--med)'], ['low', 'var(--low)']].map(([p, color]) =>
            activePriority[p] > 0 && (
              <div key={p} style={{
                fontFamily: 'var(--mono)', fontSize: '11px', color,
                background: `${color}18`, border: `1px solid ${color}33`,
                borderRadius: '6px', padding: '4px 10px',
              }}>
                {activePriority[p]} {p}
              </div>
            )
          )}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)',
            fontFamily: 'var(--font)', fontSize: '14px',
            padding: '12px 16px', outline: 'none',
            transition: 'border-color var(--transition)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button className="add-btn" onClick={addTodo} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--text)',
          fontFamily: 'var(--font)', fontWeight: 700,
          fontSize: '20px', padding: '0 18px',
          cursor: 'pointer', transition: 'all var(--transition)',
        }}>+</button>
      </div>

      {/* AI button */}
      <button className="ai-btn" onClick={prioritize} disabled={aiLoading || todos.filter(t => !t.completed).length === 0}
        style={{
          width: '100%', padding: '12px',
          background: 'transparent', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--muted)',
          fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em',
          cursor: aiLoading ? 'wait' : 'pointer',
          marginBottom: '28px', transition: 'all var(--transition)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
        {aiLoading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>◌</span>
            ANALYZING TASKS...
          </>
        ) : (
          <>✦ AI PRIORITIZE</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--high-dim)', border: '1px solid var(--high)',
          borderRadius: 'var(--radius)', padding: '12px 16px',
          color: 'var(--high)', fontFamily: 'var(--mono)', fontSize: '12px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {['all', 'active', 'done'].map(f => (
          <button key={f} className="filter-btn" onClick={() => setFilter(f)} style={{
            background: filter === f ? 'var(--surface2)' : 'none',
            border: filter === f ? '1px solid var(--border)' : '1px solid transparent',
            borderRadius: '8px', color: filter === f ? 'var(--text)' : 'var(--muted)',
            fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.06em',
            padding: '6px 12px', cursor: 'pointer', transition: 'all var(--transition)',
            textTransform: 'uppercase',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', alignSelf: 'center' }}>
          {todos.filter(t => !t.completed).length} remaining
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '12px', padding: '40px' }}>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', color: 'var(--muted)',
          fontFamily: 'var(--mono)', fontSize: '12px',
          padding: '48px 0', borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
        }}>
          {filter === 'done' ? 'No completed tasks.' : 'No tasks yet. Add one above.'}
        </div>
      ) : (
        filtered.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            reason={reasons[todo.id]}
          />
        ))
      )}

      {/* Footer */}
      {todos.some(t => t.completed) && (
        <button onClick={async () => {
          const done = todos.filter(t => t.completed)
          await Promise.all(done.map(t => fetch(`${API}/${t.id}`, { method: 'DELETE' })))
          setTodos(prev => prev.filter(t => !t.completed))
        }} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontFamily: 'var(--mono)', fontSize: '11px',
          cursor: 'pointer', marginTop: '16px', padding: '0',
          display: 'block', width: '100%', textAlign: 'center',
          transition: 'color var(--transition)',
        }}
          onMouseEnter={e => e.target.style.color = 'var(--high)'}
          onMouseLeave={e => e.target.style.color = 'var(--muted)'}
        >
          clear completed ({todos.filter(t => t.completed).length})
        </button>
      )}
    </div>
  )
}
