/* The `/` shortcut on pages that have no index of their own: it returns
   you to the index. §12. The mobile menu is native <details>, no JS. */
(function () {
  "use strict";
  if (document.querySelector("[data-index]")) return;
  document.addEventListener("keydown", function (ev) {
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (ev.key === "/") { ev.preventDefault(); location.href = "/"; }
  });
})();
