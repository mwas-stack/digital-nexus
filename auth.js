(function () {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_PUBLISHABLE_KEY;
  let client = null;

  if (window.supabase && typeof window.supabase.createClient === "function" && url && key) {
    client = window.supabase.createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  window.nexusDb = client;

  const updateAuthLinks = (signedIn) => {
    document.querySelectorAll("[data-auth-link]").forEach((link) => {
      const showDashboard = link.dataset.authLink === "dashboard";
      link.hidden = showDashboard ? !signedIn : signedIn;
    });
  };

  if (client) {
    client.auth.getSession().then(({ data }) => {
      updateAuthLinks(Boolean(data.session));
    });
    client.auth.onAuthStateChange((_event, session) => {
      updateAuthLinks(Boolean(session));
    });
  }

  window.NexusAuth = {
    get client() {
      return client;
    },
    isReady: Boolean(client),
  };
})();
