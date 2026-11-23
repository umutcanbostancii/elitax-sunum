{
  const stack = document.querySelector("[data-stack]");
  if (stack) {
    const cards = Array.from(stack.querySelectorAll(".stack-card"));
    const sticky = matchMedia("(min-width: 60rem) and (min-height: 43rem) and (prefers-reduced-motion: no-preference)");
    let frame = 0;

    function updateWidths() {
      frame = 0;
      if (!sticky.matches) {
        cards.forEach((card) => card.style.removeProperty("--stack-spread"));
        return;
      }

      // Use each card's own sticky line so the finished layers stay fixed.
      const spreads = cards.map((card) => {
        const pin = parseFloat(getComputedStyle(card).top);
        const travel = Math.min(240, (innerHeight - pin) * .55);
        const progress = Math.max(0, Math.min(1, (card.getBoundingClientRect().top - pin) / travel));
        return (progress * progress * (3 - 2 * progress)).toFixed(4);
      });

      cards.forEach((card, index) => {
        if (card.style.getPropertyValue("--stack-spread") !== spreads[index]) {
          card.style.setProperty("--stack-spread", spreads[index]);
        }
      });
    }

    function requestWidthUpdate() {
      if (!frame) frame = requestAnimationFrame(updateWidths);
    }

    sticky.addEventListener("change", requestWidthUpdate);
    window.addEventListener("scroll", requestWidthUpdate, { passive: true });
    window.addEventListener("resize", requestWidthUpdate, { passive: true });
    window.addEventListener("pageshow", requestWidthUpdate);
    updateWidths();
  }
}
