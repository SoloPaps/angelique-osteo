/* Applique le thème avant le premier rendu.
   Choix mémorisé : auto | light | dark. Défaut : auto (prefers-color-scheme). */
(function () {
  var KEY = "ao-theme";
  var NEXT = { auto: "light", light: "dark", dark: "auto" };
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
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var label = btn.querySelector(".theme-toggle-label");
    if (label) label.textContent = LABEL[choice];
    btn.setAttribute(
      "aria-label",
      "Thème : " + LABEL[choice] + ". Passer à " + LABEL[NEXT[choice]] + "."
    );
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
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = NEXT[stored()];
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
    });
  });
})();
