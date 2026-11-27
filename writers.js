const FORMSPREE_URL = "https://formspree.io/f/xgakdzav";
const SUPPORT_EMAIL = "ruchuraphael8@gmail.com";

// Used only when writers.json cannot be fetched (for example, opening a page directly from disk).
const FALLBACK_WRITERS = [
  {
    id: "amara-okoye",
    name: "Amara Okoye",
    headline: "Long-form storyteller for purpose-driven brands",
    location: "Nairobi, Kenya",
    specialties: ["Content writing", "Business content"],
    bio: "Amara turns complex ideas into warm, readable stories. She has spent eight years shaping blog posts, guides and brand narratives for fictional startups, always starting with the reader's question and ending with a clear next step. Her work balances research, rhythm and voice.",
    availability: "Open to projects",
    sample: true,
    samples: [
      {
        title: "Why the Rooftop Garden Mattered",
        category: "Content writing",
        excerpt: "A fictional city apartment block discovers that a patch of rooftop greenery can change how neighbours talk, cook and spend their evenings.",
      },
      {
        title: "Annual Review, Minus the Jargon",
        category: "Business content",
        excerpt: "A sample report that turns a fictional foundation's dense year-end data into three clear priorities and one honest lesson.",
      },
    ],
  },
  {
    id: "noor-wanjiku",
    name: "Noor Wanjiku",
    headline: "Social copy that sounds human and converts",
    location: "Mombasa, Kenya",
    specialties: ["Social media copy", "Content writing"],
    bio: "Noor writes captions and campaigns that feel like a conversation, not an advert. She plans calendars, tests hooks and finds the line between playful and persuasive. Her sample work covers food delivery, travel and lifestyle brands, with every post built for a real audience.",
    availability: "Open to projects",
    sample: true,
    samples: [
      {
        title: "Five Captions for Kijani Kitchen",
        category: "Social media copy",
        excerpt: "Short, warm launch posts for a fictional meal-prep service, each built around a different moment in a busy working week.",
      },
      {
        title: "A Travel Guide People Actually Finish",
        category: "Content writing",
        excerpt: "A sample city guide for a fictional tourism brand, organised by mood and journey length rather than by listicle length.",
      },
    ],
  },
  {
    id: "kofi-mensah",
    name: "Kofi Mensah",
    headline: "Product copy that makes features feel useful",
    location: "Kampala, Uganda",
    specialties: ["Product descriptions", "Content writing"],
    bio: "Kofi writes product descriptions that answer the questions shoppers actually ask. He turns specifications into everyday benefits, keeps tone consistent across catalogues and never buries the detail that seals a decision. His sample catalogue work spans outdoor gear, skincare and home goods.",
    availability: "Booked",
    sample: true,
    samples: [
      {
        title: "Savanna Trail 20L Daypack",
        category: "Product descriptions",
        excerpt: "A sample catalogue entry that turns water-resistant fabric and padded straps into reasons to carry the bag every single day.",
      },
      {
        title: "The Skincare Ingredients Page",
        category: "Content writing",
        excerpt: "A fictional brand's ingredient guide that explains each active in plain language without making promises it cannot keep.",
      },
    ],
  },
  {
    id: "sera-njoroge",
    name: "Sera Njoroge",
    headline: "Clear business content for technical teams",
    location: "Kisumu, Kenya",
    specialties: ["Business content", "Social media copy", "Product descriptions"],
    bio: "Sera makes dense business material easy to act on. From proposals and reports to internal updates and launch pages, she strips out jargon without losing accuracy. She enjoys working with technical teams and borrowing their precision to build content people trust.",
    availability: "Open to projects",
    sample: true,
    samples: [
      {
        title: "Inside the BrightPath Logistics Update",
        category: "Business content",
        excerpt: "A sample internal briefing that explains a fictional delivery-platform change to drivers, dispatchers and customer support in one page.",
      },
      {
        title: "The Luma Desk Lamp Listing",
        category: "Product descriptions",
        excerpt: "A sample product page for a fictional lamp that leads with the light you get, then covers dimming, reach and setup.",
      },
    ],
  },
];

async function loadWriters() {
  try {
    const response = await fetch("writers.json", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Directory request failed: ${response.status}`);
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.writers;
    if (!Array.isArray(list) || list.length === 0) throw new Error("Directory is empty");
    return list;
  } catch {
    return FALLBACK_WRITERS;
  }
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = text;
  return tag;
}

function createBadge(availability) {
  const badge = document.createElement("span");
  badge.className =
    availability === "Open to projects" ? "badge badge--open" : "badge badge--booked";
  badge.textContent = availability;
  return badge;
}

function initDirectory() {
  const grid = document.getElementById("writer-grid");
  const status = document.getElementById("writers-status");
  const search = document.getElementById("writer-search");
  const count = document.getElementById("results-count");
  const empty = document.getElementById("writer-empty");
  const clearButton = document.getElementById("clear-filters");
  const chips = Array.from(document.querySelectorAll(".filter-chip"));
  let writers = [];

  const render = () => {
    const query = search.value.trim().toLowerCase();
    const selected = chips.find((chip) => chip.getAttribute("aria-pressed") === "true");
    const specialty = selected ? selected.dataset.specialty : "";

    const matches = writers.filter((writer) => {
      const matchesQuery =
        !query ||
        writer.name.toLowerCase().includes(query) ||
        writer.headline.toLowerCase().includes(query);
      const matchesSpecialty = !specialty || writer.specialties.includes(specialty);
      return matchesQuery && matchesSpecialty;
    });

    grid.replaceChildren(...matches.map(createCard));
    empty.hidden = matches.length > 0;
    count.textContent = `${matches.length} of ${writers.length} sample profiles`;
  };

  search.addEventListener("input", render);

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((other) => other.setAttribute("aria-pressed", String(other === chip)));
      render();
    });
  });

  clearButton.addEventListener("click", () => {
    search.value = "";
    chips.forEach((chip, index) => chip.setAttribute("aria-pressed", String(index === 0)));
    render();
    search.focus();
  });

  loadWriters().then((list) => {
    writers = list;
    status.hidden = true;
    render();
  });
}

function createCard(writer) {
  const card = document.createElement("a");
  card.className = "writer-card";
  card.href = `writer.html?id=${encodeURIComponent(writer.id)}`;
  card.setAttribute("aria-label", `View sample profile for ${writer.name}`);

  const top = document.createElement("div");
  top.className = "writer-card-top";

  const avatar = document.createElement("span");
  avatar.className = "writer-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = getInitials(writer.name);

  const heading = document.createElement("h2");
  heading.textContent = writer.name;

  const headline = document.createElement("p");
  headline.className = "writer-headline";
  headline.textContent = writer.headline;

  const location = document.createElement("p");
  location.className = "writer-location";
  location.textContent = writer.location;

  const tags = document.createElement("div");
  tags.className = "writer-tags";
  writer.specialties.forEach((specialty) => tags.append(createTag(specialty)));

  const sampleLabel = document.createElement("p");
  sampleLabel.className = "sample-label";
  sampleLabel.textContent = "Sample profile";

  top.append(avatar, createBadge(writer.availability));
  card.append(top, heading, headline, location, tags, sampleLabel);
  return card;
}

function renderProfile(writer, sidebar, main) {
  const avatar = document.createElement("div");
  avatar.className = "writer-avatar writer-avatar--large";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = getInitials(writer.name);

  const sampleLabel = document.createElement("p");
  sampleLabel.className = "sample-label";
  sampleLabel.textContent = "Sample profile";

  const heading = document.createElement("h1");
  heading.id = "profile-name";
  heading.textContent = writer.name;

  const headline = document.createElement("p");
  headline.className = "profile-headline";
  headline.textContent = writer.headline;

  const meta = document.createElement("div");
  meta.className = "profile-meta";

  const locationRow = document.createElement("div");
  locationRow.className = "profile-meta-row";
  const locationLabel = document.createElement("span");
  locationLabel.className = "detail-label";
  locationLabel.textContent = "Location";
  const locationValue = document.createElement("span");
  locationValue.textContent = writer.location;
  locationRow.append(locationLabel, locationValue);

  const availabilityRow = document.createElement("div");
  availabilityRow.className = "profile-meta-row";
  const availabilityLabel = document.createElement("span");
  availabilityLabel.className = "detail-label";
  availabilityLabel.textContent = "Availability";
  availabilityRow.append(availabilityLabel, createBadge(writer.availability));
  meta.append(locationRow, availabilityRow);

  const tags = document.createElement("div");
  tags.className = "writer-tags";
  writer.specialties.forEach((specialty) => tags.append(createTag(specialty)));

  const requestButton = document.createElement("button");
  requestButton.type = "button";
  requestButton.className = "btn btn--gold";
  requestButton.id = "request-button";
  requestButton.textContent = "Request this writer";

  sidebar.replaceChildren(avatar, sampleLabel, heading, headline, meta, tags, requestButton);

  const about = document.createElement("section");
  about.className = "profile-panel";
  about.setAttribute("aria-labelledby", "about-heading");
  const aboutHeading = document.createElement("h2");
  aboutHeading.id = "about-heading";
  aboutHeading.textContent = "About";
  const bio = document.createElement("p");
  bio.className = "profile-bio";
  bio.textContent = writer.bio;
  about.append(aboutHeading, bio);

  const samplesPanel = document.createElement("section");
  samplesPanel.className = "profile-panel";
  samplesPanel.setAttribute("aria-labelledby", "samples-heading");
  const samplesHeading = document.createElement("h2");
  samplesHeading.id = "samples-heading";
  samplesHeading.textContent = "Writing samples";
  const samplesIntro = document.createElement("p");
  samplesIntro.className = "profile-bio";
  samplesIntro.textContent = "Two fictional excerpts that show the range of this sample profile.";
  const sampleList = document.createElement("div");
  sampleList.className = "sample-list";

  writer.samples.forEach((sample) => {
    const article = document.createElement("article");
    article.className = "sample-card";
    const category = createTag(sample.category);
    const title = document.createElement("h3");
    title.textContent = sample.title;
    const excerpt = document.createElement("p");
    excerpt.textContent = sample.excerpt;
    const label = document.createElement("p");
    label.className = "sample-label";
    label.textContent = "Sample excerpt · fictional brand";
    article.append(category, title, excerpt, label);
    sampleList.append(article);
  });

  samplesPanel.append(samplesHeading, samplesIntro, sampleList);
  main.replaceChildren(about, samplesPanel);
}

function initProfile() {
  const status = document.getElementById("profile-status");
  const content = document.getElementById("profile-content");
  const notFound = document.getElementById("profile-not-found");
  const sidebar = document.getElementById("profile-sidebar");
  const main = document.getElementById("profile-main");

  loadWriters().then((writers) => {
    const id = new URLSearchParams(window.location.search).get("id");
    const writer = writers.find((entry) => entry.id === id);
    status.hidden = true;

    if (!writer) {
      notFound.hidden = false;
      document.title = "Writer not found | Digital Nexus";
      return;
    }

    renderProfile(writer, sidebar, main);
    content.hidden = false;
    document.title = `${writer.name} | Digital Nexus Writers`;
    setupRequestForm(writer);
  });
}

function setupRequestForm(writer) {
  const openButton = document.getElementById("request-button");
  const modal = document.getElementById("request-modal");
  const closeButton = document.getElementById("request-close");
  const form = document.getElementById("request-form");
  const status = document.getElementById("request-status");
  const submitButton = document.getElementById("request-submit");
  const context = document.getElementById("request-context");
  const nameInput = document.getElementById("request-name");
  const idInput = document.getElementById("request-writer-id");
  const nameField = document.getElementById("request-writer-name");
  let lastFocused = null;

  const clearStatus = () => {
    status.textContent = "";
    status.className = "form-status";
  };

  const setStatus = (message, className, withEmail = false) => {
    status.textContent = message;
    status.className = `form-status${className ? ` ${className}` : ""}`;
    if (withEmail) {
      const link = document.createElement("a");
      link.href = `mailto:${SUPPORT_EMAIL}`;
      link.textContent = SUPPORT_EMAIL;
      status.append(" ", link);
    }
  };

  const closeModal = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocused) lastFocused.focus();
  };

  openButton.addEventListener("click", () => {
    lastFocused = document.activeElement;
    idInput.value = writer.id;
    nameField.value = writer.name;
    context.textContent = `Tell us about your project with ${writer.name} and we'll pass your brief along.`;
    clearStatus();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    nameInput.focus();
  });

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-request]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      modal.querySelectorAll("button, input, textarea, a[href]")
    ).filter((element) => !element.disabled);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  form.addEventListener("input", () => {
    if (status.classList.contains("is-success") || status.classList.contains("is-error")) {
      clearStatus();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();

    if (!form.checkValidity()) {
      setStatus("Please complete all required fields.", "is-error");
      form.reportValidity();
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.form_type = "writer-request";
    payload.writer_id = writer.id;
    payload.writer_name = writer.name;

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus("Sending your request…", "");

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      form.reset();
      idInput.value = writer.id;
      nameField.value = writer.name;
      setStatus(
        `Thanks, your request for ${writer.name} has been sent. We'll reply within 48 hours.`,
        "is-success"
      );
    } catch {
      setStatus(
        "Sorry, your request couldn't be sent. Please email ",
        "is-error",
        true
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send request";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("writer-grid")) initDirectory();
  if (document.getElementById("profile-content")) initProfile();
});
