// ---------- Mode sombre (mémorisé) ----------
(function () {
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("theme");
    if (saved) root.setAttribute("data-theme", saved);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.setAttribute("data-theme", "dark");
    }
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", function () {
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
      });
    }

    // ---------- Menu mobile ----------
    var menuBtn = document.getElementById("menu-toggle");
    var nav = document.getElementById("main-nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    // ---------- Filtre de modules (accueil) ----------
    var filterBtns = document.querySelectorAll(".filters button");
    var cards = document.querySelectorAll("#cards .card");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        var f = btn.getAttribute("data-filter");
        cards.forEach(function (c) {
          c.style.display = (f === "all" || c.getAttribute("data-cat") === f) ? "" : "none";
        });
      });
    });

    initQuiz();
    initChecklist();
    initSortViz();
    initConverters();
  });
})();

// ---------- Quiz de cybersécurité ----------
function initQuiz() {
  var form = document.getElementById("quiz-form");
  if (!form) return;

  var questions = [
    {
      q: "Vous recevez un e-mail de votre « banque » qui demande de cliquer sur un lien pour confirmer votre mot de passe. Que faites-vous ?",
      options: [
        "Je clique vite, c'est sûrement urgent",
        "Je n'ouvre pas le lien et je contacte ma banque par ses canaux officiels",
        "Je transfère l'e-mail à mes amis pour les prévenir sans le supprimer"
      ],
      answer: 1,
      explain: "C'est du hameçonnage (phishing). Une banque ne demande jamais votre mot de passe par e-mail."
    },
    {
      q: "Quel mot de passe est le plus robuste ?",
      options: ["azerty123", "MonPrenom2005", "Tr0ubl3-Cafe-Violet-Nuage!"],
      answer: 2,
      explain: "Une phrase de passe longue et unique résiste bien mieux aux attaques qu'un mot court ou prévisible."
    },
    {
      q: "À quoi sert l'authentification à deux facteurs (2FA) ?",
      options: [
        "À accélérer la connexion",
        "À ajouter une seconde preuve d'identité en plus du mot de passe",
        "À remplacer l'antivirus"
      ],
      answer: 1,
      explain: "Même si votre mot de passe est volé, l'attaquant ne peut pas se connecter sans le second facteur."
    },
    {
      q: "Quel type de logiciel malveillant chiffre vos fichiers puis réclame une rançon ?",
      options: ["Un spyware", "Un ransomware", "Un ver"],
      answer: 1,
      explain: "Le ransomware (rançongiciel) bloque l'accès à vos données jusqu'au paiement. Des sauvegardes régulières sont la meilleure protection."
    },
    {
      q: "Sur un Wi-Fi public (café, gare), que faut-il éviter ?",
      options: [
        "Lire un article de presse",
        "Se connecter à sa banque sans protection supplémentaire",
        "Utiliser un VPN"
      ],
      answer: 1,
      explain: "Un réseau public peut être espionné : évitez les opérations sensibles ou utilisez un VPN."
    }
  ];

  questions.forEach(function (item, i) {
    var div = document.createElement("div");
    div.className = "q";
    var html = "<p><strong>" + (i + 1) + ". " + item.q + "</strong></p>";
    item.options.forEach(function (opt, j) {
      html += '<label><input type="radio" name="q' + i + '" value="' + j + '"> ' + opt + "</label>";
    });
    html += '<div class="feedback" id="fb' + i + '" aria-live="polite"></div>';
    div.innerHTML = html;
    form.appendChild(div);
  });

  var btn = document.createElement("button");
  btn.type = "submit";
  btn.className = "btn-primary";
  btn.textContent = "Valider mes réponses";
  form.appendChild(btn);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var score = 0;
    questions.forEach(function (item, i) {
      var chosen = form.querySelector('input[name="q' + i + '"]:checked');
      var fb = document.getElementById("fb" + i);
      if (!chosen) {
        fb.className = "feedback ko";
        fb.textContent = "Pas de réponse. " + item.explain;
      } else if (parseInt(chosen.value, 10) === item.answer) {
        score++;
        fb.className = "feedback ok";
        fb.textContent = "Correct. " + item.explain;
      } else {
        fb.className = "feedback ko";
        fb.textContent = "Incorrect. " + item.explain;
      }
    });
    var res = document.getElementById("quiz-result");
    res.textContent = "Score : " + score + " / " + questions.length;
  });
}

// ---------- Checklist « Suis-je bien protégé ? » ----------
function initChecklist() {
  var box = document.getElementById("checklist");
  if (!box) return;
  var bar = document.querySelector("#check-progress > div");
  var txt = document.getElementById("check-text");
  function update() {
    var all = box.querySelectorAll('input[type="checkbox"]');
    var done = box.querySelectorAll('input[type="checkbox"]:checked').length;
    var pct = Math.round((done / all.length) * 100);
    bar.style.width = pct + "%";
    var msg = pct === 100 ? "Excellent, vous appliquez toutes les bonnes pratiques."
      : pct >= 60 ? "Bien, mais il reste des points à améliorer."
      : "Attention, votre protection est insuffisante.";
    txt.textContent = done + " / " + all.length + " (" + pct + " %) — " + msg;
  }
  box.addEventListener("change", update);
  update();
}

// ---------- Visualisation du tri à bulles ----------
function initSortViz() {
  var container = document.getElementById("bars");
  if (!container) return;
  var values = [];
  var running = false;

  function newArray() {
    values = [];
    for (var i = 0; i < 14; i++) values.push(Math.floor(Math.random() * 90) + 10);
    draw();
  }
  function draw(active, sortedFrom) {
    container.innerHTML = "";
    values.forEach(function (v, i) {
      var d = document.createElement("div");
      d.style.height = v + "%";
      if (active && (i === active[0] || i === active[1])) d.className = "active";
      if (sortedFrom !== undefined && i >= sortedFrom) d.className = "sorted";
      container.appendChild(d);
    });
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function bubbleSort() {
    if (running) return;
    running = true;
    var n = values.length;
    for (var i = 0; i < n - 1; i++) {
      for (var j = 0; j < n - i - 1; j++) {
        draw([j, j + 1], n - i);
        await sleep(120);
        if (values[j] > values[j + 1]) {
          var t = values[j]; values[j] = values[j + 1]; values[j + 1] = t;
          draw([j, j + 1], n - i);
          await sleep(120);
        }
      }
    }
    draw(null, 0);
    running = false;
  }

  document.getElementById("sort-new").addEventListener("click", function () { if (!running) newArray(); });
  document.getElementById("sort-run").addEventListener("click", bubbleSort);
  newArray();
}

// ---------- Convertisseurs binaire / hexadécimal ----------
function initConverters() {
  var dec = document.getElementById("conv-dec");
  if (!dec) return;
  var out = document.getElementById("conv-out");
  document.getElementById("conv-btn").addEventListener("click", function () {
    var n = parseInt(dec.value, 10);
    if (isNaN(n) || n < 0 || n > 65535) {
      out.textContent = "Entrez un entier entre 0 et 65535.";
      return;
    }
    out.textContent = n + " (décimal) = " + n.toString(2) + " (binaire) = 0x" + n.toString(16).toUpperCase() + " (hexadécimal)";
  });
}
