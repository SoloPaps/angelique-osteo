/* Active les CSS chargées en media=print une fois le fichier reçu,
   pour qu'elles ne bloquent pas le premier rendu. */
(function () {
  var links = document.querySelectorAll("link[data-async-css]");
  for (var i = 0; i < links.length; i++) {
    (function (link) {
      function enable() {
        if (link.media !== "all") link.media = "all";
      }
      link.addEventListener("load", enable);
      if (link.sheet) enable();
    })(links[i]);
  }
})();

/* Applique le thème avant le premier rendu.
   Choix mémorisé : auto | light | dark. Défaut : auto (prefers-color-scheme). */
(function () {
  var KEY = "ao-theme";
  var LABEL = { auto: "Auto", light: "Clair", dark: "Sombre" };

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark" || v === "auto") return v;
    } catch (e) {}
    return "auto";
  }

  function isDark(choice) {
    if (choice === "dark") return true;
    if (choice === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function apply(choice) {
    var dark = isDark(choice);
    document.documentElement.setAttribute("data-theme", choice);
    document.documentElement.classList.toggle("theme-dark", dark);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#171e1b" : "#7d9d85");
    var nodes = document.querySelectorAll(".theme-choice");
    for (var i = 0; i < nodes.length; i++) {
      var on = nodes[i].getAttribute("data-theme") === choice;
      nodes[i].setAttribute("aria-pressed", on ? "true" : "false");
      var mark = nodes[i].querySelector(".theme-choice-check");
      if (mark) mark.textContent = on ? "✓" : "";
      nodes[i].setAttribute("aria-label", LABEL[nodes[i].getAttribute("data-theme")] + (on ? ", choix actuel" : ""));
    }
  }

  apply(stored());

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function onScheme() {
    if (stored() === "auto") apply("auto");
  }
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", onScheme);
  else if (typeof mq.addListener === "function") mq.addListener(onScheme);

  document.addEventListener("DOMContentLoaded", function () {
    apply(stored());
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".theme-choice") : null;
      if (!btn) return;
      var choice = btn.getAttribute("data-theme");
      if (choice !== "auto" && choice !== "light" && choice !== "dark") return;
      try { localStorage.setItem(KEY, choice); } catch (err) {}
      apply(choice);
    });
  });
})();
