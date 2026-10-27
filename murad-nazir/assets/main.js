/* Shahzada Murad Nazir — site behaviour */

// Set this to a form service URL (e.g. Formspree, Basin, or your own API)
// to receive enquiries. Until it is set, the form explains that it is not connected.
const FORM_ENDPOINT = "";

(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero sequence ---------- */
  document.querySelectorAll(".arch .draw").forEach((el) => {
    try {
      const len = Math.ceil(el.getTotalLength());
      el.style.setProperty("--len", len);
    } catch (_) { /* non-geometry element */ }
  });
  const start = () => requestAnimationFrame(() => root.classList.add("is-loaded"));
  const portrait = document.querySelector(".portrait");
  if (reduceMotion) start();
  else {
    const img = new Image();
    img.onload = img.onerror = start;
    img.src = portrait ? portrait.getAttribute("href") : "";
    setTimeout(start, 1200);
  }

  /* ---------- Masthead ---------- */
  const masthead = document.querySelector("[data-masthead]");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    masthead.classList.toggle("is-solid", y > 40);
    const menuOpen = navList.classList.contains("is-open");
    masthead.classList.toggle("is-hidden", !menuOpen && y > 600 && y > lastY + 4);
    if (y < lastY - 4 || y < 600) masthead.classList.remove("is-hidden");
    lastY = y;
  };

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navList = document.querySelector("[data-nav-list]");
  const setNav = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navList.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    navToggle.querySelector(".nav__toggle-label").textContent = open ? "Close" : "Menu";
  };
  navToggle.addEventListener("click", () => setNav(navToggle.getAttribute("aria-expanded") !== "true"));
  navList.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navList.classList.contains("is-open")) { setNav(false); navToggle.focus(); }
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active section in nav ---------- */
  const links = [...navList.querySelectorAll('a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + entry.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Tabs ---------- */
  document.querySelectorAll("[data-tabs]").forEach((wrap) => {
    const tabs = [...wrap.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        if (e.key in keys) {
          e.preventDefault();
          select(tabs[(i + keys[e.key] + tabs.length) % tabs.length], true);
        } else if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
        else if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  });

  /* ---------- Lightbox ---------- */
  const lb = document.querySelector("[data-lightbox]");
  const lbImg = lb.querySelector("[data-lightbox-img]");
  const lbCap = lb.querySelector("[data-lightbox-cap]");
  let opener = null;
  document.querySelectorAll("[data-gallery] button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const thumb = btn.querySelector("img");
      lbImg.src = btn.dataset.full;
      lbImg.alt = thumb.alt;
      lbCap.textContent = thumb.alt;
      opener = btn;
      if (typeof lb.showModal === "function") lb.showModal();
      else window.open(btn.dataset.full, "_blank", "noopener");
    });
  });
  lb.querySelector("[data-lightbox-close]").addEventListener("click", () => lb.close());
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("close", () => { if (opener) opener.focus(); });

  /* ---------- Contact form ---------- */
  const form = document.querySelector("[data-form]");
  const status = form.querySelector("[data-form-status]");
  const say = (msg, isError) => { status.textContent = msg; status.classList.toggle("is-error", !!isError); };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let firstBad = null;
    form.querySelectorAll("[required]").forEach((el) => {
      const ok = el.value.trim() !== "" && (el.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.setAttribute("aria-invalid", String(!ok));
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) {
      say(firstBad.dataset.error, true);
      firstBad.focus();
      return;
    }
    if (!FORM_ENDPOINT) {
      say("Online enquiries are not connected yet. Please contact Plotify (Private) Limited, Islamabad directly.", true);
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    say("Sending…");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say("Enquiry sent. You will hear back by email.");
    } catch (_) {
      say("The enquiry didn't send. Check your connection and try again.", true);
    } finally {
      btn.disabled = false;
    }
  });
  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.value.trim()) e.target.removeAttribute("aria-invalid");
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
