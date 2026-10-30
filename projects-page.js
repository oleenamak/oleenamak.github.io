// Renders the project list from PROJECTS (projects.js) and opens a small spec window when one is clicked.
(function () {
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmt = (s, opts) => parse(s).toLocaleDateString("en-US", opts);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  document.getElementById("projects").innerHTML = PROJECTS.map((p, i) => `<li>
    <button type="button" data-i="${i}" aria-label="${esc(p.title)}. See details">
      <span class="thumb"><img src="${p.thumb}" alt="" loading="lazy" decoding="async"></span>
      <span class="body"><span class="t">${esc(p.title)}</span><span class="x">${esc(p.summary)}</span><span class="m">${fmt(p.date, { month: "short", year: "numeric" })}</span></span>
    </button></li>`).join("");

  // Spec window
  const dlg = document.getElementById("spec");
  const open = (p) => {
    document.getElementById("spec-day").textContent = fmt(p.date, { month: "short", day: "numeric", year: "numeric" });
    const d = p.demo;
    document.getElementById("spec-art").innerHTML = d
      ? `<img class="on-light" src="${d.light}" alt="${esc(d.alt)}" width="340" height="330"><img class="on-dark" src="${d.dark}" alt="${esc(d.alt)}" width="340" height="330">`
      : `<img src="${p.thumb}" alt="">`;
    document.getElementById("spec-title").textContent = p.title;
    const rows = [["What it is", p.what], ["Problem I'm solving", p.problem], ["How it's built", p.built], ["Status", p.status]];
    document.getElementById("spec-body").innerHTML = rows.filter((r) => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
    const a = document.getElementById("spec-link");
    if (p.link) { a.href = p.link.href; a.textContent = `${p.link.label} ↗`; a.hidden = false; } else a.hidden = true;
    dlg.showModal();
  };
  document.getElementById("projects").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-i]");
    if (btn) open(PROJECTS[btn.dataset.i]);
  });
  document.getElementById("spec-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // click outside the card
})();
