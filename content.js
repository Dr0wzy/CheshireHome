(function () {
  const PAGE_FILES = {
    home: "./content/home.json",
    about: "./content/about.json",
    contact: "./content/contact.json",
    faq: "./content/faq.json"
  };

  const LANG_KEY = "cheshire-lang";

  function pageName() {
    const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file || file === "index.html") return "home";
    if (file.startsWith("about")) return "about";
    if (file.startsWith("contact")) return "contact";
    if (file.startsWith("faq")) return "faq";
    return "home";
  }

  function getLang() {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "tr" || fromUrl === "en") return fromUrl;
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === "tr" || stored === "en") return stored;
    return "en";
  }

  function setLang(lang) {
    window.localStorage.setItem(LANG_KEY, lang);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.location.href = url.toString();
  }

  function get(obj, path) {
    return path.split(".").reduce(function (current, key) {
      return current == null ? current : current[key];
    }, obj);
  }

  function imageUrl(value) {
    if (!value) return "";
    if (Array.isArray(value)) return imageUrl(value[0]);
    if (typeof value === "string") return value;
    return value.url || value.path || value.src || "";
  }

  function deepMerge(base, over) {
    if (over == null) return base;
    if (Array.isArray(over)) return over.slice();
    if (typeof over !== "object") return over;
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base || {});
    Object.keys(over).forEach(function (key) {
      const value = over[key];
      if (Array.isArray(value) && Array.isArray(base && base[key])) {
        out[key] = value.map(function (item, index) {
          return deepMerge(base[key][index], item);
        });
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        out[key] = deepMerge(base && base[key], value);
      } else {
        out[key] = Array.isArray(value) ? value.slice() : value;
      }
    });
    return out;
  }

  function setValue(el, value, type) {
    if (value == null || value === "") return;
    switch (type) {
      case "html":
        el.innerHTML = value;
        break;
      case "src":
        el.setAttribute("src", imageUrl(value));
        break;
      case "href":
        el.setAttribute("href", value);
        break;
      case "bg":
        el.style.backgroundImage = 'url("' + imageUrl(value) + '")';
        break;
      case "value":
        el.value = value;
        if (el.type === "range") {
          el.style.setProperty("--progress", Number(value) + "%");
        }
        break;
      case "progress":
        el.setAttribute("aria-valuenow", value);
        el.style.setProperty("--progress", Number(value) + "%");
        break;
      case "placeholder":
        el.setAttribute("placeholder", value);
        break;
      default:
        el.textContent = value;
    }
  }

  function apply(root, data) {
    root.querySelectorAll("[data-cms-list]").forEach(function (container) {
      const items = get(data, container.getAttribute("data-cms-list"));
      const template = container.querySelector("template");
      if (!template || !Array.isArray(items)) return;

      Array.prototype.slice.call(container.children).forEach(function (child) {
        if (child.tagName !== "TEMPLATE") child.remove();
      });

      items.forEach(function (item) {
        const fragment = template.content.cloneNode(true);
        const context =
          typeof item === "string" || typeof item === "number"
            ? { value: item, image: item }
            : item;
        apply(fragment, context);
        container.appendChild(fragment);
      });
    });

    root.querySelectorAll("[data-cms]").forEach(function (el) {
      const value = get(data, el.getAttribute("data-cms"));
      setValue(el, value, el.getAttribute("data-cms-type") || "text");
    });

    root.querySelectorAll("[data-cms-href]").forEach(function (el) {
      const value = get(data, el.getAttribute("data-cms-href"));
      if (value) el.setAttribute("href", value);
    });

    root.querySelectorAll("input[type='range']").forEach(function (el) {
      el.style.setProperty("--progress", Number(el.value) + "%");
    });
  }

  function wireDonate(url) {
    if (!url) return;
    document.querySelectorAll("[data-cms-donate]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = url;
      });
    });
  }

  function wireTestimonials(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    const authorEl = document.querySelector("[data-testimonial-author]");
    const textEl = document.querySelector("[data-testimonial-text]");
    if (!authorEl || !textEl) return;

    let index = 0;
    function show(next) {
      index = (next + items.length) % items.length;
      authorEl.textContent = items[index].author || "";
      textEl.textContent = items[index].text || "";
    }

    const prev = document.querySelector("[data-testimonial-prev]");
    const next = document.querySelector("[data-testimonial-next]");
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });
    if (items.length < 2) {
      if (prev) prev.style.visibility = "hidden";
      if (next) next.style.visibility = "hidden";
    }
  }

  function wireContactForm(email) {
    const form = document.querySelector(".contact-form form");
    if (!form || !email) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const lines = Array.prototype.slice
        .call(form.querySelectorAll("input, textarea"))
        .map(function (field) {
          return (field.getAttribute("placeholder") || field.name || "Field") + ": " + field.value;
        });
      window.location.href =
        "mailto:" + email +
        "?subject=" + encodeURIComponent("Website message") +
        "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }

  function wireLanguage(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang]").forEach(function (button) {
      const active = button.getAttribute("data-lang") === lang;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.addEventListener("click", function () {
        if (!active) setLang(button.getAttribute("data-lang"));
      });
    });
  }

  function preserveLangOnLinks(lang) {
    document.querySelectorAll("a[href]").forEach(function (link) {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("javascript:")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        url.searchParams.set("lang", lang);
        link.setAttribute("href", url.pathname + url.search + url.hash);
      } catch (e) {}
    });
  }

  function hideEmptySocials(social) {
    if (!social) return;
    document.querySelectorAll("[data-cms-type='href']").forEach(function (link) {
      if (!link.getAttribute("href") || link.getAttribute("href") === "#") {
        const wrap = link.closest(".footer-socials-follow-us-facebook, .footer-socials-follow-us-instagram, .footer-socials-follow-us-x");
        if (wrap) wrap.style.display = "none";
      }
    });
  }

  function reveal() {
    document.documentElement.classList.remove("cms-loading");
    document.documentElement.classList.add("cms-ready");
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) return null;
    return response.json();
  }

  async function load() {
    const lang = getLang();
    const page = pageName();
    window.setTimeout(reveal, 2000);

    try {
      const requests = [fetchJson("./content/site.json"), fetchJson(PAGE_FILES[page])];
      if (lang === "tr") {
        requests.push(fetchJson("./content/tr/ui.json"));
        requests.push(fetchJson("./content/tr/" + page + ".json"));
      }
      const results = await Promise.all(requests);
      const site = results[0];
      const pageData = results[1];
      if (!site || !pageData) {
        reveal();
        return;
      }

      const siteMerged = lang === "tr" && results[2] ? deepMerge(site, results[2]) : site;
      const pageMerged = lang === "tr" && results[3] ? deepMerge(pageData, results[3]) : pageData;
      const data = Object.assign({ site: siteMerged }, pageMerged);

      apply(document, data);
      if (siteMerged.title) document.title = siteMerged.title;
      wireDonate(siteMerged.donate_url);
      wireTestimonials(pageMerged.testimonials && pageMerged.testimonials.items);
      wireContactForm(siteMerged.contact && siteMerged.contact.email);
      wireLanguage(lang);
      preserveLangOnLinks(lang);
      hideEmptySocials(siteMerged.social);
    } catch (error) {
      console.warn("Could not load editable content", error);
      wireLanguage(lang);
    }
    reveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
