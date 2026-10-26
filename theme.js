// Light/dark toggle. Remembers the choice; otherwise follows the system setting.
(function () {
  const root = document.documentElement;
  try { const saved = localStorage.getItem("theme"); if (saved) root.dataset.theme = saved; } catch (e) {}
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });
})();
