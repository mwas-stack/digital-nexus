const FORMSPREE_URL = "https://formspree.io/f/xgakdzav";
const SUPPORT_EMAIL = "ruchuraphael8@gmail.com";

async function fetchApprovedWriters() {
  const db = window.nexusDb;
  if (!db) throw new Error("Supabase is unavailable");

  const { data, error } = await db
    .from("profiles")
    .select("id,name,headline,location,specialties,bio,availability,samples,status")
    .eq("status", "approved");

  if (error) throw error;

  return (data || []).filter(
    (writer) => writer && writer.status === "approved" && writer.id && writer.name
  );
}

function getInitials(name) {
  return String(name)
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

function createCard(writer) {
  const card = document.createElement("a");
  card.className = "writer-card";
  card.href = `writer.html?id=${encodeURIComponent(writer.id)}`;
  card.setAttribute("aria-label", `View profile for ${writer.name}`);

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
  headline.textContent = writer.headline || "";

  const location = document.createElement("p");
  location.className = "writer-location";
  location.textContent = writer.location || "";

  const tags = document.createElement("div");
  tags.className = "writer-tags";
  (Array.isArray(writer.specialties) ? writer.specialties : []).forEach((specialty) => {
    tags.append(createTag(specialty));
  });

  const label = document.createElement("p");
  label.className = "sample-label";
  label.textContent = "Digital Nexus writer";

  top.append(avatar, createBadge(writer.availability));
  card.append(top, heading, headline, location, tags, label);
  return card;
}

function initDirectory() {
  const grid = document.getElementById("writer-grid");
  const status = document.getElementById("writers-status");
  const search = document.getElementById("writer-search");
  const count = document.getElementById("results-count");
  const empty = document.getElementById("writer-empty");
  const emptyHeading = document.getElementById("empty-heading");
  const emptyText = document.getElementById("empty-text");
  const emptyJoin = document.getElementById("empty-join");
  const clearButton = document.getElementById("clear-filters");
  const chips = Array.from(document.querySelectorAll(".filter-chip"));
  let writers = [];
  let loaded = false;

  const render = () => {
    const query = search.value.trim().toLowerCase();
    const selected = chips.find((chip) => chip.getAttribute("aria-pressed") === "true");
    const specialty = selected ? selected.dataset.specialty : "";

    const matches = writers.filter((writer) => {
      const matchesQuery =
        !query ||
        String(writer.name).toLowerCase().includes(query) ||
        String(writer.headline || "").toLowerCase().includes(query);
      const matchesSpecialty =
        !specialty || (Array.isArray(writer.specialties) && writer.specialties.includes(specialty));
      return matchesQuery && matchesSpecialty;
    });

    grid.replaceChildren(...matches.map(createCard));
    count.textContent = `${matches.length} of ${writers.length} writers shown`;

    const isEmpty = matches.length === 0;
    empty.hidden = !isEmpty;
    if (isEmpty) {
      if (loaded && writers.length === 0) {
        emptyHeading.textContent = "No writers listed yet";
        emptyText.textContent =
          "There are no approved writer profiles in the directory yet. Join the network to be one of the first.";
        emptyJoin.hidden = false;
        clearButton.hidden = true;
      } else {
        emptyHeading.textContent = "No writers match those filters";
        emptyText.textContent =
          "Try another name or headline, or choose a different specialty.";
        emptyJoin.hidden = true;
        clearButton.hidden = false;
      }
    }
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

  fetchApprovedWriters()
    .then((list) => {
      writers = list;
      loaded = true;
      status.hidden = true;
      render();
    })
    .catch(() => {
      status.textContent =
        "The directory couldn't be loaded. Check your connection and refresh the page.";
    });
}

function renderProfile(writer, sidebar, main) {
  const avatar = document.createElement("div");
  avatar.className = "writer-avatar writer-avatar--large";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = getInitials(writer.name);

  const label = document.createElement("p");
  label.className = "sample-label";
  label.textContent = "Digital Nexus writer";

  const heading = document.createElement("h1");
  heading.textContent = writer.name;

  const headline = document.createElement("p");
  headline.className = "profile-headline";
  headline.textContent = writer.headline || "";

  const meta = document.createElement("div");
  meta.className = "profile-meta";

  const locationRow = document.createElement("div");
  locationRow.className = "profile-meta-row";
  const locationLabel = document.createElement("span");
  locationLabel.className = "detail-label";
  locationLabel.textContent = "Location";
  const locationValue = document.createElement("span");
  locationValue.textContent = writer.location || "";
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
  (Array.isArray(writer.specialties) ? writer.specialties : []).forEach((specialty) => {
    tags.append(createTag(specialty));
  });

  const requestButton = document.createElement("button");
  requestButton.type = "button";
  requestButton.className = "btn btn--gold";
  requestButton.id = "request-button";
  requestButton.textContent = "Request this writer";

  sidebar.replaceChildren(avatar, label, heading, headline, meta, tags, requestButton);

  const about = document.createElement("section");
  about.className = "profile-panel";
  const aboutHeading = document.createElement("h2");
  aboutHeading.textContent = "About";
  const bio = document.createElement("p");
  bio.className = "profile-bio";
  bio.textContent = writer.bio || "";
  about.append(aboutHeading, bio);

  const samplesPanel = document.createElement("section");
  samplesPanel.className = "profile-panel";
  const samplesHeading = document.createElement("h2");
  samplesHeading.textContent = "Writing samples";
  const samplesIntro = document.createElement("p");
  samplesIntro.className = "profile-bio";
  samplesIntro.textContent = "Sample pieces shared by this writer.";
  const sampleList = document.createElement("div");
  sampleList.className = "sample-list";

  (Array.isArray(writer.samples) ? writer.samples : []).forEach((sample) => {
    const article = document.createElement("article");
    article.className = "sample-card";
    const category = createTag(sample.category || "");
    const title = document.createElement("h3");
    title.textContent = sample.title || "";
    const excerpt = document.createElement("p");
    excerpt.textContent = sample.excerpt || "";
    const sampleLabel = document.createElement("p");
    sampleLabel.className = "sample-label";
    sampleLabel.textContent = "Writing sample";
    article.append(category, title, excerpt, sampleLabel);
    sampleList.append(article);
  });

  if (sampleList.childElementCount === 0) {
    const none = document.createElement("p");
    none.className = "profile-bio";
    none.textContent = "This writer hasn't shared any samples yet.";
    sampleList.append(none);
  }

  samplesPanel.append(samplesHeading, samplesIntro, sampleList);
  main.replaceChildren(about, samplesPanel);
}

function initProfile() {
  const status = document.getElementById("profile-status");
  const content = document.getElementById("profile-content");
  const notFound = document.getElementById("profile-not-found");
  const sidebar = document.getElementById("profile-sidebar");
  const main = document.getElementById("profile-main");

  fetchApprovedWriters()
    .then((writers) => {
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
    })
    .catch(() => {
      status.textContent =
        "We couldn't load this profile. Check your connection and refresh the page.";
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
  const emailInput = document.getElementById("request-email");
  const briefInput = document.getElementById("request-brief");
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
    ).filter((element) => !element.disabled && element.type !== "hidden");
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

    const clientName = nameInput.value.trim();
    const clientEmail = emailInput.value.trim();
    const brief = briefInput.value.trim();

    if (!clientName || clientName.length > 100) {
      return setStatus("Please enter a name of 100 characters or fewer.", "is-error");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) || clientEmail.length > 254) {
      return setStatus("Please enter a valid email address.", "is-error");
    }
    if (!brief) return setStatus("Please add a short project brief.", "is-error");
    if (brief.length > 2000) {
      return setStatus("Please keep your brief under 2000 characters.", "is-error");
    }
    if (!form.checkValidity()) {
      return setStatus("Please check the form and try again.", "is-error");
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus("Sending your request…", "");

    try {
      if (!window.nexusDb) throw new Error("Supabase is unavailable");
      const { error } = await window.nexusDb.from("requests").insert({
        writer_id: writer.id,
        client_name: clientName,
        client_email: clientEmail,
        brief,
      });
      if (error) throw error;
    } catch {
      setStatus(
        "Sorry, your request couldn't be sent. Please email ",
        "is-error",
        true
      );
      submitButton.disabled = false;
      submitButton.textContent = "Send request";
      return;
    }

    try {
      await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_type: "writer-request",
          writer_id: writer.id,
          writer_name: writer.name,
          name: clientName,
          email: clientEmail,
          project_brief: brief,
        }),
      });
    } catch {
      // Email notification is best-effort; the request is already saved.
    }

    form.reset();
    idInput.value = writer.id;
    nameField.value = writer.name;
    setStatus(
      `Thanks, your request for ${writer.name} has been sent. We'll reply within 48 hours.`,
      "is-success"
    );
    submitButton.disabled = false;
    submitButton.textContent = "Send request";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("writer-grid")) initDirectory();
  if (document.getElementById("profile-content")) initProfile();
});
