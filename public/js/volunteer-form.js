(function () {
  var shirtCb = document.getElementById("wear-shirt");
  var shirtBox = document.getElementById("shirt-size-box");
  var shirtSelect = document.getElementById("shirt-size");
  var contribCb = document.getElementById("want-contrib");
  var contribBox = document.getElementById("contrib-box");
  var kit = document.getElementById("campaign-kit");
  var form = document.getElementById("vol-form");

  function toggle(cb, box) {
    if (!cb || !box) return;
    if (cb.checked) box.classList.add("is-open");
    else box.classList.remove("is-open");
  }

  function syncShirt() {
    toggle(shirtCb, shirtBox);
    if (!shirtSelect) return;
    if (shirtCb && shirtCb.checked) {
      shirtSelect.setAttribute("required", "required");
    } else {
      shirtSelect.removeAttribute("required");
      shirtSelect.value = "";
    }
  }

  if (shirtCb) {
    shirtCb.addEventListener("change", syncShirt);
    syncShirt();
  }
  if (contribCb) {
    contribCb.addEventListener("change", function () {
      toggle(contribCb, contribBox);
    });
    toggle(contribCb, contribBox);
  }

  var kits = {
    housley: {
      title: "Karin Housley — SD 33",
      html:
        "<strong>Lit:</strong> Senate 33 on every kit<br/><strong>Events:</strong> all in-district<br/><strong>Shirt:</strong> Housley / SD 33 if available",
    },
    stout: {
      title: "Stacey Stout — HD 33A",
      html:
        "<strong>Lit:</strong> 33A piece<br/><strong>Events:</strong> <a href='/events?district=33A'>33A list</a> (Hugo, Mahtomedi, FL 33A)<br/><strong>Shirt:</strong> Stout / 33A",
    },
    johnson: {
      title: "Jessica L. Johnson — HD 33B",
      html:
        "<strong>Lit:</strong> 33B piece<br/><strong>Events:</strong> <a href='/events?district=33B'>33B list</a> + Lumberjack Days<br/><strong>Shirt:</strong> Johnson / 33B",
    },
    lindell: {
      title: "Mike Lindell — Governor",
      html:
        "<strong>Auto kit:</strong> Governor lit when campaign issues it + local SD 33 slate to incorporate<br/><strong>Events:</strong> community + statewide governor presence<br/><strong>Shirt:</strong> Lindell shirt if that campaign issues inventory (enter size above)",
    },
    emmer: {
      title: "Tom Emmer — MN-06",
      html:
        "<strong>Note:</strong> Most SD 33 addresses are MN-04 or MN-08 (SOS), not MN-06. We’ll still connect you to Emmer’s team.<br/><strong>Auto kit:</strong> Emmer lit/shirt when that campaign provides inventory for you to incorporate<br/><strong>Events:</strong> nearby / ticket + district events list",
    },
    stauber: {
      title: "Pete Stauber — MN-08",
      html:
        "<strong>Lit:</strong> Stauber for Forest Lake / Hugo / Scandia turf<br/><strong>Events:</strong> FL, Hugo, Scandia<br/><strong>Shirt:</strong> if available",
    },
    cd4: {
      title: "U.S. House MN-04",
      html:
        "<strong>Lit:</strong> MN-04 GOP field lit for Stillwater / Mahtomedi area<br/><strong>Events:</strong> Stillwater Main Street, Lumberjack Days",
    },
  };

  function renderKits() {
    if (!kit) return;
    var cbs = document.querySelectorAll(".campaign-cb:checked");
    if (!cbs.length) {
      kit.classList.remove("is-open");
      kit.innerHTML = "";
      return;
    }
    var html =
      "<h4 style='margin:0 0 0.5rem'>Your selected campaigns — lit / events / shirts</h4>";
    for (var i = 0; i < cbs.length; i++) {
      var k = kits[cbs[i].value];
      if (!k) continue;
      html +=
        "<div style='margin-bottom:0.65rem'><strong>" +
        k.title +
        "</strong><br/>" +
        k.html +
        "</div>";
    }
    html +=
      "<p class='muted' style='margin:0'>After you submit, captains are notified to reach out, connect you to preferred candidates, and issue gear. Lindell / Emmer / federal inventory only when that campaign provides it.</p>";
    kit.innerHTML = html;
    kit.classList.add("is-open");
  }

  var camp = document.querySelectorAll(".campaign-cb");
  for (var j = 0; j < camp.length; j++) {
    camp[j].addEventListener("change", renderKits);
  }
  renderKits();

  if (form) {
    form.addEventListener("submit", function (e) {
      if (shirtCb && shirtCb.checked && shirtSelect && !shirtSelect.value) {
        e.preventDefault();
        syncShirt();
        shirtSelect.focus();
        alert("Please select a shirt size if you can wear a campaign shirt.");
      }
    });
  }
})();
