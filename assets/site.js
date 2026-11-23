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

const singleColumnProfiles = matchMedia("(max-width: 42rem)");

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
if (stack) {
  const cards = Array.from(stack.querySelectorAll(".stack-card"));
  const media = cards.map((card) => card.querySelector(".stack-media"));
  const sticky = matchMedia("(min-width: 60rem) and (min-height: 43rem) and (prefers-reduced-motion: no-preference)");
  let frame = 0;

  function updateStack() {
    frame = 0;
    const geometry = sticky.matches && cards.map((card) => ({
      bounds: card.getBoundingClientRect(),
      top: parseFloat(getComputedStyle(card).top),
    }));

    cards.slice(0, -1).forEach((card, index) => {
      const current = geometry && geometry[index];
      const next = geometry && geometry[index + 1];
      const covered = Boolean(next && next.bounds.top <= next.top + 24 && next.bounds.top < current.bounds.bottom);
      media[index].inert = covered;
      card.classList.toggle("is-covered", covered);
    });
  }

  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(updateStack);
  }

  function setSticky() {
    stack.classList.toggle("is-sticky", sticky.matches);
    requestUpdate();
  }

  sticky.addEventListener("change", setSticky);
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  setSticky();
}

// Honour bookmarks created when the team profiles lived on the corporate page.
const formerTeamDirectory = document.querySelector('[data-former-team-directory]');
if (formerTeamDirectory) {
  const formerProfiles = new Set(['profesyonel-ekip', 'nedim-tolga-suer', 'kurtulus-ozan-keser', 'dilan-yilmaz', 'savas-yilmaz', 'volkan-altun', 'nahit-sahin']);
  const followFormerProfile = () => {
    if (!formerProfiles.has(location.hash.slice(1))) return;
    const directory = new URL(formerTeamDirectory.href);
    directory.hash = location.hash;
    location.replace(directory.href);
  };
  followFormerProfile();
  window.addEventListener('hashchange', followFormerProfile);
}
