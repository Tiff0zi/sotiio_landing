(function () {
  "use strict";

  const BASE_DOMAIN = "sotiio.com";
  const RESERVED_SUBDOMAINS = new Set([
    "www",
    "app",
    "api",
    "auth",
    "n8n",
    "keycloak"
  ]);

  function getSpaceSlug() {
    const host = window.location.hostname.toLowerCase();
    const suffix = `.${BASE_DOMAIN}`;

    if (!host.endsWith(suffix)) return null;

    const slug = host.slice(0, -suffix.length);
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return null;
    if (RESERVED_SUBDOMAINS.has(slug)) return null;

    return slug;
  }

  function initializeSpaceLogin() {
    if (!getSpaceSlug()) return;

    const i18n = window.SotiioLandingI18n;
    const t = (key, fallback) =>
      i18n && typeof i18n.t === "function" ? i18n.t(key, fallback) : fallback;

    document.body.classList.add("is-corporate-space");

    const style = document.createElement("style");
    style.id = "sotiioSpacesStyles";
    style.textContent = `
      body.is-corporate-space .auth-geo-pending-notice,
      body.is-corporate-space .ru-auth-notice {
        display: none !important;
      }

      body.is-corporate-space .auth-buttons-wrap {
        width: min(100%, 360px);
      }

      .corporate-auth-form {
        width: 100%;
        display: grid;
        gap: 14px;
        margin: 0 auto;
      }

      .corporate-auth-field {
        display: grid;
        gap: 7px;
        text-align: left;
      }

      .corporate-auth-field span {
        color: #344054;
        font-size: 14px;
        font-weight: 800;
      }

      .corporate-auth-field input {
        width: 100%;
        min-height: 52px;
        box-sizing: border-box;
        border: 1px solid #d0d5dd;
        border-radius: 14px;
        padding: 0 15px;
        background: #ffffff;
        color: #101828;
        font: inherit;
        font-size: 15px;
        font-weight: 600;
        outline: none;
        transition: border-color .12s ease, box-shadow .12s ease;
      }

      .corporate-auth-field input:focus {
        border-color: #ff6a3c;
        box-shadow: 0 0 0 4px rgba(255, 106, 60, 0.12);
      }

      .corporate-auth-submit {
        min-height: 52px;
        border: 0;
        border-radius: 14px;
        padding: 0 18px;
        background: linear-gradient(135deg, #ff6a3c, #ff914d);
        color: #ffffff;
        font: inherit;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(248, 113, 113, 0.26);
        transition: transform .12s ease, filter .12s ease, box-shadow .12s ease;
      }

      .corporate-auth-submit:hover:not(:disabled) {
        filter: brightness(1.03);
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(248, 113, 113, 0.30);
      }

      .corporate-auth-submit:active:not(:disabled) {
        transform: translateY(0);
      }

      .corporate-auth-submit:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .corporate-auth-status {
        min-height: 18px;
        margin: -2px 0 0;
        color: #b42318;
        font-size: 12px;
        line-height: 1.45;
        text-align: center;
      }
    `;
    document.head.appendChild(style);

    const openButton = document.getElementById("openModalBtn");
    if (openButton) {
      openButton.textContent = t("landing.auth.sign_in", "Sign in");
    }

    const dialogTitle = document.querySelector(".dialog-title");
    if (dialogTitle) {
      dialogTitle.textContent = t("landing.modal.title", "Sign in");
    }

    const buttonsWrap = document.getElementById("authButtonsWrap");
    if (!buttonsWrap) return;

    buttonsWrap.removeAttribute("data-i18n-aria-label");
    buttonsWrap.setAttribute(
      "aria-label",
      t("landing.spaces.auth_aria_label", "Sign in")
    );
    buttonsWrap.innerHTML = `
      <form class="corporate-auth-form" id="corporateAuthForm" novalidate>
        <label class="corporate-auth-field">
          <span id="corporateUsernameLabel"></span>
          <input
            id="corporateUsername"
            name="username"
            type="text"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            aria-labelledby="corporateUsernameLabel"
            required
          >
        </label>

        <label class="corporate-auth-field">
          <span id="corporatePasswordLabel"></span>
          <input
            id="corporatePassword"
            name="password"
            type="password"
            autocomplete="current-password"
            aria-labelledby="corporatePasswordLabel"
            required
          >
        </label>

        <button class="corporate-auth-submit" type="submit"></button>
        <p class="corporate-auth-status" role="status" aria-live="polite"></p>
      </form>
    `;

    const form = document.getElementById("corporateAuthForm");
    const usernameInput = document.getElementById("corporateUsername");
    const passwordInput = document.getElementById("corporatePassword");
    const usernameLabel = document.getElementById("corporateUsernameLabel");
    const passwordLabel = document.getElementById("corporatePasswordLabel");
    const submitButton = form.querySelector(".corporate-auth-submit");
    const status = form.querySelector(".corporate-auth-status");

    usernameLabel.textContent = t("landing.spaces.username", "Username");
    passwordLabel.textContent = t("landing.spaces.password", "Password");
    submitButton.textContent = t("landing.spaces.submit", "Sign in");

    function errorMessage(responseStatus, data) {
      if (responseStatus === 401) {
        return t("landing.spaces.error.invalid_credentials", "Incorrect username or password.");
      }
      if (responseStatus === 403) {
        return t("landing.spaces.error.forbidden", "You do not have access to this space.");
      }
      if (responseStatus === 404) {
        return t("landing.spaces.error.not_found", "Space not found.");
      }
      if (typeof data?.message === "string" && data.message.trim()) return data.message;
      return t("landing.spaces.error.generic", "Could not sign in. Try again.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username || !password) {
        status.textContent = t(
          "landing.spaces.error.required",
          "Enter your username and password."
        );
        return;
      }

      status.textContent = "";
      submitButton.disabled = true;
      submitButton.textContent = t("landing.spaces.submitting", "Signing in…");

      try {
        const response = await fetch("/__auth/login", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          status.textContent = errorMessage(response.status, data);
          return;
        }

        window.location.replace(`${window.location.origin}/`);
      } catch (_) {
        status.textContent = t(
          "landing.spaces.error.unavailable",
          "The authentication service is temporarily unavailable."
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = t("landing.spaces.submit", "Sign in");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSpaceLogin, { once: true });
  } else {
    initializeSpaceLogin();
  }
})();
