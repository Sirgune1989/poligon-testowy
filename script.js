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
const guideToggleButtons = document.querySelectorAll("[data-guide-toggle]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaultDocumentTitle = document.title;
const guideModeClassMap = {
  sections: "guide-mode-sections",
  layout: "guide-mode-layout",
  metrics: "guide-mode-metrics",
  comments: "guide-mode-comments",
  styles: "guide-mode-styles",
};

const pageState = {
  content: null,
  formSuccessMessage: "",
  heroIntervalId: null,
  heroShowcaseIntervalId: null,
  heroShowcaseIndex: 0,
  lastScrollY: 0,
  fullGalleryCategory: "all",
  guideModes: {
    sections: false,
    layout: false,
    metrics: false,
    comments: false,
    styles: false,
  },
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
    image.style.objectPosition = typeof slide.position === "string" ? slide.position : "center center";
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
    figure.setAttribute("data-elementor-label", "GALLERY TILE");

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

function bindGuideControlLabels(content) {
  const controls = content.elementorGuide?.controls;
  if (!controls) {
    return;
  }

  guideToggleButtons.forEach((button) => {
    const mode = button.dataset.guideToggle;
    if (mode && typeof controls[mode] === "string") {
      button.textContent = controls[mode];
    }
  });
}

function createGuideList(items, variant = "") {
  if (!Array.isArray(items) || !items.length) {
    return null;
  }

  const list = document.createElement("ul");
  list.className = `guide-card__list${variant ? ` ${variant}` : ""}`;

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  return list;
}

function createGuideCard(title, eyebrow, description, listItems, extraNode, modifier) {
  const card = document.createElement("section");
  card.className = `guide-card ${modifier}`;

  if (eyebrow) {
    const eyebrowElement = document.createElement("p");
    eyebrowElement.className = "guide-card__eyebrow";
    eyebrowElement.textContent = eyebrow;
    card.appendChild(eyebrowElement);
  }

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);

  if (description) {
    const descriptionElement = document.createElement("p");
    descriptionElement.textContent = description;
    card.appendChild(descriptionElement);
  }

  const list = createGuideList(listItems);
  if (list) {
    card.appendChild(list);
  }

  if (extraNode) {
    card.appendChild(extraNode);
  }

  return card;
}

function createStyleTokenRow() {
  const tokens = [
    { label: "Burgund #4B1E2A", color: "#4b1e2a" },
    { label: "Złoto #C9A84C", color: "#c9a84c" },
    { label: "Zieleń #2C4A2E", color: "#2c4a2e" },
  ];

  const list = document.createElement("ul");
  list.className = "guide-card__list";

  tokens.forEach((token) => {
    const li = document.createElement("li");
    li.className = "guide-card__token";

    const swatch = document.createElement("span");
    swatch.className = "guide-card__swatch";
    swatch.style.backgroundColor = token.color;

    const label = document.createElement("span");
    label.textContent = token.label;

    li.append(swatch, label);
    list.appendChild(li);
  });

  return list;
}

function renderSectionGuides(content) {
  const guideSections = content.elementorGuide?.sections || {};
  const controls = content.elementorGuide?.controls || {};

  document.querySelectorAll("[data-guide-key]").forEach((section) => {
    section.querySelectorAll(".guide-stack").forEach((guide) => guide.remove());

    const guideData = guideSections[section.dataset.guideKey];
    if (!guideData) {
      return;
    }

    const stack = document.createElement("div");
    stack.className = "guide-stack";

    const layoutCard = createGuideCard(
      guideData.label || "SEKCJA",
      "Elementor layout",
      guideData.elementor || "",
      guideData.widgets || [],
      null,
      "guide-card--layout"
    );

    const metricsCard = createGuideCard(
      "Metryki do odtworzenia",
      "Spacing i proporcje",
      "",
      guideData.metrics || [],
      null,
      "guide-card--metrics"
    );

    const stylesCard = createGuideCard(
      "Style i tokeny",
      "Kolor / typografia",
      "",
      guideData.styles || [],
      createStyleTokenRow(),
      "guide-card--styles"
    );

    stack.append(layoutCard, metricsCard, stylesCard);

    if (typeof guideData.comment === "string" && guideData.comment) {
      const commentWrap = document.createElement("div");
      commentWrap.className = "guide-comment";

      const commentButton = document.createElement("button");
      commentButton.type = "button";
      commentButton.className = "guide-comment__toggle";
      commentButton.textContent = controls.commentButton || "Pokaż tip";
      commentButton.dataset.guideCommentButton = "true";
      commentButton.dataset.guideCommentOpen = controls.commentClose || "Ukryj tip";
      commentButton.dataset.guideCommentClosed = controls.commentButton || "Pokaż tip";

      const commentCard = document.createElement("div");
      commentCard.className = "guide-comment__card";
      commentCard.textContent = guideData.comment;

      commentWrap.append(commentButton, commentCard);
      stack.appendChild(commentWrap);
    }

    section.appendChild(stack);
  });
}

function applyGuideModes() {
  Object.entries(guideModeClassMap).forEach(([mode, className]) => {
    document.body.classList.toggle(className, pageState.guideModes[mode]);
  });

  guideToggleButtons.forEach((button) => {
    const mode = button.dataset.guideToggle;
    const isActive = Boolean(pageState.guideModes[mode]);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function setupGuideCommentToggles() {
  document.querySelectorAll("[data-guide-comment-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const wrap = button.closest(".guide-comment");
      if (!wrap) {
        return;
      }

      const isOpen = wrap.classList.toggle("is-open");
      button.textContent = isOpen ? button.dataset.guideCommentOpen : button.dataset.guideCommentClosed;
    });
  });
}

function setupGuideToggles() {
  if (!guideToggleButtons.length) {
    return;
  }

  guideToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.guideToggle;
      if (!mode || !(mode in pageState.guideModes)) {
        return;
      }

      pageState.guideModes[mode] = !pageState.guideModes[mode];
      applyGuideModes();
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

  const currentScrollY = window.scrollY || window.pageYOffset || 0;
  const nearTop = currentScrollY < 24;
  const scrollingUp = currentScrollY < pageState.lastScrollY - 4;
  const scrollingDown = currentScrollY > pageState.lastScrollY + 4;
  const menuIsOpen = document.body.classList.contains("menu-open");

  header.classList.toggle("is-scrolled", currentScrollY > 32);

  if (menuIsOpen || nearTop || scrollingUp) {
    header.classList.remove("is-hidden");
  } else if (scrollingDown && currentScrollY > 120) {
    header.classList.add("is-hidden");
  }

  pageState.lastScrollY = currentScrollY;
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
  header?.classList.remove("is-hidden");
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
  bindGuideControlLabels(content);
  renderSectionGuides(content);
  setupGuideCommentToggles();
  applyGuideModes();
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
  setupGuideToggles();
  initReveal();
  pageState.lastScrollY = window.scrollY || window.pageYOffset || 0;
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
