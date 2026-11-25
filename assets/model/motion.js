{
  const stack = document.querySelector("[data-stack]");
  if (stack) {
    const cards = Array.from(stack.querySelectorAll(".stack-card"));
    const media = cards.map(card => card.querySelector(".stack-media"));
    const sticky = matchMedia("(min-width: 60rem) and (min-height: 43rem) and (prefers-reduced-motion: no-preference)");
    let pins = [];
    let frame = 0;

    function update() {
      frame = 0;
      if (!sticky.matches) return;
      const bounds = cards.map(card => card.getBoundingClientRect());
      cards.forEach((card, index) => {
        const progress = Math.max(0, Math.min(1, (bounds[index].top - pins[index]) / ((innerHeight - pins[index]) * .72)));
        const spread = (progress * progress * (3 - 2 * progress)).toFixed(4);
        if (card.style.getPropertyValue("--stack-spread") !== spread) {
          card.style.setProperty("--stack-spread", spread);
          if (index === 1) stack.style.setProperty("--approach-tint", 1 - Number(spread));
        }
        if (media[index] && bounds[index + 1]) {
          const covered = bounds[index + 1].top <= pins[index + 1] + 24 && bounds[index + 1].top < bounds[index].bottom;
          if (media[index].inert !== covered) {
            media[index].inert = covered;
            card.classList.toggle("is-covered", covered);
          }
        }
      });
    }

    function schedule() {
      if (sticky.matches && !frame) frame = requestAnimationFrame(update);
    }

    function measure() {
      stack.classList.toggle("is-sticky", sticky.matches);
      if (sticky.matches) {
        const width = stack.getBoundingClientRect().width;
        const extra = document.documentElement.clientWidth - width;
        pins = cards.map(card => parseFloat(getComputedStyle(card).top));
        stack.style.setProperty("--entry-margin", extra / 2 + "px");
        stack.style.setProperty("--entry-width", extra + "px");
        schedule();
      } else {
        cards.forEach((card, index) => {
          card.style.removeProperty("--stack-spread");
          card.classList.remove("is-covered");
          if (media[index]) media[index].inert = false;
        });
      }
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    sticky.addEventListener("change", measure);
    measure();
  }
}
