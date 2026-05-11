const header = document.querySelector("#site-header");
const menuToggle = document.querySelector("#menu-toggle");
const siteNav = document.querySelector("#site-nav");
const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");
const heroMedia = document.querySelector("[data-hero-media]");
const heroShowcaseImage = document.querySelector("[data-hero-showcase-image]");
const heroDots = document.querySelector("[data-hero-dots]");
const heroPrev = document.querySelector("[data-hero-prev]");
const heroNext = document.querySelector("[data-hero-next]");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector(".lightbox__image");
const lightboxClose = document.querySelector(".lightbox__close");
const fullGalleryGrid = document.querySelector("[data-full-gallery-grid]");
const fullGalleryEmpty = document.querySelector("[data-full-gallery-empty]");
const galleryFilterButtons = document.querySelectorAll("[data-gallery-filter]");
const gridToggle = document.querySelector("[data-grid-toggle]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaultDocumentTitle = document.title;

const pageState = {
  content: null,
  formSuccessMessage: "",
  heroIntervalId: null,
  heroShowcaseIntervalId: null,
  heroShowcaseIndex: 0,
  fullGalleryCategory: "all",
  lightboxSelector:
    ".section--gallery img, .section--rooms img, .section-grid--intro img, .section-grid--events img, .section-grid--conference img, .section-grid--nature img, .gallery-page-hero img, .full-gallery-item img",
};

function getValueByPath(source, path) {
  return path.split(".").reduce((value, key) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    return value[key];
  }, source);
}

function setDocumentMeta(content) {
  document.documentElement.lang = content.site.lang || "pl";

  if (document.body.classList.contains("gallery-page")) {
    document.title = `${content.fullGallery?.title || "Galeria"} | ${content.site.brand.name || "Za Jeziorem"}`;
  } else {
    document.title = content.site.title || defaultDocumentTitle;
  }

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    const descriptionText = document.body.classList.contains("gallery-page")
      ? content.fullGallery?.lead || content.site.metaDescription || ""
      : content.site.metaDescription || "";
    description.setAttribute("content", descriptionText);
  }
}

function bindText(content) {
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = getValueByPath(content, element.dataset.content);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });
}

function bindAriaLabels(content) {
  document.querySelectorAll("[data-aria-label-content]").forEach((element) => {
    const value = getValueByPath(content, element.dataset.ariaLabelContent);
    if (typeof value === "string") {
      element.setAttribute("aria-label", value);
    }
  });
}

function bindLinks(content) {
  document.querySelectorAll("[data-link]").forEach((element) => {
    const href = getValueByPath(content, element.dataset.link);
    if (typeof href === "string") {
      element.setAttribute("href", href);
    }
  });
}

function bindImages(content) {
  document.querySelectorAll("[data-image-src]").forEach((image) => {
    const src = getValueByPath(content, image.dataset.imageSrc);
    const alt = getValueByPath(content, image.dataset.imageAlt);

    if (typeof src === "string") {
      image.setAttribute("src", src);
    }

    image.setAttribute("alt", typeof alt === "string" ? alt : "");
  });
}

function bindEmbeds(content) {
  document.querySelectorAll("[data-embed-src]").forEach((embed) => {
    const src = getValueByPath(content, embed.dataset.embedSrc);
    if (typeof src === "string") {
      embed.setAttribute("src", src);
    }
  });
}

function normalizeHeroBackground(background) {
  if (Array.isArray(background)) {
    return background.filter((item) => item && typeof item.src === "string");
  }

  if (background && typeof background.src === "string") {
    return [background];
  }

  return [];
}

function setupHeroMedia(content) {
  if (!heroMedia) {
    return;
  }

  heroMedia.innerHTML = "";

  const slides = normalizeHeroBackground(content.hero?.background);
  if (!slides.length) {
    return;
  }

  slides.forEach((slide, index) => {
    const image = document.createElement("img");
    image.className = "hero__image";
    image.src = slide.src;
    image.alt = typeof slide.alt === "string" ? slide.alt : "";
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";

    if (index === 0) {
      image.classList.add("is-active");
    }

    heroMedia.appendChild(image);
  });

  if (pageState.heroIntervalId) {
    window.clearInterval(pageState.heroIntervalId);
    pageState.heroIntervalId = null;
  }

  if (slides.length < 2 || reduceMotion.matches) {
    return;
  }

  const heroImages = heroMedia.querySelectorAll(".hero__image");
  let activeIndex = 0;

  pageState.heroIntervalId = window.setInterval(() => {
    heroImages[activeIndex].classList.remove("is-active");
    activeIndex = (activeIndex + 1) % heroImages.length;
    heroImages[activeIndex].classList.add("is-active");
  }, 4800);
}

function getHeroShowcaseSlides(content) {
  const slides = content.hero?.showcase?.slides;
  if (!Array.isArray(slides)) {
    return [];
  }

  return slides.filter((item) => item && typeof item.src === "string");
}

function renderHeroShowcaseState(index) {
  if (!heroShowcaseImage || !heroDots) {
    return;
  }

  const dots = heroDots.querySelectorAll(".hero-showcase__dot");
  const slides = getHeroShowcaseSlides(pageState.content || {});
  const activeSlide = slides[index];

  if (activeSlide) {
    heroShowcaseImage.src = activeSlide.src;
    heroShowcaseImage.alt = typeof activeSlide.alt === "string" ? activeSlide.alt : "";
  }

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
    dot.setAttribute("aria-pressed", dotIndex === index ? "true" : "false");
  });
}

function setHeroShowcaseIndex(index) {
  const slides = getHeroShowcaseSlides(pageState.content || {});
  if (!slides.length) {
    return;
  }

  pageState.heroShowcaseIndex = (index + slides.length) % slides.length;
  renderHeroShowcaseState(pageState.heroShowcaseIndex);
}

function restartHeroShowcaseInterval() {
  if (pageState.heroShowcaseIntervalId) {
    window.clearInterval(pageState.heroShowcaseIntervalId);
    pageState.heroShowcaseIntervalId = null;
  }

  const slides = getHeroShowcaseSlides(pageState.content || {});
  if (slides.length < 2 || reduceMotion.matches) {
    return;
  }

  pageState.heroShowcaseIntervalId = window.setInterval(() => {
    setHeroShowcaseIndex(pageState.heroShowcaseIndex + 1);
  }, 5200);
}

function setupHeroShowcase(content) {
  if (!heroShowcaseImage || !heroDots) {
    return;
  }

  const showcaseRoot = heroShowcaseImage.closest(".hero-showcase");
  const showcaseControls = showcaseRoot?.querySelector(".hero-showcase__controls");
  heroDots.innerHTML = "";

  const slides = getHeroShowcaseSlides(content);
  if (!slides.length) {
    if (showcaseControls) {
      showcaseControls.setAttribute("hidden", "hidden");
    }
    return;
  }

  if (showcaseControls) {
    showcaseControls.removeAttribute("hidden");
  }

  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "hero-showcase__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Pokaż zdjęcie ${index + 1}`);
    dot.addEventListener("click", () => {
      setHeroShowcaseIndex(index);
      restartHeroShowcaseInterval();
    });
    heroDots.appendChild(dot);
  });

  pageState.heroShowcaseIndex = 0;
  renderHeroShowcaseState(0);
  restartHeroShowcaseInterval();
}

function getFullGalleryItems(content) {
  const items = content.fullGallery?.items;
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item.src === "string");
}

function getFilteredFullGalleryItems() {
  const items = getFullGalleryItems(pageState.content || {});
  if (pageState.fullGalleryCategory === "all") {
    return items;
  }

  return items.filter((item) => item.category === pageState.fullGalleryCategory);
}

function syncGalleryFilterButtons() {
  galleryFilterButtons.forEach((button) => {
    const isActive = button.dataset.galleryFilter === pageState.fullGalleryCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function renderFullGallery() {
  if (!fullGalleryGrid) {
    return;
  }

  const items = getFilteredFullGalleryItems();
  fullGalleryGrid.innerHTML = "";

  items.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "full-gallery-item reveal is-visible";

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = typeof item.alt === "string" ? item.alt : "";
    image.loading = "lazy";
    image.decoding = "async";
    image.style.cursor = "zoom-in";

    const caption = document.createElement("figcaption");
    caption.textContent = typeof item.caption === "string" ? item.caption : "";

    figure.append(image, caption);
    fullGalleryGrid.appendChild(figure);
  });

  if (fullGalleryEmpty) {
    fullGalleryEmpty.hidden = items.length > 0;
  }
}

function setupGalleryFilters() {
  if (!galleryFilterButtons.length) {
    return;
  }

  galleryFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      pageState.fullGalleryCategory = button.dataset.galleryFilter || "all";
      syncGalleryFilterButtons();
      renderFullGallery();
    });
  });
}

function setupMenuLabels() {
  if (!menuToggle || !pageState.content) {
    return;
  }

  menuToggle.setAttribute(
    "aria-label",
    getValueByPath(pageState.content, menuToggle.dataset.ariaLabelOpen) || "Otwórz menu"
  );
}

function syncHeaderState() {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", window.scrollY > 32);
}

function closeMenu() {
  if (!menuToggle || !siteNav) {
    return;
  }

  menuToggle.setAttribute(
    "aria-label",
    getValueByPath(pageState.content, menuToggle.dataset.ariaLabelOpen) || "Otwórz menu"
  );
  menuToggle.setAttribute("aria-expanded", "false");
  siteNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

function openMenu() {
  if (!menuToggle || !siteNav) {
    return;
  }

  menuToggle.setAttribute(
    "aria-label",
    getValueByPath(pageState.content, menuToggle.dataset.ariaLabelClose) || "Zamknij menu"
  );
  menuToggle.setAttribute("aria-expanded", "true");
  siteNav.classList.add("is-open");
  document.body.classList.add("menu-open");
}

function setupMenu() {
  if (!menuToggle || !siteNav) {
    return;
  }

  const navLinks = siteNav.querySelectorAll("a");

  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    if (expanded) {
      closeMenu();
      return;
    }

    openMenu();
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function setupForm() {
  if (!contactForm || !feedback) {
    return;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      feedback.textContent = "";
      return;
    }

    feedback.textContent = pageState.formSuccessMessage;
    contactForm.reset();
  });
}

function setupLightbox() {
  if (!lightbox || !lightboxImage || !lightboxClose) {
    return;
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
  }

  function openLightbox(image) {
    const src = image.getAttribute("src");
    if (!src) {
      return;
    }

    lightboxImage.setAttribute("src", src);
    lightboxImage.setAttribute("alt", image.getAttribute("alt") || "");
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  }

  document.addEventListener("click", (event) => {
    const clickedImage = event.target.closest(pageState.lightboxSelector);
    if (!clickedImage) {
      return;
    }

    clickedImage.style.cursor = "zoom-in";
    openLightbox(clickedImage);
  });

  lightboxClose.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

function setupElementorOverlay() {
  if (!gridToggle) {
    return;
  }

  const inactiveLabel = "🔲 Pokaż siatkę Elementor";
  const activeLabel = "✖ Ukryj siatkę";

  gridToggle.addEventListener("click", () => {
    const isActive = document.body.classList.toggle("elementor-grid-active");
    gridToggle.textContent = isActive ? activeLabel : inactiveLabel;
    gridToggle.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function initReveal() {
  const revealItems = document.querySelectorAll(".reveal:not(.is-visible)");

  if (!reduceMotion.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealItems.forEach((item) => observer.observe(item));
    return;
  }

  revealItems.forEach((item) => item.classList.add("is-visible"));
}

function bindContent(content) {
  pageState.content = content;
  pageState.formSuccessMessage = content.contact?.form?.successMessage || "";

  setDocumentMeta(content);
  bindText(content);
  bindAriaLabels(content);
  bindLinks(content);
  bindImages(content);
  bindEmbeds(content);
  setupHeroMedia(content);
  setupHeroShowcase(content);
  renderFullGallery();
  syncGalleryFilterButtons();
  setupMenuLabels();
}

async function initPage() {
  try {
    const response = await fetch("content.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const content = await response.json();
    bindContent(content);
  } catch (error) {
    console.error("Nie udało się wczytać pliku content.json.", error);
  }

  setupMenu();
  setupForm();
  setupLightbox();
  setupGalleryFilters();
  setupElementorOverlay();
  initReveal();
  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });

  if (heroPrev) {
    heroPrev.addEventListener("click", () => {
      setHeroShowcaseIndex(pageState.heroShowcaseIndex - 1);
      restartHeroShowcaseInterval();
    });
  }

  if (heroNext) {
    heroNext.addEventListener("click", () => {
      setHeroShowcaseIndex(pageState.heroShowcaseIndex + 1);
      restartHeroShowcaseInterval();
    });
  }
}

initPage();
