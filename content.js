(() => {
  // Повторная инъекция = выключение режима
  if (window.__lowVisionHelper) {
    window.__lowVisionHelper.destroy();
    return false;
  }

  /* ------------------------------------------------------------------ *
   *  НАСТРОЙКИ
   * ------------------------------------------------------------------ */
  const CONFIG = {
    fontSize: 28, // px
    hoverDelayMs: 400, // пауза перед озвучкой, чтобы не "тараторить" при движении мыши
    speech: { rate: 0.85, pitch: 0.95, volume: 0.7 }, // мягкий, неспешный голос
  };

  const FONT_FAMILY = "LVH Atkinson Hyperlegible";

  // Селекторы рекламы и визуального шума. Список легко расширять.
  // Используем display:none, а не удаление из DOM: это обратимо
  // и не ломает скрипты сайтов, которые ждут эти элементы.
  const CLUTTER_SELECTORS = [
    // реклама
    "ins.adsbygoogle",
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[id^="google_ads"]',
    '[id^="google_ads"]',
    '[id^="div-gpt-ad"]',
    '[id^="yandex_rtb"]',
    '[class*="yandex_rtb"]',
    "[data-ad]",
    "[data-ad-slot]",
    '[class~="ad"]',
    '[class~="ads"]',
    '[class*="advert"]',
    '[id*="advert"]',
    '[class*="sponsored"]',
    '[aria-label="Advertisement" i]',
    '[aria-label="Реклама" i]',
    // навязчивые баннеры и всплывашки
    '[class*="cookie-banner"]',
    '[id*="cookie-banner"]',
    '[class*="newsletter-popup"]',
    '[class*="popup-overlay"]',
    '[class*="promo-banner"]',
    // устаревшее мигание/бегущие строки
    "marquee",
    "blink",
  ];

  // Интерактивные элементы, которые озвучиваем при наведении
  const INTERACTIVE = [
    "button",
    "a[href]",
    "summary",
    "select",
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '[role="button"]',
    '[role="link"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="checkbox"]',
    '[role="switch"]',
  ].join(",");

  /* ------------------------------------------------------------------ *
   *  1) УДАЛЕНИЕ ВИЗУАЛЬНОГО МУСОРА + 2) ШРИФТ И РАЗМЕР
   * ------------------------------------------------------------------ */
  const TEXT_TAGS =
    "p, li, a, span, div, td, th, label, button, input, select, textarea, " +
    "small, dd, dt, figcaption, blockquote, summary, em, strong, b";

  // Не трогаем иконочные шрифты и код, иначе иконки превратятся в квадраты
  const NOT_ICON =
    ':not(i):not(svg):not(svg *):not([class*="icon" i]):not([class*="fa-"])' +
    ':not(.fa):not(.fas):not(.far):not(.fab):not([class*="material-"])' +
    ":not(code):not(pre)";

  const style = document.createElement("style");
  style.id = "lvh-style";
  style.textContent = `
    ${CLUTTER_SELECTORS.join(",\n")} { display: none !important; }

    /* без анимаций, мигания и плавных прокруток */
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }

    body *${NOT_ICON} {
      font-family: "${FONT_FAMILY}", "Atkinson Hyperlegible", Arial, sans-serif !important;
    }

    body :is(${TEXT_TAGS})${NOT_ICON} {
      font-size: ${CONFIG.fontSize}px !important;
      line-height: 1.5 !important;
      letter-spacing: 0.02em !important;
    }

    /* сохраняем иерархию заголовков */
    body h1 { font-size: ${CONFIG.fontSize + 16}px !important; line-height: 1.3 !important; }
    body h2 { font-size: ${CONFIG.fontSize + 10}px !important; line-height: 1.3 !important; }
    body h3 { font-size: ${CONFIG.fontSize + 6}px !important; line-height: 1.35 !important; }
    body h4, body h5, body h6 { font-size: ${CONFIG.fontSize + 2}px !important; }

    /* заметный фокус для навигации с клавиатуры */
    :focus-visible { outline: 4px solid #1a5fb4 !important; outline-offset: 3px !important; }
  `;
  document.documentElement.appendChild(style);

  // Шрифт грузим через FontFace API: так строгий CSP сайта не блокирует font-src
  const loadedFaces = [];
  const loadFont = async (file, weight) => {
    try {
      const res = await fetch(chrome.runtime.getURL(`fonts/${file}`));
      const face = new FontFace(FONT_FAMILY, await res.arrayBuffer(), { weight });
      await face.load();
      document.fonts.add(face);
      loadedFaces.push(face);
    } catch (err) {
      console.warn(`[LowVision] не удалось загрузить шрифт ${file}:`, err);
    }
  };
  loadFont("AtkinsonHyperlegible-Regular.woff2", "400");
  loadFont("AtkinsonHyperlegible-Bold.woff2", "700");

  // Останавливаем автовоспроизведение видео (мелькание отвлекает и тревожит)
  document.querySelectorAll("video").forEach((v) => {
    v.pause();
    v.autoplay = false;
  });

  /* ------------------------------------------------------------------ *
   *  3) ОЗВУЧКА ПРИ НАВЕДЕНИИ (Web Speech API)
   * ------------------------------------------------------------------ */
  const synth = window.speechSynthesis;
  const BCP47 = { ru: "ru-RU", kk: "kk-KZ", en: "en-US" };

  const ROLE_WORDS = {
    ru: {
      button: "кнопка", link: "ссылка", checkbox: "флажок", radio: "переключатель",
      select: "выпадающий список", tab: "вкладка", menuitem: "пункт меню",
      switch: "переключатель", summary: "раскрывающийся блок",
    },
    kk: {
      button: "түйме", link: "сілтеме", checkbox: "құсбелгі", radio: "таңдау түймесі",
      select: "ашылмалы тізім", tab: "қойынды", menuitem: "мәзір тармағы",
      switch: "қосқыш", summary: "ашылатын блок",
    },
  };

  const KK_LETTERS = /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/;

  const detectLang = (text) => {
    if (KK_LETTERS.test(text)) return "kk";
    if (/[а-яё]/i.test(text)) return "ru";
    if (/[a-z]/i.test(text)) return "en";
    return "ru";
  };

  const pickVoice = (lang) => {
    const voices = synth.getVoices();
    const prefix = BCP47[lang].slice(0, 2).toLowerCase();
    const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    // Предпочитаем "Google"/нейронные голоса: они звучат мягче
    return (
      matches.find((v) => /google|natural|online/i.test(v.name)) || matches[0] || null
    );
  };

  const say = (text, lang) => {
    if (!text) return;
    let voice = pickVoice(lang);
    let usedLang = lang;
    // Казахского голоса в Chrome часто нет — читаем русским, чем молчать
    if (!voice && lang === "kk") {
      voice = pickVoice("ru");
      usedLang = "ru";
    }
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : BCP47[usedLang];
    Object.assign(u, CONFIG.speech);
    synth.speak(u);
  };

  const getRole = (el) => {
    const aria = el.getAttribute("role");
    if (aria && ROLE_WORDS.ru[aria]) return aria;
    const tag = el.tagName.toLowerCase();
    if (tag === "a") return "link";
    if (tag === "select") return "select";
    if (tag === "summary") return "summary";
    if (tag === "input") {
      const t = (el.type || "").toLowerCase();
      if (t === "checkbox") return "checkbox";
      if (t === "radio") return "radio";
    }
    return "button";
  };

  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

  const getLabel = (el) => {
    const byIds = (el.getAttribute("aria-labelledby") || "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");
    const labels = el.labels ? [...el.labels].map((l) => l.textContent).join(" ") : "";
    const candidate =
      clean(el.getAttribute("aria-label")) ||
      clean(byIds) ||
      clean(labels) ||
      clean(el.innerText) ||
      clean(el.value && el.type !== "checkbox" && el.type !== "radio" ? el.value : "") ||
      clean(el.title) ||
      clean(el.querySelector("img[alt]")?.alt) ||
      "";
    return candidate.length > 100 ? candidate.slice(0, 100) + "…" : candidate;
  };

  const announce = (el) => {
    synth.cancel();
    const label = getLabel(el);
    const labelLang = label ? detectLang(label) : "ru";
    // Слово-роль ("кнопка") — на русском или казахском, название — на своём языке
    const roleLang = labelLang === "kk" ? "kk" : "ru";
    const role = ROLE_WORDS[roleLang][getRole(el)];
    say(role, roleLang);
    if (label) say(label, labelLang);
  };

  let timer = null;
  let current = null;

  const onOver = (e) => {
    const el = e.target.closest?.(INTERACTIVE);
    if (!el || el === current) return;
    current = el;
    clearTimeout(timer);
    timer = setTimeout(() => announce(el), CONFIG.hoverDelayMs);
  };

  const onOut = (e) => {
    const el = e.target.closest?.(INTERACTIVE);
    if (el && el === current && !el.contains(e.relatedTarget)) {
      current = null;
      clearTimeout(timer);
      synth.cancel();
    }
  };

  // Для тех, кто пользуется клавиатурой (Tab) — то же самое по фокусу
  const onFocus = (e) => {
    const el = e.target.closest?.(INTERACTIVE);
    if (el) announce(el);
  };

  document.addEventListener("mouseover", onOver, true);
  document.addEventListener("mouseout", onOut, true);
  document.addEventListener("focusin", onFocus, true);

  // Голоса в Chrome подгружаются асинхронно — «прогреваем» список
  synth.getVoices();

  /* ------------------------------------------------------------------ *
   *  ВЫКЛЮЧЕНИЕ
   * ------------------------------------------------------------------ */
  window.__lowVisionHelper = {
    destroy() {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
      document.removeEventListener("focusin", onFocus, true);
      clearTimeout(timer);
      synth.cancel();
      style.remove();
      loadedFaces.forEach((f) => document.fonts.delete(f));
      delete window.__lowVisionHelper;
    },
  };

  return true; // значение читает background.js для бейджа "ON"
})();
