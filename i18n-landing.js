(function () {
  const LANG_MAP = {
    en: "English",
    "en-US": "English",
    "en-GB": "English",

    ru: "Russian",
    "ru-RU": "Russian"
  };

  function getPreferredLangName() {
    const browserLangs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || "en"];

    for (const raw of browserLangs) {
      const normalized = String(raw || "").trim();

      if (LANG_MAP[normalized]) return LANG_MAP[normalized];

      const short = normalized.split("-")[0];
      if (LANG_MAP[short]) return LANG_MAP[short];
    }

    return "English";
  }

  function getValueByKey(items, key, langName) {
    if (!Array.isArray(items) || !key) return "";

    const item = items.find(row => row && row.key === key);
    if (!item || !Array.isArray(item.text)) return "";

    const translation = item.text.find(row => row && row.lang === langName);
    if (!translation || typeof translation.value !== "string") return "";

    return translation.value.trim();
  }

  function buildDictionary(items, langName) {
    const dict = {};

    if (!Array.isArray(items)) return dict;

    for (const item of items) {
      if (!item || !item.key || !Array.isArray(item.text)) continue;

      const translation = item.text.find(row => row && row.lang === langName);
      if (!translation || typeof translation.value !== "string") continue;

      const value = translation.value.trim();
      if (!value) continue;

      dict[item.key] = value;
    }

    return dict;
  }

  function applyTextContent(dict) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = dict[key];
      if (!value) return;
      el.textContent = value;
    });
  }

  function applyAttributes(dict) {
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      const value = dict[key];
      if (!value) return;
      el.setAttribute("aria-label", value);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      const value = dict[key];
      if (!value) return;
      el.setAttribute("alt", value);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      const value = dict[key];
      if (!value) return;
      el.setAttribute("title", value);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const value = dict[key];
      if (!value) return;
      el.setAttribute("placeholder", value);
    });
  }

  function applyDocumentMeta(dict, langName) {
    if (dict["landing.meta.title"]) {
      document.title = dict["landing.meta.title"];
    }

    const htmlLang = langName === "Russian" ? "ru" : "en";
    document.documentElement.setAttribute("lang", htmlLang);
  }

  function exposeHelper(items, langName) {
    window.SotiioLandingI18n = {
      lang: langName,
      t(key, fallback) {
        const value = getValueByKey(items, key, langName);
        return value || fallback || "";
      }
    };
  }

  function applyI18n() {
    const items = window.SOTIIO_I18N;
    if (!Array.isArray(items)) return;

    const langName = getPreferredLangName();
    const dict = buildDictionary(items, langName);

    exposeHelper(items, langName);

    if (!Object.keys(dict).length) return;

    applyTextContent(dict);
    applyAttributes(dict);
    applyDocumentMeta(dict, langName);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyI18n);
  } else {
    applyI18n();
  }
})();
