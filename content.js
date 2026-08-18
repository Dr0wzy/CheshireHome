(function () {
  const PAGE_FILES = {
    home: "./content/home.json",
    about: "./content/about.json",
    contact: "./content/contact.json",
    faq: "./content/faq.json"
  };

  function pageName() {
    const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file || file === "index.html") return "home";
    if (file.startsWith("about")) return "about";
    if (file.startsWith("contact")) return "contact";
    if (file.startsWith("faq")) return "faq";
    return "home";
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

  async function load() {
    try {
      const page = pageName();
      const results = await Promise.all([
        fetch("./content/site.json"),
        fetch(PAGE_FILES[page])
      ]);
      if (!results[0].ok || !results[1].ok) return;

      const site = await results[0].json();
      const pageData = await results[1].json();
      apply(document, Object.assign({ site: site }, pageData));

      if (site.title) document.title = site.title;
      wireDonate(site.donate_url);
      wireTestimonials(pageData.testimonials && pageData.testimonials.items);
      wireContactForm(site.contact && site.contact.email);
    } catch (error) {
      console.warn("Could not load editable content", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
