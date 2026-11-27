document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const closeNav = () => {
    if (!navToggle || !nav) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  };

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) closeNav();
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      closeNav();
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  const sections = Array.from(document.querySelectorAll("main section[id]"));

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${visible.target.id}`;
          link.classList.toggle("active", isActive);
          if (isActive) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  const setupAjaxForm = (formId, statusId, { successMessage, failureMessage, validate }) => {
    const form = document.getElementById(formId);
    const formStatus = document.getElementById(statusId);
    if (!form || !formStatus) return;

    const clearStatus = () => {
      formStatus.textContent = "";
      formStatus.classList.remove("is-success", "is-error");
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearStatus();

      if (validate) {
        const validationMessage = validate(form);
        if (validationMessage) {
          formStatus.textContent = validationMessage;
          formStatus.classList.add("is-error");
          return;
        }
      }

      if (!form.checkValidity()) {
        formStatus.textContent = "Please complete all required fields.";
        formStatus.classList.add("is-error");
        form.reportValidity();
        return;
      }

      formStatus.textContent = "Sending...";

      try {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
          } else {
            data[key] = value;
          }
        });

        const response = await fetch(form.action || "https://formspree.io/f/xgakdzav", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Form submission failed");

        formStatus.textContent = successMessage;
        formStatus.classList.add("is-success");
        form.reset();
        form.dispatchEvent(new Event("reset"));
      } catch {
        formStatus.textContent = failureMessage;
        formStatus.classList.add("is-error");
      }
    });

    form.addEventListener("input", () => {
      if (formStatus.classList.contains("is-success") || formStatus.classList.contains("is-error")) {
        clearStatus();
      }
    });
  };

  setupAjaxForm("contact-form", "form-status", {
    successMessage: "Thanks, I'll reply within 48 hours",
    failureMessage:
      "Sorry, your message couldn't be sent. Please email me at ruchuraphael8@gmail.com and I'll reply as soon as I can.",
  });

  setupAjaxForm("writer-form", "writer-form-status", {
    successMessage: "Thanks, we'll review your application and reply within 7 days",
    failureMessage:
      "Sorry, your application couldn't be sent. Please email your application to ruchuraphael8@gmail.com and we'll review it as soon as we can.",
    validate: (form) => {
      const specialties = form.querySelectorAll('input[name="specialties"]:checked');
      if (specialties.length === 0) return "Please select at least one specialty.";
      const portfolio = form.querySelector("#writer-portfolio-1");
      if (portfolio && !portfolio.value.trim()) return "Please provide at least one portfolio link.";
      return "";
    },
  });

  const writerBio = document.getElementById("writer-bio");
  const bioCounter = document.getElementById("bio-counter");
  if (writerBio && bioCounter) {
    const updateBioCounter = () => {
      const length = writerBio.value.length;
      bioCounter.textContent = `${length}/500`;
      bioCounter.classList.toggle("is-limit", length >= 500);
    };
    writerBio.addEventListener("input", updateBioCounter);
    writerBio.form?.addEventListener("reset", () => {
      setTimeout(updateBioCounter, 0);
    });
    updateBioCounter();
  }

  const sampleModal = document.getElementById("sample-modal");
  const modalCategory = document.getElementById("sample-modal-category");
  const modalTitle = document.getElementById("sample-modal-title");
  const modalBody = document.getElementById("sample-modal-body");
  const modalClose = sampleModal?.querySelector(".sample-modal-close");
  let lastFocused = null;

  const closeSample = () => {
    if (!sampleModal || sampleModal.hidden) return;
    sampleModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocused) lastFocused.focus();
  };

  document.querySelectorAll(".portfolio-card-hit").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".portfolio-card");
      const fullText = card?.querySelector(".sample-full");
      if (!sampleModal || !card || !fullText) return;

      lastFocused = button;
      modalCategory.textContent = card.querySelector(".tag")?.textContent ?? "";
      modalTitle.textContent = card.querySelector("h3")?.textContent ?? "";
      modalBody.replaceChildren(
        ...Array.from(fullText.children, (paragraph) => paragraph.cloneNode(true))
      );
      sampleModal.hidden = false;
      document.body.classList.add("modal-open");
      modalClose?.focus();
    });
  });

  if (sampleModal) {
    sampleModal.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-modal]")) closeSample();
    });

    sampleModal.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        modalClose?.focus();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSample();
  });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const reveals = Array.from(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    reveals.forEach((element) => revealObserver.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }
});
