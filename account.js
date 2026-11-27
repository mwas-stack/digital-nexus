(function () {
  const SPECIALTIES = [
    "Content writing",
    "Social media copy",
    "Product descriptions",
    "Business content",
  ];
  const AVAILABILITY = ["Open to projects", "Booked"];

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("auth-card")) initLogin();
    if (document.getElementById("dashboard-app")) initDashboard();
  });

  const setMessage = (element, message, kind) => {
    element.textContent = message;
    element.className = `form-status${kind ? ` ${kind}` : ""}`;
  };

  const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

  const lengthError = (value, max, label) =>
    String(value).length > max ? `${label} must be ${max} characters or fewer.` : "";

  function friendlyAuthError(error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("invalid login credentials")) {
      return "That email or password doesn't look right. Try again or use Forgot password.";
    }
    if (message.includes("email not confirmed")) {
      return "Please confirm your email address before logging in. Check your inbox for the link.";
    }
    if (message.includes("already registered") || message.includes("already exists")) {
      return "An account with that email already exists. Log in instead.";
    }
    if (message.includes("password") && message.includes("weak")) {
      return "Please choose a stronger password of at least 8 characters.";
    }
    if (message.includes("rate limit") || message.includes("too many")) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    if (message.includes("failed to fetch") || message.includes("network")) {
      return "We couldn't reach the account service. Check your connection and try again.";
    }
    return "Something went wrong. Please try again.";
  }

  function initLogin() {
    const client = window.nexusDb;
    const status = document.getElementById("auth-status");
    const tabs = Array.from(document.querySelectorAll("[data-auth-tab]"));
    const panels = {
      signup: document.getElementById("panel-signup"),
      login: document.getElementById("panel-login"),
      reset: document.getElementById("panel-reset"),
    };
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");
    const resetForm = document.getElementById("reset-form");

    const showPanel = (name) => {
      Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== name;
      });
      tabs.forEach((tab) => {
        tab.setAttribute("aria-selected", String(tab.dataset.authTab === name));
      });
      setMessage(status, "", "");
      const firstInput = panels[name]?.querySelector("input");
      if (firstInput) firstInput.focus();
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => showPanel(tab.dataset.authTab));
    });
    document.getElementById("show-reset").addEventListener("click", () => showPanel("reset"));
    document.getElementById("back-to-login").addEventListener("click", () => showPanel("login"));

    if (!client) {
      setMessage(status, "Accounts aren't available right now. Please refresh the page.", "is-error");
      [signupForm, loginForm, resetForm].forEach((form) => {
        form.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
      });
      return;
    }

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(status, "", "");

      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;

      if (!name) return setMessage(status, "Please enter your name.", "is-error");
      const nameIssue = lengthError(name, 100, "Name");
      if (nameIssue) return setMessage(status, nameIssue, "is-error");
      if (!validEmail(email)) return setMessage(status, "Please enter a valid email address.", "is-error");
      if (password.length < 8) {
        return setMessage(status, "Your password must be at least 8 characters.", "is-error");
      }
      if (password.length > 128) {
        return setMessage(status, "Your password must be 128 characters or fewer.", "is-error");
      }

      setMessage(status, "Creating your account…", "");
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: new URL("login.html", window.location.href).href,
        },
      });

      if (error) return setMessage(status, friendlyAuthError(error), "is-error");

      if (data.session) {
        window.location.assign("dashboard.html");
        return;
      }

      setMessage(
        status,
        "Account created. Check your email to confirm your address, then log in.",
        "is-success"
      );
      showPanel("login");
      document.getElementById("login-email").value = email;
      setMessage(
        status,
        "Account created. Check your email to confirm your address, then log in.",
        "is-success"
      );
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(status, "", "");

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      if (!validEmail(email)) return setMessage(status, "Please enter a valid email address.", "is-error");
      if (!password) return setMessage(status, "Please enter your password.", "is-error");

      setMessage(status, "Logging in…", "");
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return setMessage(status, friendlyAuthError(error), "is-error");
      window.location.assign("dashboard.html");
    });

    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(status, "", "");
      const email = document.getElementById("reset-email").value.trim();
      if (!validEmail(email)) return setMessage(status, "Please enter a valid email address.", "is-error");

      setMessage(status, "Sending reset link…", "");
      const redirectTo = new URL("login.html", window.location.href).href;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return setMessage(status, friendlyAuthError(error), "is-error");
      setMessage(
        status,
        "If that email has an account, we've sent a reset link. Check your inbox.",
        "is-success"
      );
    });
  }

  function initDashboard() {
    const client = window.nexusDb;
    const loading = document.getElementById("dashboard-loading");
    const app = document.getElementById("dashboard-app");
    const profileStatus = document.getElementById("profile-status");
    const requestsStatus = document.getElementById("requests-status");
    const badge = document.getElementById("profile-badge");
    const form = document.getElementById("profile-form");
    const bio = document.getElementById("profile-bio");
    const counter = document.getElementById("bio-counter");
    const sampleTitles = [1, 2, 3].map((index) =>
      document.getElementById(`sample-title-${index}`)
    );
    const sampleCategories = [1, 2, 3].map((index) =>
      document.getElementById(`sample-category-${index}`)
    );
    const sampleExcerpts = [1, 2, 3].map((index) =>
      document.getElementById(`sample-excerpt-${index}`)
    );
    let currentUser = null;
    let currentProfile = null;

    const updateCounter = () => {
      const length = bio.value.length;
      counter.textContent = `${length}/800`;
      counter.classList.toggle("is-limit", length >= 800);
    };
    bio.addEventListener("input", updateCounter);
    updateCounter();

    if (!client) {
      loading.textContent = "Accounts aren't available right now. Please refresh the page.";
      return;
    }

    const updateBadge = (status) => {
      const live = status === "approved";
      badge.textContent = live ? "Live" : "Pending approval";
      badge.className = `status-badge ${live ? "status-badge--live" : "status-badge--pending"}`;
    };

    const fillForm = (profile) => {
      document.getElementById("profile-name").value = profile.name || "";
      document.getElementById("profile-headline").value = profile.headline || "";
      document.getElementById("profile-location").value = profile.location || "";
      document.querySelectorAll('input[name="specialties"]').forEach((checkbox) => {
        const selected = Array.isArray(profile.specialties) ? profile.specialties : [];
        checkbox.checked = selected.includes(checkbox.value);
      });
      bio.value = profile.bio || "";
      updateCounter();
      document.getElementById("profile-availability").value = AVAILABILITY.includes(
        profile.availability
      )
        ? profile.availability
        : "Booked";

      const samples = Array.isArray(profile.samples) ? profile.samples.slice(0, 3) : [];
      sampleTitles.forEach((input, index) => {
        input.value = samples[index]?.title || "";
      });
      sampleCategories.forEach((select, index) => {
        const category = samples[index]?.category;
        select.value = SPECIALTIES.includes(category) ? category : SPECIALTIES[0];
      });
      sampleExcerpts.forEach((input, index) => {
        input.value = samples[index]?.excerpt || "";
      });
      updateBadge(profile.status);
    };

    const readForm = () => {
      const samples = [];
      for (let index = 0; index < 3; index += 1) {
        const title = sampleTitles[index].value.trim();
        const excerpt = sampleExcerpts[index].value.trim();
        if (!title && !excerpt) continue;
        samples.push({
          title,
          category: sampleCategories[index].value,
          excerpt,
        });
      }
      return {
        name: document.getElementById("profile-name").value.trim(),
        headline: document.getElementById("profile-headline").value.trim(),
        location: document.getElementById("profile-location").value.trim(),
        specialties: Array.from(document.querySelectorAll('input[name="specialties"]:checked')).map(
          (checkbox) => checkbox.value
        ),
        bio: bio.value.trim(),
        availability: document.getElementById("profile-availability").value,
        samples,
      };
    };

    const validateProfile = (profile) => {
      if (!profile.name) return "Please add your name.";
      const checks = [
        lengthError(profile.name, 100, "Name"),
        lengthError(profile.headline, 140, "Headline"),
        lengthError(profile.location, 100, "Location"),
        lengthError(profile.bio, 800, "Bio"),
      ];
      profile.samples.forEach((sample, index) => {
        checks.push(lengthError(sample.title, 120, `Sample ${index + 1} title`));
        checks.push(lengthError(sample.excerpt, 300, `Sample ${index + 1} excerpt`));
        if (!sample.title || !sample.excerpt) {
          checks.push(`Sample ${index + 1} needs both a title and an excerpt, or neither.`);
        }
      });
      return checks.find(Boolean) || "";
    };

    const renderRequests = (rows) => {
      const list = document.getElementById("requests-list");
      if (rows.length === 0) {
        const empty = document.createElement("p");
        empty.className = "requests-empty";
        empty.textContent =
          "No requests yet. Client requests will appear here as soon as they arrive.";
        list.replaceChildren(empty);
        return;
      }

      list.replaceChildren(
        ...rows.map((row) => {
          const article = document.createElement("article");
          article.className = "request-card";

          const top = document.createElement("div");
          top.className = "request-card-top";
          const name = document.createElement("strong");
          name.textContent = row.client_name || "Client";
          const dateValue = row.created_at || row.created || row.inserted_at;
          const date = document.createElement("time");
          if (dateValue) {
            const parsed = new Date(dateValue);
            date.textContent = Number.isNaN(parsed.getTime())
              ? String(dateValue).slice(0, 10)
              : parsed.toLocaleDateString();
          } else {
            date.textContent = "Date not recorded";
          }
          top.append(name, date);

          const contact = document.createElement("p");
          contact.className = "request-contact";
          if (validEmail(String(row.client_email || ""))) {
            const link = document.createElement("a");
            link.href = `mailto:${row.client_email}`;
            link.textContent = row.client_email;
            contact.append(link);
          } else {
            contact.textContent = row.client_email || "No email provided";
          }

          const brief = document.createElement("p");
          brief.className = "request-brief";
          brief.textContent = row.brief || "";

          article.append(top, contact, brief);
          return article;
        })
      );
    };

    const loadProfile = async () => {
      setMessage(profileStatus, "Loading your profile…", "");
      const select =
        "id,name,headline,location,specialties,bio,availability,samples,status";
      const { data, error } = await client
        .from("profiles")
        .select(select)
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        setMessage(profileStatus, "We couldn't load your profile. Refresh the page to try again.", "is-error");
        return;
      }

      let profile = data;
      if (!profile) {
        const created = await client
          .from("profiles")
          .insert({
            id: currentUser.id,
            name: currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "New writer",
            headline: "",
            location: "",
            specialties: [],
            bio: "",
            availability: "Booked",
            samples: [],
          })
          .select(select)
          .single();
        if (created.error || !created.data) {
          setMessage(
            profileStatus,
            "We couldn't create your writer profile. Please refresh and try again.",
            "is-error"
          );
          return;
        }
        profile = created.data;
      }

      currentProfile = profile;
      fillForm(profile);
      setMessage(profileStatus, "", "");
    };

    const loadRequests = async () => {
      setMessage(requestsStatus, "Loading requests…", "");
      let result = await client
        .from("requests")
        .select("*")
        .eq("writer_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (result.error) {
        result = await client.from("requests").select("*").eq("writer_id", currentUser.id);
      }

      if (result.error) {
        setMessage(requestsStatus, "We couldn't load your requests. Refresh the page to try again.", "is-error");
        return;
      }

      renderRequests(result.data || []);
      setMessage(requestsStatus, "", "");
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(profileStatus, "", "");
      if (!form.checkValidity()) {
        setMessage(profileStatus, "Please check the highlighted fields.", "is-error");
        form.reportValidity();
        return;
      }

      const profile = readForm();
      const issue = validateProfile(profile);
      if (issue) return setMessage(profileStatus, issue, "is-error");

      setMessage(profileStatus, "Saving…", "");
      const { error } = await client.from("profiles").update(profile).eq("id", currentUser.id);
      if (error) {
        setMessage(profileStatus, "Your profile couldn't be saved. Please try again.", "is-error");
        return;
      }
      currentProfile = { ...currentProfile, ...profile };
      updateBadge(currentProfile.status);
      setMessage(
        profileStatus,
        currentProfile.status === "approved"
          ? "Profile saved."
          : "Profile saved. We'll review it before it goes live.",
        "is-success"
      );
    });

    document.getElementById("logout-button").addEventListener("click", async () => {
      await client.auth.signOut();
      window.location.replace("login.html");
    });

    client.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        window.location.replace("login.html");
        return;
      }
      currentUser = data.user;
      loading.hidden = true;
      app.hidden = false;
      loadProfile();
      loadRequests();
    });
  }
})();
