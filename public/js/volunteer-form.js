(function () {
  var shirtCb = document.getElementById("wear-shirt");
  var shirtBox = document.getElementById("shirt-size-box");
  var shirtSelect = document.getElementById("shirt-size");
  var contribCb = document.getElementById("want-contrib");
  var contribBox = document.getElementById("contrib-box");
  var teamLeadCb = document.getElementById("team-lead");
  var teamLeadBox = document.getElementById("team-lead-box");
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
  if (teamLeadCb) {
    teamLeadCb.addEventListener("change", function () {
      toggle(teamLeadCb, teamLeadBox);
    });
    toggle(teamLeadCb, teamLeadBox);
  }

  var issueOtherCb = document.getElementById("issue-other");
  var issueOtherBox = document.getElementById("issue-other-box");
  if (issueOtherCb) {
    issueOtherCb.addEventListener("change", function () {
      toggle(issueOtherCb, issueOtherBox);
    });
    toggle(issueOtherCb, issueOtherBox);
  }

  var kits = {
    local_three: {
      title: "Win all three local",
      html:
        "<strong>Pack:</strong> Housley + Stout + Johnson lit (or joint piece)<br/><strong>Events:</strong> all in-district<br/><strong>Team:</strong> priority turf for team leads",
    },
    housley: {
      title: "Karin Housley — SD 33",
      html:
        "<strong>Lit:</strong> Senate 33 on every kit<br/><strong>Events:</strong> all in-district<br/><strong>Shirt:</strong> Housley / SD 33 if available",
    },
    stout: {
      title: "Stacey Stout — HD 33A",
      html:
        "<strong>Lit:</strong> 33A piece<br/><strong>Events:</strong> <a href='/events?district=33A'>33A list</a><br/><strong>Shirt:</strong> Stout / 33A",
    },
    johnson: {
      title: "Jessica L. Johnson — HD 33B",
      html:
        "<strong>Lit:</strong> 33B piece<br/><strong>Events:</strong> <a href='/events?district=33B'>33B list</a><br/><strong>Shirt:</strong> Johnson / 33B",
    },
    lindell: {
      title: "Mike Lindell — Governor",
      html:
        "<strong>Pack:</strong> Governor lit when issued + local slate to incorporate<br/><strong>Events:</strong> district + statewide<br/><strong>Shirt:</strong> if campaign issues",
    },
    gov_gop: {
      title: "Governor — GOP nominee pack",
      html:
        "<strong>Pack:</strong> post-primary governor lit<br/><strong>Events:</strong> full community calendar",
    },
    us_senate: {
      title: "U.S. Senate — GOP",
      html:
        "<strong>Pack:</strong> U.S. Senate GOP lit (post-primary nominee when issued)<br/><strong>Events:</strong> district + nearby with federal palm cards",
    },
    ag: {
      title: "Attorney General — GOP",
      html:
        "<strong>Pack:</strong> AG lit when field / nominee issues<br/><strong>Events:</strong> full-slate tables",
    },
    sos: {
      title: "Secretary of State — GOP",
      html:
        "<strong>Pack:</strong> SOS lit when field / nominee issues<br/><strong>Events:</strong> full-slate tables",
    },
    auditor: {
      title: "State Auditor — GOP",
      html:
        "<strong>Pack:</strong> Auditor lit when field / nominee issues<br/><strong>Events:</strong> full-slate tables",
    },
    emmer: {
      title: "Tom Emmer — MN-06",
      html:
        "<strong>Note:</strong> Most SD 33 is MN-04/08 (SOS).<br/><strong>Pack:</strong> Emmer lit/shirt when campaign provides<br/><strong>Events:</strong> nearby + district",
    },
    stauber: {
      title: "Pete Stauber — MN-08",
      html:
        "<strong>Lit:</strong> Stauber for FL / Hugo / Scandia<br/><strong>Events:</strong> FL, Hugo, Scandia",
    },
    cd4: {
      title: "U.S. House MN-04",
      html:
        "<strong>Lit:</strong> MN-04 GOP (Wikstrom / field) for Stillwater / Mahtomedi<br/><strong>Events:</strong> Lumberjack Days, Main Street",
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
      "<h4 style='margin:0 0 0.5rem'>Your bundle pack preview — lit / events / peers</h4>";
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
      "<p class='muted' style='margin:0'>After submit: pack queued · captains connect you · peer intros for happy hours / breakfasts / lunches · Pulsar/DB after meet if requested · team lead assignment if checked. Statewide/federal lit only when those campaigns provide inventory. Verify filings at candidates.sos.mn.gov.</p>";
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
