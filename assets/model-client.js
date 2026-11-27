const contactForm = document.querySelector("[data-contact-form]");

if (contactForm && contactForm.getAttribute("action") === "/api/iletisim" && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
  contactForm.closest(".elitax-form-section").hidden = false;
  document.querySelector("[data-public-contact]").hidden = true;
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
const siteHome = new URL(document.querySelector(".site-brand").href);
const projectPath = location.pathname.slice(siteHome.pathname.length - 1);
if (/^\/(?:hakkimizda|ekibimiz)(?:\/index\.html|\/)?$/.test(projectPath)) {
  const formerPartners = new Set([
    "nedim-tolga-suer",
    "kurtulus-ozan-keser",
    "riza-altin",
    "cuneyt-altug",
  ]);
  const followFormerPartner = () => {
    const slug = location.hash.slice(1);
    if (formerPartners.has(slug)) {
      location.replace(new URL(`ekibimiz/${slug}/${location.search}`, siteHome));
    } else if (slug === "kurucular") {
      location.replace(new URL(`ekibimiz/${location.search}#our-partners`, siteHome));
    }
  };
  followFormerPartner();
  window.addEventListener("hashchange", followFormerPartner);
}


// Content is visible before enhancement, including when navigating back or printing.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const arrivals = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        if (entry.boundingClientRect.top >= innerHeight) entry.target.classList.remove('enter-view');
        continue;
      }
      const element = entry.target;
      element.classList.add('enter-view');

    }
  }, { threshold: 0.08 });
  const selectors = [
    '.model-approach-card .stack-body', '.model-approach-grid li', '.center-heading', '.sector-heading', '.service-grid > li', '.sector-card',
    '.resource-card', '.closing-layout > div',
    '.detail-prose > h2', '.detail-cta', '.team-card', '.contact-office',
    '.editorial-reading-section > h2', '.inside-story', '.editorial-card'
  ];
  document.querySelectorAll(selectors.join(',')).forEach(element => {
    const parent = element.parentElement;
    if (parent.matches('.service-grid,.resource-grid,.sector-grid,.footer-grid')) {
      const position = Array.from(parent.children).indexOf(element);
      element.style.setProperty('--entry-delay', (position % 3) * 65 + 'ms');
    }
    arrivals.observe(element);
  });
}

const servicesMenu = document.querySelector(".service-menu");
if (servicesMenu) {
  const toggle = servicesMenu.querySelector("summary");
  const groups = servicesMenu.querySelectorAll(".mega-group");
  function showGroup(selected) {
    groups.forEach(group => group.classList.toggle("selected", group === selected));
  }
  groups.forEach(group => {
    group.addEventListener("focusin", () => showGroup(group));
    group.addEventListener("pointerenter", () => showGroup(group));
  });
  showGroup([...groups].find(group => group.firstElementChild.pathname === location.pathname) || groups[0]);
  let hoverOpened = false;
  toggle.addEventListener("click", event => {
    if (event.detail && hoverOpened && servicesMenu.open) event.preventDefault();
    hoverOpened = false;
  });
  servicesMenu.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse" && innerWidth >= 960 && !servicesMenu.open) {
      servicesMenu.open = true;
      hoverOpened = true;
    }
  });
  servicesMenu.addEventListener("pointerleave", () => {
    if (!servicesMenu.contains(document.activeElement)) servicesMenu.open = false;
  });
  document.addEventListener("click", event => {
    if (!servicesMenu.contains(event.target)) servicesMenu.open = false;
  });
  servicesMenu.addEventListener("focusout", event => {
    if (!servicesMenu.contains(event.relatedTarget)) servicesMenu.open = false;
  });
  servicesMenu.addEventListener("keydown", event => {
    if (event.key === "Escape" && servicesMenu.open) {
      event.stopPropagation();
      servicesMenu.open = false;
      toggle.focus();
    }
  });
}

document.querySelectorAll("[data-sections]").forEach(group => {
  const list = group.querySelector("nav");
  const tabs = [...list.querySelectorAll("a")];
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  list.setAttribute("role", "tablist");
  function select(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    const active = tabs[index];
    if (list.scrollWidth > list.clientWidth) {
      const bounds = list.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      if (tab.left < bounds.left) list.scrollLeft += tab.left - bounds.left;
      if (tab.right > bounds.right) list.scrollLeft += tab.right - bounds.right;
    }
  }
  function fromAddress() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    select(Math.max(0, index));
    if (index >= 0) group.scrollIntoView({ block: "start", behavior: "instant" });
  }
  tabs.forEach((tab, i) => {
    tab.id = "tab-" + panels[i].id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[i].id);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", tab.id);
    panels[i].tabIndex = 0;
    tab.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (location.hash !== tab.hash) history.pushState(null, "", tab.hash);
      select(i);
    });
    tab.addEventListener("keydown", event => {
      const positions = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in positions)) return;
      event.preventDefault();
      const next = tabs[positions[event.key]];
      next.focus({preventScroll:true});
      next.click();
    });
  });
  window.addEventListener("hashchange", fromAddress);
  fromAddress();
  if (location.hash && document.readyState !== "complete") {
    window.addEventListener("load", fromAddress, { once: true });
  }
});
