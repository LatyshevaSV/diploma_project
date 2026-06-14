/* ── Navbar hamburger ──────────────────────────────── */
function hamburg() {
  document.querySelector(".dropdown").style.transform = "translateY(0)";
}
function cancel() {
  document.querySelector(".dropdown").style.transform = "translateY(-120%)";
}

/* ── Typewriter ────────────────────────────────────── */
const words = ["Live Performances",
      "New Releases",
      "Festival Sets",
      "Artist Collaborations",
      "Sound Design",
      "Club Experiences",
      "Remixes & Edits",
      "Global Bookings"];
let wi = 0, ci = 0, deleting = false;

function typeWrite() {
  const el  = document.querySelector(".typewriter-text");
  if (!el) return;
  const word = words[wi];

  if (!deleting) {
    el.textContent = word.slice(0, ++ci);
    if (ci === word.length) { deleting = true; setTimeout(typeWrite, 1600); return; }
  } else {
    el.textContent = word.slice(0, --ci);
    if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
  }
  setTimeout(typeWrite, deleting ? 60 : 110);
}
typeWrite();

/* ── Scroll-to-top button ──────────────────────────── */
const scrollBtn = document.getElementById("scrollBtn");
if (scrollBtn) {
  window.addEventListener("scroll", () => {
    scrollBtn.parentElement.style.display = window.scrollY > 400 ? "flex" : "none";
  });
}

/* ── Contact form → POST /api/contact ─────────────── */
const form      = document.getElementById("contactForm");
const successEl = document.getElementById("form-success");
const errorEl   = document.getElementById("form-error");
const submitBtn = document.getElementById("submitBtn");
const btnText   = document.getElementById("btn-text");
const btnLoad   = document.getElementById("btn-loading");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Hide previous messages
    successEl.style.display = "none";
    errorEl.style.display   = "none";

    // Show loading state
    submitBtn.disabled    = true;
    btnText.style.display = "none";
    btnLoad.style.display = "inline";

    const body = {
      name:         document.getElementById("name").value.trim(),
      email:        document.getElementById("email").value.trim(),
      inquiry_type: document.getElementById("inquiry_type").value,
      message:      document.getElementById("message").value.trim(),
    };

    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        successEl.style.display = "flex";
        form.reset();
      } else {
        errorEl.style.display = "flex";
      }
    } catch {
      errorEl.style.display = "flex";
    } finally {
      submitBtn.disabled    = false;
      btnText.style.display = "inline";
      btnLoad.style.display = "none";
    }
  });
}
