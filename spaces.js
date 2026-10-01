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

  const spaceSlug = getSpaceSlug();
  if (!spaceSlug) return;

  document.body.classList.add("is-corporate-space");

  const style = document.createElement("style");
  style.textContent = `
    body.is-corporate-space .auth-geo-pending-notice,
    body.is-corporate-space .ru-auth-notice {
      display: none !important;
    }

    .corporate-auth-form {
      width: min(100%, 380px);
      display: grid;
      gap: 12px;
      margin: 0 auto;
    }

    .corporate-auth-space {
      margin: 0 0 2px;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    }

    .corporate-auth-field {
      display: grid;
      gap: 6px;
      text-align: left;
    }

    .corporate-auth-field span {
      color: #374151;
      font-size: 13px;
      font-weight: 650;
    }

    .corporate-auth-field input {
      width: 100%;
      min-height: 46px;
      box-sizing: border-box;
      border: 1px solid rgba(17, 24, 39, 0.16);
      border-radius: 14px;
      padding: 0 14px;
      background: #fff;
      color: #111827;
      font: inherit;
      outline: none;
    }

    .corporate-auth-field input:focus {
      border-color: #111827;
      box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
    }

    .corporate-auth-submit {
      min-height: 46px;
      border: 0;
      border-radius: 999px;
      padding: 0 18px;
      background: #111827;
      color: #fff;
      font: inherit;
      font-weight: 750;
      cursor: pointer;
    }

    .corporate-auth-submit:disabled {
      cursor: wait;
      opacity: 0.62;
    }

    .corporate-auth-status {
      min-height: 20px;
      margin: 0;
      color: #b42318;
      font-size: 13px;
      line-height: 1.4;
      text-align: center;
    }
  `;
  document.head.appendChild(style);

  const openButton = document.getElementById("openModalBtn");
  if (openButton) {
    openButton.removeAttribute("data-i18n");
    openButton.textContent = "Войти";
  }

  const dialogTitle = document.querySelector(".dialog-title");
  if (dialogTitle) {
    dialogTitle.removeAttribute("data-i18n");
    dialogTitle.textContent = "Корпоративный вход";
  }

  const buttonsWrap = document.getElementById("authButtonsWrap");
  if (!buttonsWrap) return;

  buttonsWrap.removeAttribute("data-i18n-aria-label");
  buttonsWrap.setAttribute("aria-label", "Корпоративная авторизация");
  buttonsWrap.innerHTML = `
    <form class="corporate-auth-form" id="corporateAuthForm" novalidate>
      <p class="corporate-auth-space"></p>

      <label class="corporate-auth-field">
        <span>Логин</span>
        <input
          id="corporateUsername"
          name="username"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          required
        >
      </label>

      <label class="corporate-auth-field">
        <span>Пароль</span>
        <input
          id="corporatePassword"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        >
      </label>

      <button class="corporate-auth-submit" type="submit">Войти</button>
      <p class="corporate-auth-status" role="status" aria-live="polite"></p>
    </form>
  `;

  const form = document.getElementById("corporateAuthForm");
  const spaceLabel = form.querySelector(".corporate-auth-space");
  const usernameInput = document.getElementById("corporateUsername");
  const passwordInput = document.getElementById("corporatePassword");
  const submitButton = form.querySelector(".corporate-auth-submit");
  const status = form.querySelector(".corporate-auth-status");

  spaceLabel.textContent = `Пространство: ${spaceSlug}`;

  function errorMessage(responseStatus, data) {
    if (responseStatus === 401) return "Неверный логин или пароль.";
    if (responseStatus === 403) return "У пользователя нет доступа к этому пространству.";
    if (responseStatus === 404) return "Пространство не найдено.";
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    return "Не удалось выполнить вход. Попробуйте ещё раз.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      status.textContent = "Введите логин и пароль.";
      return;
    }

    status.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Входим…";

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

      // Never accept an arbitrary redirect URL from the response. Reloading the
      // same origin lets the router re-check the new session and serve the app.
      window.location.replace(`${window.location.origin}/`);
    } catch (_) {
      status.textContent = "Сервис авторизации временно недоступен.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Войти";
    }
  });
})();
