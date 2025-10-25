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

  // ===== FAQ Accordion — smooth
  const accs = $$(".accordion");
  accs.forEach((wrap) => {
    const btn = $(".acc-btn", wrap);
    const panel = $(".acc-panel", wrap);

    let isOpen = false;
    let anim; // keep last animation

    // baseline styles
    panel.style.overflow = "hidden";
    panel.style.height = "0px";
    panel.style.opacity = "0";
    panel.style.display = "none";

    const open = () => {
      if (isOpen) return;
      isOpen = true;
      btn.setAttribute("aria-expanded", "true");
      wrap.classList.add("is-open");

      panel.style.display = "block";
      panel.style.willChange = "height,opacity";
      panel.style.height = "0px";
      panel.style.opacity = "0";

      // reflow
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

      const current = panel.offsetHeight;
      panel.style.height = current + "px";
      panel.style.opacity = "1";
      panel.style.willChange = "height,opacity";

      // reflow
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

  // ===== Contact form validation
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
    const fields = { nama: $("#nama"), hp: $("#hp"), tipe: $("#tipe"), masalah: $("#masalah") };

    fields.hp.addEventListener("input", () => {
      const digits = fields.hp.value.replace(/\D/g, "").slice(0, 13);
      fields.hp.value = digits;
      markValidity(fields.hp, /^\d{11,13}$/.test(digits));
    });

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

      // === WHATSAPP MESSAGE FORMAT (UPDATED to 3 lines) ===
      // Halo FixRight, saya nama.
      // Perangkat: 13123
      // Masalah: tes
      const pesanText =
        `Halo FixRight, saya ${fields.nama.value}.\n` +
        `Perangkat: ${fields.tipe.value}\n` +
        `Masalah: ${fields.masalah.value}`;

      const url = `https://wa.me/62859106514143?text=${encodeURIComponent(pesanText)}`;
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
      if (ok) { bad.forEach((c) => el.classList.remove(c)); el.setAttribute("aria-invalid", "false"); }
      else { bad.forEach((c) => el.classList.add(c)); el.setAttribute("aria-invalid", "true"); }
    }
  }

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Testimonial Carousel (FIX: gap-aware pixel translate)
  const viewport = $(".t-viewport");
  const track = $(".t-track", viewport || document);
  if (viewport && track) {
    const cards = $$(".t-card", track);
    let index = 0;
    let vis = 3;
    let stepPx = 0;

    const computeStep = () => {
      // Lebar satu kartu + gap aktual di track
      const gap = parseFloat(getComputedStyle(track).gap || "16"); // fallback 16px
      const cardW = cards[0]?.getBoundingClientRect().width || 0;
      stepPx = cardW + gap;
    };

    const setVisibility = () => {
      const w = window.innerWidth;
      vis = w >= 1024 ? 3 : w >= 640 ? 2 : 1;
      viewport.style.setProperty("--vis", vis);
      // Recompute step setelah layout settle
      requestAnimationFrame(() => {
        computeStep();
        track.style.transform = `translateX(${-index * stepPx}px)`;
      });
    };

    const go = (dir = 1) => {
      index += dir;
      const maxIndex = Math.max(0, cards.length - vis);
      if (index > maxIndex) index = 0;
      if (index < 0) index = maxIndex;
      // pastikan step terbaru (misal setelah resize)
      computeStep();
      track.style.transform = `translateX(${-index * stepPx}px)`;
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
