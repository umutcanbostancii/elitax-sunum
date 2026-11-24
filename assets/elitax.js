const header = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");

if (header && menuToggle) {
  const siteMenu = document.getElementById(menuToggle.getAttribute("aria-controls"));
  const mobileMenu = matchMedia("(max-width: 59.999rem)");
  document.documentElement.classList.add("has-menu");
  menuToggle.hidden = false;

  function setMenu(open) {
    header.toggleAttribute("data-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  }

  menuToggle.addEventListener("click", () => setMenu(!header.hasAttribute("data-menu-open")));
  mobileMenu.addEventListener("change", () => setMenu(false));
  siteMenu.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !header.hasAttribute("data-menu-open")) return;

    setMenu(false);
    if (link.pathname === location.pathname && link.hash) {
      const anchor = document.getElementById(link.hash.slice(1));
      const target = anchor?.matches(".stack-anchor") ? anchor.nextElementSibling : anchor;
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !header.hasAttribute("data-menu-open")) return;
    setMenu(false);
    menuToggle.focus();
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });
}

const singleColumnProfiles = matchMedia("(max-width: 56rem)");

document.querySelectorAll("[data-profile-section]").forEach((section) => {
  const profiles = Array.from(section.querySelectorAll("[data-profile]"), (control) => ({
    control,
    bio: document.getElementById(control.dataset.profile),
  }));
  let selected = profiles[0];

  function select(profile) {
    if (profile === selected) return;
    selected.control.setAttribute("aria-pressed", "false");
    selected.bio.hidden = true;
    profile.control.setAttribute("aria-pressed", "true");
    profile.bio.hidden = false;
    selected = profile;
  }

  profiles.forEach((profile) => {
    const { control, bio } = profile;
    control.setAttribute("role", "button");
    control.setAttribute("aria-controls", bio.parentElement.id);
    control.setAttribute("aria-pressed", String(profile === selected));
    control.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" || event.pointerType === "pen") select(profile);
    });
    control.addEventListener("focus", () => select(profile));
    control.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(profile);
      if (event.detail > 0 && singleColumnProfiles.matches) bio.scrollIntoView({ block: "nearest" });
    });
    control.addEventListener("keydown", (event) => {
      if (event.key !== " ") return;
      event.preventDefault();
      select(profile);
    });
  });
});

const stack = document.querySelector("[data-stack]");
if (stack && window.gsap && window.ScrollTrigger) {
  const motion = window.gsap;
  const scrollMotion = window.ScrollTrigger;
  motion.registerPlugin(scrollMotion);

  const cards = Array.from(stack.querySelectorAll(":scope > .cards_products-item"), (panel) => ({
    panel,
    title: panel.querySelector(".elitax-stack-title"),
    controls: Array.from(panel.querySelectorAll("a[href], button")),
    progress: 0,
  }));
  const section = stack.parentElement;
  const pinOffsets = [.05, .125, .20, .30];
  const settledScale = .95;
  const tintStops = ["#dce6d9", "#76968a", "#6e9399", "#a5a290", "#6c908a"];
  const ease = motion.parseEase("power1.out");
  const desktop = matchMedia("(min-width: 992px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)");
  let context = null;
  let keyboardFlow = false;
  let previousScroll = window.scrollY;
  let frame = 0;

  function updateControls() {
    frame = 0;
    if (!context) return;

    const bounds = cards.map(({ panel }) => panel.getBoundingClientRect());
    const active = Math.max(0, cards.findLastIndex(({ progress }) => progress > 0));
    section.style.setProperty("--deck-tint", motion.utils.interpolate(tintStops[active], tintStops[active + 1], cards[active].progress));
    section.style.setProperty("--deck-tint-shift", `${(active + cards[active].progress) * 6}%`);
    cards.forEach(({ controls }, index) => {
      const above = bounds.slice(index + 1);
      controls.forEach((control) => {
        if (!control.getClientRects().length || control === document.activeElement) {
          control.inert = false;
          return;
        }
        const rect = control.getBoundingClientRect();
        const x = (rect.left + rect.right) / 2;
        const y = (rect.top + rect.bottom) / 2;
        control.inert = above.some((card) => y >= card.top && y < card.bottom && x >= card.left && x < card.right);
      });
    });
  }

  function requestControlUpdate() {
    if (context && !frame) frame = requestAnimationFrame(updateControls);
  }

  function measureDeck() {
    stack.style.setProperty("--deck-viewport-width", `${document.documentElement.clientWidth}px`);
    stack.classList.add("is-measuring");
    const sizes = cards.map(({ panel, title }) => ({
      height: panel.offsetHeight,
      title: title.getBoundingClientRect().height,
    }));
    stack.classList.remove("is-measuring");

    let nextPin = 0;
    cards.forEach(({ panel }, index) => {
      const pin = Math.max(window.innerHeight * pinOffsets[index], nextPin);
      panel.style.setProperty("--deck-pin", `${pin}px`);
      panel.style.setProperty("--deck-measured-height", `${sizes[index].height}px`);
      nextPin = pin + sizes[index].title * settledScale + 4;
    });
  }

  function startDeck() {
    stack.classList.add("is-animated");
    header?.classList.add("has-scroll-motion");
    previousScroll = window.scrollY;
    measureDeck();
    scrollMotion.addEventListener("refreshInit", measureDeck);
    context = motion.context(() => {
      cards.forEach((card, index) => {
        const { panel } = card;
        const next = cards[index + 1]?.panel || section.nextElementSibling;
        const render = ({ progress }) => {
          card.progress = progress;
          panel.style.setProperty("--deck-progress", ease(progress));
          requestControlUpdate();
        };
        scrollMotion.create({
          trigger: panel,
          start: "top bottom-=2",
          endTrigger: next,
          end: next ? "top bottom+=2" : "bottom top",
          scrub: true,
          onUpdate: render,
          onRefresh: render,
        });
      });
    }, stack);
    requestControlUpdate();
  }

  function stopDeck() {
    scrollMotion.removeEventListener("refreshInit", measureDeck);
    context.revert();
    context = null;
    stack.classList.remove("is-animated");
    section.style.removeProperty("--deck-tint");
    section.style.removeProperty("--deck-tint-shift");
    header?.classList.remove("has-scroll-motion", "is-scroll-hidden");
    cards.forEach(({ panel, controls }) => {
      panel.style.removeProperty("--deck-progress");
      controls.forEach((control) => { control.inert = false; });
    });
  }

  function syncDeck() {
    const active = desktop.matches && !keyboardFlow;
    if (active && !context) startDeck();
    if (!active && context) stopDeck();
  }

  desktop.addEventListener("change", syncDeck);
  window.addEventListener("scroll", () => {
    if (!context) return;
    requestControlUpdate();
    const current = window.scrollY;
    if (header && Math.abs(current - previousScroll) >= 10) {
      header.classList.toggle("is-scroll-hidden", current > previousScroll && current > header.offsetHeight);
      previousScroll = current;
    }
  }, { passive: true });
  window.addEventListener("wheel", () => {
    if (keyboardFlow && !document.activeElement.matches(":focus-visible")) {
      keyboardFlow = false;
      syncDeck();
    }
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !context) return;
    keyboardFlow = true;
    syncDeck();
  });

  function followStackAnchor() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target || !stack.contains(target)) return;
    keyboardFlow = true;
    syncDeck();
    target.scrollIntoView();
  }

  window.addEventListener("hashchange", followStackAnchor);
  followStackAnchor();
  syncDeck();
  document.fonts?.ready.then(() => {
    if (context) scrollMotion.refresh();
  });
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const fields = contactForm.querySelector("[data-contact-fields]");
  const status = contactForm.querySelector("[data-contact-status]");
  const submit = contactForm.querySelector("button[type=submit]");

  fetch("/api/durum", { headers: { Accept: "application/json" }, cache: "no-store" })
    .then((response) => response.ok && response.json())
    .then((health) => {
      if (!health?.inquiries || health.service !== "elitax-local-preview-v1") throw new Error();
      fields.disabled = false;
      status.textContent = "";
    })
    .catch(() => {
      status.textContent = "Yerel kayıt servisine şu anda ulaşılamıyor.";
    });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled || fields.disabled) return;

    const body = new URLSearchParams(new FormData(contactForm));
    submit.disabled = true;
    status.textContent = "Test talebi kaydediliyor.";

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        status.textContent = result.error || "Test talebi kaydedilemedi. Lütfen yeniden deneyin.";
      } else {
        contactForm.reset();
        status.textContent = `Test talebiniz kaydedildi. Referans numaranız ${result.referans}.`;
      }
    } catch {
      status.textContent = "Kayıt servisine ulaşılamadı. Lütfen yeniden deneyin.";
    } finally {
      submit.disabled = false;
      status.focus();
    }
  });
}

// These bookmarks predate the separate partner biography pages.
if (/^\/(?:hakkimizda|ekibimiz)(?:\/index\.html|\/)?$/.test(location.pathname)) {
  const formerPartners = new Set([
    "nedim-tolga-suer",
    "kurtulus-ozan-keser",
    "riza-altin",
    "cuneyt-altug",
  ]);
  const followFormerPartner = () => {
    const slug = location.hash.slice(1);
    if (formerPartners.has(slug)) {
      location.replace(`/ekibimiz/${slug}/${location.search}`);
    } else if (slug === "kurucular") {
      location.replace(`/ekibimiz/${location.search}#our-partners`);
    }
  };
  followFormerPartner();
  window.addEventListener("hashchange", followFormerPartner);
}

const workSequence = document.querySelector("[data-work-sequence]");
if (workSequence && window.gsap && window.ScrollTrigger) {
  const layout = workSequence.querySelector("[data-work-layout]");
  const steps = Array.from(layout.querySelectorAll("[data-work-step]"));
  const gsap = window.gsap;
  const scrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(scrollTrigger);
  gsap.matchMedia().add("(min-width: 62rem) and (min-height: 42rem) and (prefers-reduced-motion: no-preference)", () => {
    const visual = document.createElement("div");
    visual.className = "elitax-work-visual";
    visual.setAttribute("aria-hidden", "true");
    const frame = document.createElement("div");
    frame.className = "elitax-work-frame";
    const images = steps.map((step) => step.querySelector("img").cloneNode());
    frame.append(...images);
    visual.append(frame);
    layout.append(visual);
    workSequence.setAttribute("data-work-sticky", "");

    gsap.set(images, { autoAlpha: (index) => index === 0 ? 1 : 0 });
    let active = 0;
    function selectWorkImage(index) {
      if (index === active) return;
      active = index;
      gsap.to(images, {
        autoAlpha: (imageIndex) => imageIndex === index ? 1 : 0,
        duration: .5,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    steps.forEach((step, index) => {
      scrollTrigger.create({
        trigger: step,
        start: "top center",
        end: "bottom center",
        onEnter: () => selectWorkImage(index),
        onEnterBack: () => selectWorkImage(index),
      });
    });

    return () => {
      gsap.killTweensOf(images);
      visual.remove();
      workSequence.removeAttribute("data-work-sticky");
    };
  });
}
