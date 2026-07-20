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
      title: "Karin Housley — Senate District 33 (full district)",
      html:
        "<strong>Lit:</strong> Senate 33 on every door across all SD 33 communities<br/><strong>Events:</strong> all in-district cities and townships<br/><strong>Shirt:</strong> Housley / SD 33 if available",
    },
    stout: {
      title: "Stacey Stout — House District 33A (full district)",
      html:
        "<strong>Lit:</strong> Dellwood; Forest Lake P-2/4/5; Grant P-2; Hugo; Mahtomedi; Willernie<br/><strong>Events:</strong> <a href='/events?district=33A'>33A list</a><br/><strong>Shirt:</strong> Stout / 33A",
    },
    johnson: {
      title: "Jessica L. Johnson — House District 33B (full district)",
      html:
        "<strong>Lit:</strong> Bayport; Forest Lake P-1/3; Marine; May Twp; Oak Park Heights; Scandia; Stillwater; Stillwater Twp<br/><strong>Events:</strong> <a href='/events?district=33B'>33B list</a><br/><strong>Shirt:</strong> Johnson / 33B",
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
      title: "Pete Stauber — MN-08 (SD 33 portion)",
      html:
        "<strong>Lit:</strong> Forest Lake; Hugo; Marine on St. Croix; May Township; Scandia; Stillwater Twp P-1<br/><strong>Events:</strong> all MN-08 communities in SD 33",
    },
    cd4: {
      title: "U.S. House MN-04 (SD 33 portion)",
      html:
        "<strong>Lit:</strong> Bayport; Dellwood; Mahtomedi; Oak Park Heights; Stillwater; Willernie; parts of Stillwater Twp<br/><strong>Events:</strong> all MN-04 communities in SD 33",
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
