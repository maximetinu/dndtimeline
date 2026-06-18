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
      var bg = el("div", "bg-img");
      bg.style.backgroundImage = 'url("' + ev.image + '")';
      card.appendChild(bg);
      // scrim: subtle dark + color tint for legibility over the image
      var scrim = el("div", "scrim");
      scrim.style.background =
        "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%), " +
        rgba(base, 0.35);
      card.appendChild(scrim);
    }

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
})();
