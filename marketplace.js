/* Prototype Ginko : stockage local uniquement, sans compte ni publication réelle. */
(function () {
  "use strict";

  const KEY = "ginko_marketplace_listings_v1";
  const readListings = () => {
    try {
      const value = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      return Array.isArray(value) ? value.filter(item =>
        item && typeof item === "object" &&
        ["title", "category", "material", "city", "seller", "description"].every(field =>
          typeof item[field] === "string" && item[field].trim().length > 0
        ) &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) > 0
      ) : [];
    } catch (error) {
      return [];
    }
  };
  const saveListings = listings => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(listings));
      return true;
    } catch (error) {
      return false;
    }
  };
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const money = value => new Intl.NumberFormat("fr-MA", {
    style: "currency", currency: "MAD", maximumFractionDigits: 0
  }).format(Number(value) || 0);

  const catalogue = document.querySelector("[data-ginko-catalog]");
  if (catalogue) {
    const search = document.querySelector("#marketSearch");
    const category = document.querySelector("#marketCategory");
    const sort = document.querySelector("#marketSort");
    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    if (requestedCategory && [...category.options].some(option => option.value === requestedCategory)) {
      category.value = requestedCategory;
    }

    const renderCatalogue = () => {
      let listings = readListings();
      const term = search.value.trim().toLocaleLowerCase("fr");
      listings = listings.filter(item =>
        (!category.value || item.category === category.value) &&
        (!term || [item.title, item.material, item.city, item.description, item.seller]
          .join(" ").toLocaleLowerCase("fr").includes(term))
      );
      if (sort.value === "price-asc") listings.sort((a, b) => Number(a.price) - Number(b.price));
      if (sort.value === "price-desc") listings.sort((a, b) => Number(b.price) - Number(a.price));

      catalogue.innerHTML = "";
      if (!listings.length) {
        catalogue.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Aucune annonce dans cette catégorie sur cet appareil. Tu peux en ajouter une depuis l’espace vendeur.</div>';
        return;
      }
      listings.forEach(item => {
        const card = document.createElement("article");
        card.className = "market-card";
        const symbols = {
          "Bague": "◯",
          "Bracelet": "∞",
          "Collier": "◇",
          "Boucles d’oreilles": "✧",
          "Autre": "✳"
        };
        const symbol = symbols[item.category] || "✧";
        card.innerHTML =
          '<div class="market-card-visual" aria-hidden="true">' +
            '<span class="card-visual-symbol">' + symbol + '</span>' +
            '<span class="card-visual-label">Illustration décorative · Ginko</span>' +
          '</div>' +
          '<div class="market-card-body">' +
            '<div class="market-card-topline"><span class="tag">' + escapeHTML(item.category) + '</span>' +
            '<span class="market-card-kicker">Pièce proposée</span></div>' +
            '<h3>' + escapeHTML(item.title) + '</h3>' +
            '<div class="market-card-details"><span>' + escapeHTML(item.material) + '</span>' +
            '<span>' + escapeHTML(item.city) + '</span></div>' +
            '<p class="market-card-description">' + escapeHTML(item.description) + '</p>' +
            '<div class="market-card-bottom"><div class="market-price">' + money(item.price) + '</div>' +
            '<div class="market-card-seller">Proposé par<strong>' + escapeHTML(item.seller) + '</strong></div></div>' +
            '<span class="market-card-demo">Annonce de démonstration</span>' +
          '</div>';
        catalogue.appendChild(card);
      });
    };

    [search, category, sort].forEach(control => {
      control.addEventListener("input", renderCatalogue);
      control.addEventListener("change", renderCatalogue);
    });
    renderCatalogue();
  }

  const form = document.querySelector("#sellerListingForm");
  if (form) {
    const list = document.querySelector("#sellerListings");
    const status = document.querySelector("#sellerStatus");
    const renderSellerListings = () => {
      const listings = readListings();
      list.innerHTML = listings.length ? listings.map(item =>
        '<div class="seller-list-item"><div><strong>' + escapeHTML(item.title) +
        '</strong><span>' + escapeHTML(item.category) + ' · ' + money(item.price) +
        ' · ' + escapeHTML(item.city) + '</span></div><span>Sur cet appareil</span></div>'
      ).join("") : '<div class="empty-state">Aucune annonce enregistrée sur cet appareil.</div>';
    };

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const price = Number(data.get("price"));
      if (!Number.isFinite(price) || price <= 0) {
        status.textContent = "Saisis un prix valide en MAD.";
        status.hidden = false;
        return;
      }
      const listing = {
        title: String(data.get("title") || "").trim(),
        category: String(data.get("category") || ""),
        material: String(data.get("material") || "").trim(),
        price,
        city: String(data.get("city") || "").trim(),
        seller: String(data.get("seller") || "").trim(),
        description: String(data.get("description") || "").trim()
      };
      if (Object.values(listing).some(value => value === "")) {
        status.textContent = "Complète tous les champs avant d’enregistrer l’annonce.";
        status.hidden = false;
        return;
      }
      const listings = readListings();
      listings.unshift(listing);
      if (!saveListings(listings)) {
        status.textContent = "Le navigateur n’a pas pu enregistrer cette annonce. Vérifie ses réglages de stockage.";
        status.hidden = false;
        return;
      }
      form.reset();
      renderSellerListings();
      status.textContent = "Annonce enregistrée dans ce navigateur uniquement. Elle n’est pas publiée sur Internet.";
      status.hidden = false;
    });

    renderSellerListings();
  }

  const currentPage = window.location.pathname.split("/").filter(Boolean).pop() || "index.html";
  document.querySelectorAll(".market-nav a").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
})();