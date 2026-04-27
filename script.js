// Year in footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Sticky-header subtle border on scroll
const header = document.querySelector(".site-header");
const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};
document.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const hamburger = document.querySelector(".hamburger");
const nav = document.querySelector(".primary-nav");
if (hamburger && nav) {
  hamburger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    })
  );
}

// Signup form — friendly stub (no backend yet)
const form = document.querySelector(".signup");
if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const grade = (data.get("grade") || "").toString().trim();

    if (!name || !email || !grade) {
      flash(form, "Please fill in every field so we can tailor things.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      flash(form, "That email looks off — mind double-checking?");
      return;
    }

    const button = form.querySelector("button[type=submit]");
    if (button) {
      button.disabled = true;
      button.textContent = "On its way ✓";
    }
    flash(form, `Thanks, ${name.split(" ")[0]}! Check your inbox shortly.`, "ok");
    form.reset();
    setTimeout(() => {
      if (button) {
        button.disabled = false;
        button.textContent = "Send me the snapshot";
      }
    }, 4000);
  });
}

function flash(scope, message, kind) {
  let el = scope.querySelector(".flash");
  if (!el) {
    el = document.createElement("p");
    el.className = "flash microcopy";
    scope.appendChild(el);
  }
  el.textContent = message;
  el.style.color = kind === "ok" ? "var(--brand)" : "#a13f33";
}
