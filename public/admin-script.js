/* ═══════════════════════════════════════════════════════
   Evette Admin — admin-script.js
   All API calls are awaited properly so state never
   gets out of sync between the server and the UI.
═══════════════════════════════════════════════════════ */

let allMessages = [];   // full list from server
let currentId   = null; // id of the message open in modal

/* ── Helpers ──────────────────────────────────────────── */

const LABELS = {
  booking: "Booking – Club",
  livepa:  "Live PA",
  collab:  "Collab",
  label:   "Label / A&R",
  sync:    "Sync",
  press:   "Press",
  other:   "Other",
};

function fmtDate(iso) {
  const d = new Date(iso);
  // e.g. "12 Jun 2025, 14:30"
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

/* ── Load all messages from server ──────────────────── */
async function load() {
  try {
    const res = await fetch("/api/messages");
    allMessages = await res.json();
  } catch (e) {
    console.error("Failed to load messages:", e);
    allMessages = [];
  }
  render();
}

/* ── Render list (filter + search applied) ───────────── */
function render() {
  const filterVal = document.getElementById("filter").value;
  const searchVal = document.getElementById("search").value.toLowerCase().trim();

  let list = [...allMessages];

  // Filter by inquiry type
  if (filterVal !== "all") {
    list = list.filter(m => m.inquiry_type === filterVal);
  }

  // Search by name OR email (both fields)
  if (searchVal) {
    list = list.filter(m =>
      (m.name  || "").toLowerCase().includes(searchVal) ||
      (m.email || "").toLowerCase().includes(searchVal)
    );
  }

  // Build HTML rows — show only sender + type, NO message text
  const container = document.getElementById("message-list");

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-envelope-open"></i>
        No messages match your filter.
      </div>`;
  } else {
    container.innerHTML = list.map(m => `
      <div class="msg-row ${m.is_read ? "is-read" : ""}"
           onclick="openModal(${m.id})">
        <div class="unread-dot"></div>
        <div class="msg-main">
          <div class="msg-sender">${escHtml(m.name)}</div>
          <div class="msg-email">${escHtml(m.email)}</div>
        </div>
        <span class="badge">${LABELS[m.inquiry_type] || m.inquiry_type}</span>
        <div class="msg-date">${fmtDate(m.created_at)}</div>
      </div>
    `).join("");
  }

  updateStats();
}

/* ── Update stat counters ────────────────────────────── */
function updateStats() {
  document.getElementById("stat-total").textContent   = allMessages.length;
  document.getElementById("stat-unread").textContent  = allMessages.filter(m => m.is_read === 0).length;
  document.getElementById("stat-booking").textContent = allMessages.filter(m => m.inquiry_type === "booking").length;
  document.getElementById("stat-collab").textContent  = allMessages.filter(m => m.inquiry_type === "collab").length;
}

/* ── Open modal with full message text ───────────────── */
function openModal(id) {
  currentId = id;
  const m = allMessages.find(msg => msg.id === id);
  if (!m) return;

  document.getElementById("modal-badge").textContent   = LABELS[m.inquiry_type] || m.inquiry_type;
  document.getElementById("modal-date").textContent    = fmtDate(m.created_at);
  document.getElementById("modal-name").textContent    = m.name;
  document.getElementById("modal-email").textContent   = m.email;
  document.getElementById("modal-email").href          = `mailto:${m.email}`;
  document.getElementById("modal-message").textContent = m.message;

  // Grey out "Mark as Read" if already read
  const btnRead = document.getElementById("btn-read");
  btnRead.disabled = m.is_read === 1;
  btnRead.textContent = m.is_read === 1 ? "✔ Already Read" : "Mark as Read";

  document.getElementById("modal").classList.remove("hidden");
}

/* Close modal by clicking the backdrop */
function closeModalOnBg(e) {
  if (e.target === document.getElementById("modal")) closeModal();
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  currentId = null;
}

/* ── Mark as read ────────────────────────────────────── */
async function markRead() {
  if (currentId === null) return;

  try {
    const res  = await fetch(`/api/messages/${currentId}/read`, { method: "PATCH" });
    const data = await res.json();

    if (data.success) {
      // Update local state immediately — no need to re-fetch everything
      const msg = allMessages.find(m => m.id === currentId);
      if (msg) msg.is_read = 1;

      closeModal();
      render(); // re-render with updated local data
    }
  } catch (e) {
    console.error("Mark-as-read failed:", e);
  }
}

/* ── Delete message ──────────────────────────────────── */
async function deleteMsg() {
  if (currentId === null) return;
  if (!confirm("Delete this message? This cannot be undone.")) return;

  try {
    const res  = await fetch(`/api/messages/${currentId}`, { method: "DELETE" });
    const data = await res.json();

    if (data.success) {
      // Remove from local array immediately
      allMessages = allMessages.filter(m => m.id !== currentId);

      closeModal();
      render();
    }
  } catch (e) {
    console.error("Delete failed:", e);
  }
}

/* ── Safety: escape HTML to prevent XSS ─────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Boot ─────────────────────────────────────────────── */
load();
