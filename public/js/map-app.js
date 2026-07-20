/* District map: Leaflet + highlighter layers + address pin → candidate panel */
(function () {
  const mapEl = document.getElementById("district-map");
  if (!mapEl || typeof L === "undefined") return;

  const layersData = window.SD33_DISTRICTS || { center: [45.15, -92.9], zoom: 10, layers: [], townPins: [] };
  const map = L.map("district-map").setView(layersData.center || [45.15, -92.9], layersData.zoom || 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const layerControls = {};
  const layerById = {};

  (layersData.layers || []).forEach(function (layer) {
    const gj = L.geoJSON(layer.geojson, {
      style: {
        color: layer.color,
        weight: 2,
        fillColor: layer.color,
        fillOpacity: layer.fillOpacity != null ? layer.fillOpacity : 0.3,
      },
    }).addTo(map);
    layerControls[layer.label] = gj;
    layerById[layer.id] = { leaflet: gj, meta: layer };
  });

  L.control.layers(null, layerControls, { collapsed: false }).addTo(map);

  (layersData.townPins || []).forEach(function (t) {
    const houseLine = t.houseLabel || (t.house ? "State House · HD " + t.house : "House TBD");
    const gopLine = t.gopHouse ? "<br/>GOP House: <strong>" + t.gopHouse + "</strong>" : "";
    const fed = t.usHouse ? "<br/>U.S. House (guide): MN-0" + t.usHouse : "";
    const note = t.note ? "<br/><em>" + t.note + "</em>" : "";
    L.circleMarker([t.lat, t.lng], {
      radius: 6,
      color: "#0a2744",
      fillColor: t.house === "33A" ? "#fde047" : "#f9a8d4",
      fillOpacity: 0.95,
      weight: 2,
    })
      .addTo(map)
      .bindPopup(
        "<strong>" +
          t.name +
          "</strong><br/>" +
          houseLine +
          gopLine +
          "<br/>State Senate · SD 33" +
          fed +
          note
      );
  });

  let pin = null;
  const resultEl = document.getElementById("map-results");

  function setResultsHtml(html) {
    if (resultEl) resultEl.innerHTML = html;
  }

  function lookupCandidates(lat, lng, label) {
    setResultsHtml("<p class=\"muted\">Looking up candidates…</p>");
    const url =
      "/api/map-lookup?lat=" +
      encodeURIComponent(lat) +
      "&lng=" +
      encodeURIComponent(lng) +
      (label ? "&label=" + encodeURIComponent(label) : "");
    fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data.ok) {
          setResultsHtml("<p class=\"muted\">" + (data.error || "Lookup failed.") + "</p>");
          return;
        }
        let html = "";
        if (data.addressLabel) {
          html += "<p><strong>Location:</strong> " + escapeHtml(data.addressLabel) + "</p>";
        }
        html +=
          "<p class=\"muted\">Matched districts (approximate map): " +
          escapeHtml((data.matchedLayers || []).join(", ") || "See list") +
          "</p>";
        (data.levels || []).forEach(function (level) {
          html += '<div class="map-cand-block">';
          html +=
            '<div class="level-tag">' +
            escapeHtml(level.level) +
            "</div>";
          html += "<h4 style=\"margin:0.25rem 0\">" + escapeHtml(level.office) + "</h4>";
          if (level.districtNote) {
            html += '<p class="muted" style="margin:0.2rem 0">' + escapeHtml(level.districtNote) + "</p>";
          }
          html += "<ul class=\"list\">";
          (level.candidates || []).forEach(function (c) {
            html +=
              "<li>" +
              '<span class="tag-gop">GOP</span> <span class="cand-name">' +
              escapeHtml(c.name) +
              "</span>" +
              (c.leading ? ' <span class="badge pri">LEADING</span>' : "") +
              (c.note ? '<div class="note">' + escapeHtml(c.note) + "</div>" : "") +
              "</li>";
          });
          if (!level.candidates || !level.candidates.length) {
            html += '<li class="muted">No GOP candidates listed for this race yet.</li>';
          }
          html += "</ul></div>";
        });
        html +=
          '<p class="muted" style="margin-top:0.75rem">Map outlines are approximate for organizing. Official ballot: <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">pollfinder.sos.mn.gov</a></p>';
        setResultsHtml(html);
      })
      .catch(function () {
        setResultsHtml("<p class=\"muted\">Could not load candidates. Try again.</p>");
      });
  }

  function placePin(lat, lng, label) {
    if (pin) map.removeLayer(pin);
    pin = L.marker([lat, lng]).addTo(map);
    if (label) pin.bindPopup(escapeHtml(label)).openPopup();
    map.setView([lat, lng], 12);
    lookupCandidates(lat, lng, label);
  }

  map.on("click", function (e) {
    placePin(e.latlng.lat, e.latlng.lng, "Map pin");
  });

  const form = document.getElementById("map-address-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const street = (document.getElementById("map-street") || {}).value || "";
      const city = (document.getElementById("map-city") || {}).value || "";
      const zip = (document.getElementById("map-zip") || {}).value || "";
      const q = [street, city, zip ? zip + " MN" : "Minnesota", "USA"].filter(Boolean).join(", ");
      setResultsHtml("<p class=\"muted\">Finding address…</p>");
      fetch("/api/geocode?q=" + encodeURIComponent(q))
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!data.ok || !data.lat) {
            setResultsHtml(
              "<p class=\"muted\">Address not found. Try a Stillwater or Forest Lake street, or click the map.</p>"
            );
            return;
          }
          placePin(data.lat, data.lng, data.display_name || q);
        })
        .catch(function () {
          setResultsHtml("<p class=\"muted\">Geocoding unavailable. Click the map near your area.</p>");
        });
    });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
