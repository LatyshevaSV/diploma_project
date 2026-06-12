const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./evette.db");

/* ── DATABASE SETUP ────────────────────────────────── */
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      email        TEXT    NOT NULL,
      inquiry_type TEXT    NOT NULL,
      message      TEXT    NOT NULL,
      is_read      INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* ── POST /api/contact — save a new message ─────────── */
app.post("/api/contact", (req, res) => {
  const { name, email, inquiry_type, message } = req.body;

  // Basic server-side validation
  if (!name || !email || !inquiry_type || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  db.run(
    `INSERT INTO messages (name, email, inquiry_type, message) VALUES (?, ?, ?, ?)`,
    [name.trim(), email.trim(), inquiry_type.trim(), message.trim()],
    function (err) {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ success: false, error: "Database error." });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

/* ── GET /api/messages — list all messages ──────────── */
app.get("/api/messages", (req, res) => {
  db.all("SELECT * FROM messages ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("DB select error:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

/* ── PATCH /api/messages/:id/read — mark as read ─────── */
app.patch("/api/messages/:id/read", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ success: false });

  db.run("UPDATE messages SET is_read = 1 WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("DB update error:", err);
      return res.status(500).json({ success: false });
    }
    if (this.changes === 0) return res.status(404).json({ success: false, error: "Not found." });
    res.json({ success: true });
  });
});

/* ── DELETE /api/messages/:id — delete a message ─────── */
app.delete("/api/messages/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ success: false });

  db.run("DELETE FROM messages WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("DB delete error:", err);
      return res.status(500).json({ success: false });
    }
    if (this.changes === 0) return res.status(404).json({ success: false, error: "Not found." });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
  console.log(`Admin panel  → http://localhost:${PORT}/admin.html`);
});
