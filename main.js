// main.js
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Mobile menu
  const btnMenu = $("#btnMenu");
  const mobileNav = $("#mobileNav");
  btnMenu?.addEventListener("click", () => {
    const open = btnMenu.getAttribute("aria-expanded") === "true";
    btnMenu.setAttribute("aria-expanded", String(!open));
    mobileNav.style.maxHeight = open ? "0px" : mobileNav.scrollHeight + "px";
  });
  $$("#mobileNav a").forEach((a) =>
    a.addEventListener("click", () => {
      btnMenu.setAttribute("aria-expanded", "false");
      mobileNav.style.maxHeight = "0px";
    })
  );

  // Smooth anchor offset
  $$(".nav-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        e.preventDefault();
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  });

  // ===== FAQ Accordion — versi halus (tanpa patah)
  const accs = $$(".accordion");
  accs.forEach((wrap) => {
    const btn = $(".acc-btn", wrap);
    const panel = $(".acc-panel", wrap);

    // state
    let isOpen = false;
    let anim; // keep last animation

    // baseline styles agar stabil
    panel.style.overflow = "hidden";
    panel.style.height = "0px";
    panel.style.opacity = "0";
    panel.style.display = "none";

    const open = () => {
      if (isOpen) return;
      isOpen = true;
      btn.setAttribute("aria-expanded", "true");
      wrap.classList.add("is-open");

      // tampilkan lalu animasikan dari 0 -> target
      panel.style.display = "block";
      panel.style.willChange = "height,opacity";
      panel.style.height = "0px";
      panel.style.opacity = "0";

      // reflow kecil supaya height 0 terkunci
      // eslint-disable-next-line no-unused-expressions
      panel.offsetHeight;

      const target = panel.scrollHeight;
      anim?.cancel();
      anim = panel.animate(
        [{ height: "0px", opacity: 0 }, { height: target + "px", opacity: 1 }],
        { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" }
      );
      anim.onfinish = () => {
        panel.style.willChange = "auto";
        panel.style.height = "auto";
        panel.style.opacity = "1";
      };
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      btn.setAttribute("aria-expanded", "false");
      wrap.classList.remove("is-open");

      // set height sekarang (auto -> px) lalu animasikan ke 0
      const current = panel.offsetHeight; // tinggi aktual
      panel.style.height = current + "px";
      panel.style.opacity = "1";
      panel.style.willChange = "height,opacity";

      // reflow untuk kunci nilai awal
      // eslint-disable-next-line no-unused-expressions
      panel.offsetHeight;

      anim?.cancel();
      anim = panel.animate(
        [{ height: current + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
        { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" }
      );
      anim.onfinish = () => {
        panel.style.willChange = "auto";
        panel.style.display = "none";
        panel.style.height = "0px";
        panel.style.opacity = "0";
      };
    };

    btn.addEventListener("click", () => (isOpen ? close() : open()));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
    });
  });

  // ===== Contact form validation (required + HP/WA 11–13 digit)
  const form = $("#contactForm");
  const toast = $("#toast");
  const toastContent = $("#toastContent");

  const showToast = (msg) => {
    if (!toast || !toastContent) return;
    toastContent.textContent = msg;
    toast.classList.remove("hidden");
    toast.animate(
      [{ transform: "translate(-50%,20px)", opacity: 0 }, { transform: "translate(-50%,0)", opacity: 1 }],
      { duration: 200, easing: "cubic-bezier(.22,1,.36,1)" }
    );
    setTimeout(() => toast.classList.add("hidden"), 2200);
  };

  if (form) {
    const fields = {
      nama: $("#nama"),
      hp: $("#hp"),
      tipe: $("#tipe"),
      masalah: $("#masalah"),
    };

    // keep only digits & cap at 13
    fields.hp.addEventListener("input", () => {
      const digits = fields.hp.value.replace(/\D/g, "").slice(0, 13);
      fields.hp.value = digits;
      markValidity(fields.hp, /^\d{11,13}$/.test(digits));
    });

    // live validity for all fields
    Object.values(fields).forEach((el) => {
      el.addEventListener("input", () => markValidity(el, isValid(el)));
      el.addEventListener("blur", () => markValidity(el, isValid(el)));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const all = Object.values(fields);
      let firstInvalid = null;
      all.forEach((el) => {
        const ok = isValid(el);
        markValidity(el, ok);
        if (!ok && !firstInvalid) firstInvalid = el;
      });

      if (firstInvalid) {
        showToast("Mohon lengkapi data yang wajib diisi.");
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const pesan =
        `Halo FixRight, saya ${fields.nama.value}.%0A` +
        `HP/WA: ${fields.hp.value}%0A` +
        `Perangkat: ${fields.tipe.value}%0A` +
        `Masalah: ${fields.masalah.value}`;
      const url = `https://wa.me/62812000000000?text=${pesan}`;
      window.open(url, "_blank", "noopener");
      showToast("Pesan WhatsApp disiapkan ✅");
      form.reset();
    });

    function isValid(el) {
      if (el === fields.hp) return /^\d{11,13}$/.test(el.value);
      return el.value.trim().length > 0;
    }

    function markValidity(el, ok) {
      const bad = ["ring-2", "ring-red-500", "border-red-500", "focus:ring-red-500"];
      if (ok) {
        bad.forEach((c) => el.classList.remove(c));
        el.setAttribute("aria-invalid", "false");
      } else {
        bad.forEach((c) => el.classList.add(c));
        el.setAttribute("aria-invalid", "true");
      }
    }
  }

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Testimonial Carousel
  const viewport = $(".t-viewport");
  const track = $(".t-track", viewport || document);
  if (viewport && track) {
    const cards = $$(".t-card", track);
    let index = 0;
    let vis = 3;

    const setVisibility = () => {
      const w = window.innerWidth;
      vis = w >= 1024 ? 3 : w >= 640 ? 2 : 1;
      viewport.style.setProperty("--vis", vis);
      track.style.transform = `translateX(${-index * (100 / vis)}%)`;
    };

    const go = (dir = 1) => {
      index += dir;
      const maxIndex = Math.max(0, cards.length - vis);
      if (index > maxIndex) index = 0;
      if (index < 0) index = maxIndex;
      track.style.transform = `translateX(${-index * (100 / vis)}%)`;
    };

    setVisibility();
    window.addEventListener("resize", setVisibility);

    let timer = setInterval(() => go(1), 3500);
    const pause = () => clearInterval(timer);
    const resume = () => (timer = setInterval(() => go(1), 3500));

    viewport.addEventListener("mouseenter", pause);
    viewport.addEventListener("mouseleave", resume);
    viewport.addEventListener("focusin", pause);
    viewport.addEventListener("focusout", resume);

    $$(".carousel-btn").forEach((b) =>
      b.addEventListener("click", () => go(b.dataset.dir === "prev" ? -1 : 1))
    );
  }
})();
