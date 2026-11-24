(() => {
  const rail = document.querySelector("[data-service-rail]");
  if (!rail) return;

  const track = rail.querySelector("[data-service-track]");
  const primaryList = track?.querySelector(".reference-service-rail-list:not([aria-hidden])");
  const toggle = rail.querySelector("[data-service-rail-toggle]");
  if (!track || !primaryList || !toggle) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  let manuallyPaused = false;

  function updateDuration() {
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const cycleWidth = primaryList.getBoundingClientRect().width;
    if (cycleWidth > 0) {
      // The reference ticker moves at 3rem per second. Measure the local link rail.
      track.style.setProperty("--reference-marquee-duration", `${cycleWidth / (3 * rootSize)}s`);
    }
  }

  function update() {
    const focused = rail.querySelector(".reference-service-rail-window")?.contains(document.activeElement) ?? false;
    const paused = reducedMotion.matches || document.hidden || !visible || manuallyPaused || focused;
    rail.toggleAttribute("data-motion-paused", paused);
    rail.toggleAttribute("data-focus-in", focused);
    rail.toggleAttribute("data-page-hidden", document.hidden);
    rail.toggleAttribute("data-not-visible", !visible);
    rail.toggleAttribute("data-motion-ready", !reducedMotion.matches);
    toggle.hidden = reducedMotion.matches;
    toggle.setAttribute("aria-pressed", String(manuallyPaused));
    toggle.textContent = manuallyPaused ? "Hareketi sürdür" : "Hareketi duraklat";
  }

  toggle.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    update();
  });
  rail.addEventListener("focusin", update);
  rail.addEventListener("focusout", () => requestAnimationFrame(update));
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(rail);
  }
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(updateDuration);
    observer.observe(primaryList);
  }
  document.fonts?.ready.then(updateDuration);
  updateDuration();
  update();
})();
