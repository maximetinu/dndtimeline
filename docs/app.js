(function () {
  "use strict";

  var data = window.TIMELINE_DATA;
  if (!data) {
    document.getElementById("chronicle").textContent = "No se pudo cargar data.js";
    return;
  }

  // ---- helpers ----------------------------------------------------------
  function hexToRgb(hex) {
    hex = (hex || "#0079CC").replace("#", "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  function rgba(c, a) {
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  // lighten toward white for the border / outline accent
  function lighten(c, amt) {
    return {
      r: Math.round(c.r + (255 - c.r) * amt),
      g: Math.round(c.g + (255 - c.g) * amt),
      b: Math.round(c.b + (255 - c.b) * amt),
    };
  }

  var CALENDAR_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/>' +
    '<path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h4"/><path d="M8 18h.01"/><path d="M12 18h4"/></svg>';

  function diamondSvg(fillColor, strokeColor) {
    return (
      '<svg width="31" height="30" viewBox="0 0 31 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M29.793 15L15.5 29.293L1.20703 15L15.5 0.707031L29.793 15Z" fill="' +
      fillColor +
      '" fill-opacity="0.85" stroke="' +
      strokeColor +
      '"/></svg>'
    );
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---- header -----------------------------------------------------------
  if (data.title) {
    document.getElementById("timeline-title").textContent = data.title;
    document.title = data.title + " — Timeline";
  }
  if (data.calendar) {
    document.getElementById("calendar-name").textContent = data.calendar;
  }
  document.getElementById("event-count").textContent =
    data.events.length + " eventos";

  // ---- detail modal -----------------------------------------------------
  var lightbox = el("div", "lightbox");
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.innerHTML =
    '<button class="lb-close" aria-label="Cerrar">&times;</button>' +
    '<figure class="lb-figure">' +
    '<div class="lb-icon" aria-hidden="true">' + CALENDAR_ICON + "</div>" +
    '<img class="lb-img" alt="" />' +
    '<figcaption class="lb-cap"><span class="lb-name"></span><span class="lb-date"></span></figcaption>' +
    "</figure>";
  document.body.appendChild(lightbox);
  var lbIcon = lightbox.querySelector(".lb-icon");
  var lbImg = lightbox.querySelector(".lb-img");
  var lbName = lightbox.querySelector(".lb-name");
  var lbDate = lightbox.querySelector(".lb-date");

  function openDetail(ev) {
    if (ev.image) {
      lbImg.src = ev.image;
      lbImg.alt = ev.name || "";
      lbImg.style.display = "";
      lbIcon.style.display = "none";
    } else {
      lbImg.removeAttribute("src");
      lbImg.style.display = "none";
      lbIcon.style.display = "";
      lbIcon.style.color = ev.color || "#0099ff";
    }
    lbName.textContent = ev.name || "";
    lbDate.textContent = ev.dateText || "";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeDetail() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    lbImg.removeAttribute("src");
  }
  lightbox.addEventListener("click", function (e) {
    // close when clicking the backdrop or the close button (not the image itself)
    if (e.target === lightbox || e.target.classList.contains("lb-close")) {
      closeDetail();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox.classList.contains("open")) closeDetail();
  });

  // ---- render events ----------------------------------------------------
  var chronicle = document.getElementById("chronicle");
  var frag = document.createDocumentFragment();

  data.events.forEach(function (ev) {
    var base = hexToRgb(ev.color);
    var stroke = lighten(base, 0.25);
    var strokeStr = "rgb(" + stroke.r + "," + stroke.g + "," + stroke.b + ")";
    var bgStr = rgba(base, 0.5);

    var row = el("div", "row");

    // left date column
    var dateCol;
    if (ev.yearLabel) {
      dateCol = el("div", "date-col");
      dateCol.appendChild(el("div", "year", ev.yearLabel));
      if (ev.rel) dateCol.appendChild(el("div", "rel", ev.rel));
    } else {
      dateCol = el("div", "date-col rel-only");
      dateCol.appendChild(el("div", "rel", ev.rel || ""));
    }
    row.appendChild(dateCol);

    // node (diamond + stem)
    var node = el("div", "node");
    node.appendChild(el("div", "diamond", diamondSvg(bgStr, "#0099ff")));
    node.appendChild(el("div", "stem"));
    row.appendChild(node);

    // card
    var card = el("div", "card");
    card.style.backgroundColor = bgStr;
    card.style.borderColor = strokeStr;

    if (ev.image) {
      card.classList.add("has-image");
      var bg = el("div", "bg-img");
      bg.style.backgroundImage = 'url("' + ev.image + '")';
      card.appendChild(bg);
      // scrim: subtle dark + color tint for legibility over the image
      var scrim = el("div", "scrim");
      scrim.style.background =
        "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%), " +
        rgba(base, 0.35);
      card.appendChild(scrim);

      // expand hint icon (top-right, desktop hover)
      var hint = el(
        "div",
        "expand-hint",
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>'
      );
      card.appendChild(hint);
    }

    // mobile date pill (year + relative gap) — replaces the side column on phones
    var meta = el("div", "card-meta");
    meta.appendChild(el("span", "cm-year", "")).textContent = ev.dateText || "";
    if (ev.rel) meta.appendChild(el("span", "cm-rel", "")).textContent = ev.rel;
    card.appendChild(meta);

    // every event opens its detail view
    (function (event) {
      card.addEventListener("click", function () {
        openDetail(event);
      });
    })(ev);

    var inner = el("div", "inner");
    inner.appendChild(el("div", "icon", CALENDAR_ICON));
    var text = el("div", "text");
    text.appendChild(el("div", "name", "")).textContent = ev.name;
    text.appendChild(el("div", "sub", "")).textContent = ev.dateText || "";
    inner.appendChild(text);
    card.appendChild(inner);

    row.appendChild(card);
    frag.appendChild(row);
  });

  chronicle.appendChild(frag);

  // terminal node
  var end = el("div", "row");
  var endCol = el("div", "date-col");
  end.appendChild(endCol);
  var endNode = el("div", "end-node");
  endNode.appendChild(
    el("div", "diamond", diamondSvg("#27272A", "rgba(255,255,255,0.25)"))
  );
  endNode.appendChild(el("div", "stem"));
  end.appendChild(endNode);
  end.appendChild(el("div", "", ""));
  chronicle.appendChild(end);

  // ---- scroll-to-top button --------------------------------------------
  var toTop = el(
    "button",
    "to-top",
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>'
  );
  toTop.setAttribute("aria-label", "Volver arriba");
  document.body.appendChild(toTop);
  toTop.addEventListener("click", function () {
    chronicle.scrollTo({ top: 0, behavior: "smooth" });
  });
  chronicle.addEventListener("scroll", function () {
    toTop.classList.toggle("show", chronicle.scrollTop > 600);
  });

})();
