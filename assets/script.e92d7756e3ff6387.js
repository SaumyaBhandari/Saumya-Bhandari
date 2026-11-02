/* Shared navigation, image viewer, and landing-page fractal geometry. */
(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menuButton = document.getElementById("mobile-menu");
  const menu = document.getElementById("primary-navigation");
  const mobile = window.matchMedia("(max-width: 800px)");
  if (menuButton && menu) {
    document.documentElement.classList.add("nav-ready");
    const setMenu = (open, restoreFocus = false) => {
      menu.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation",
      );
      document.body.classList.toggle("menu-open", open && mobile.matches);
      if (restoreFocus) menuButton.focus();
    };
    menuButton.addEventListener("click", () =>
      setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
    );
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (menuButton.getAttribute("aria-expanded") !== "true") return;
      if (event.key === "Escape") setMenu(false, true);
      if (event.key === "Tab" && mobile.matches) {
        const links = [...menu.querySelectorAll("a[href]")];
        const last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === menuButton) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          menuButton.focus();
        }
      }
    });
    document.addEventListener("click", (event) => {
      if (
        !event.target.closest(".navbar") &&
        menuButton.getAttribute("aria-expanded") === "true"
      )
        setMenu(false);
    });
    mobile.addEventListener("change", () => setMenu(false));
  }
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  // Native dialog provides focus containment, Escape, and correct modal semantics.
  let dialog;
  let returnFocus;
  const openImage = (source, caption) => {
    const url = new URL(source, location.href);
    if (!["http:", "https:", "file:"].includes(url.protocol)) return;
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "image-dialog";
      dialog.setAttribute("aria-label", "Project image");
      dialog.innerHTML =
        '<button class="dialog-close" type="button" aria-label="Close image">×</button><figure><img alt=""><figcaption></figcaption></figure>';
      document.body.append(dialog);
      dialog
        .querySelector("button")
        .addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      });
      dialog.addEventListener("close", () => {
        document.body.style.overflow = "";
        returnFocus?.focus();
      });
    }
    returnFocus = document.activeElement;
    dialog.querySelector("img").src = url.href;
    dialog.querySelector("img").alt = caption || "Project artifact";
    dialog.querySelector("figcaption").textContent = caption || "";
    dialog.showModal();
    document.body.style.overflow = "hidden";
  };
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox]");
    if (!trigger) return;
    event.preventDefault();
    openImage(
      trigger.dataset.lightbox,
      trigger.dataset.caption || trigger.querySelector("img")?.alt,
    );
  });
  window.openLightbox = (source, title, description) =>
    openImage(source, [title, description].filter(Boolean).join(" — "));
  window.closeLightbox = () => dialog?.close();

  const canvas = document.getElementById("fractal-canvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  let width = 0,
    height = 0,
    frame = null,
    visible = false,
    time = 0,
    angle = 0,
    target = 0;
  const drawBranch = (x, y, length, rotation, depth) => {
    if (depth > 7 || length < 3) return;
    const nextX = x + length * Math.sin(rotation),
      nextY = y - length * Math.cos(rotation);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(nextX, nextY);
    context.strokeStyle = `rgba(197,160,89,${Math.max(0.06, (1 - depth / 8) * 0.2)})`;
    context.lineWidth = Math.max(0.6, (8 - depth) * 0.45);
    context.stroke();
    const spread = 0.43 + angle * 0.3;
    drawBranch(nextX, nextY, length * 0.71, rotation - spread, depth + 1);
    drawBranch(nextX, nextY, length * 0.71, rotation + spread, depth + 1);
  };
  const draw = () => {
    context.clearRect(0, 0, width, height);
    drawBranch(
      width * 0.6,
      height * 1.04,
      Math.min(height * 0.22, 145),
      0.1,
      0,
    );
  };
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };
  const tick = () => {
    frame = null;
    if (!visible || document.hidden || reducedMotion.matches) return;
    time += 0.008;
    angle += (target + Math.sin(time) * 0.04 - angle) * 0.035;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    stop();
    draw();
    if (visible && !document.hidden && !reducedMotion.matches)
      frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      resume();
    },
    { threshold: 0 },
  ).observe(canvas.parentElement);
  canvas.parentElement.addEventListener(
    "pointermove",
    (event) => {
      if (!reducedMotion.matches) target = (event.clientX / width - 0.5) * 0.18;
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", resume);
  reducedMotion.addEventListener("change", resume);
  resize();
})();
