// Renders the daily-builds calendar from BUILDS (builds.js), newest month first,
// and opens a small spec window when a build is clicked.
(function () {
  const DAY = 86400000;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayNo = (d) => Math.round((d - parse(START)) / DAY) + 1;
  const pad3 = (n) => String(n).padStart(3, "0");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const start = parse(START);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const byDate = Object.fromEntries(BUILDS.map((b) => [b.date, b]));

  const thumb = (b) => `<img src="${b.thumb}" alt="" loading="lazy" decoding="async">`;

  // Streak line
  const total = BUILDS.length;
  const days = Math.max(1, dayNo(today));
  document.getElementById("streak").textContent =
    `Day ${days} · ${total} ${total === 1 ? "build" : "builds"} so far`;

  // Months, newest first
  const months = [];
  for (let m = new Date(today.getFullYear(), today.getMonth(), 1); m >= new Date(start.getFullYear(), start.getMonth(), 1); m = new Date(m.getFullYear(), m.getMonth() - 1, 1)) months.push(m);

  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  document.getElementById("months").innerHTML = months.map((m) => {
    const name = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const lead = (m.getDay() + 6) % 7; // Monday-first
    const len = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let cells = "";
    for (let i = 0; i < lead; i++) cells += `<li class="cell blank" aria-hidden="true"></li>`;
    for (let d = 1; d <= len; d++) {
      const date = new Date(m.getFullYear(), m.getMonth(), d);
      const b = byDate[key(date)];
      const isToday = +date === +today;
      const cls = ["cell", b ? "has" : date < start ? "before" : date > today ? "future" : "missed", isToday ? "today" : ""].join(" ").trim();
      if (b) {
        cells += `<li class="${cls}"><button type="button" data-date="${b.date}" aria-label="Day ${dayNo(date)}: ${esc(b.title)}. See details">
          <span class="n">${d}</span><span class="plus" aria-hidden="true">+</span>${thumb(b)}<span class="cap">${esc(b.title)}</span></button></li>`;
      } else {
        cells += `<li class="${cls}"><span class="n">${d}</span></li>`;
      }
    }
    return `<section class="month" aria-label="${name}">
      <div class="sec-head"><h2>${name}</h2>${months[0] === m ? `<span class="hint">Click a build to see what it is</span>` : ""}</div>
      <ol class="cal-head" aria-hidden="true">${wd.map((w) => `<li>${w}</li>`).join("")}</ol>
      <ol class="cal">${cells}</ol>
    </section>`;
  }).join("");

  // Spec window
  const dlg = document.getElementById("spec");
  const open = (b) => {
    const date = parse(b.date);
    document.getElementById("spec-day").textContent =
      `Day ${pad3(dayNo(date))} · ${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`;
    const d = b.demo;
    document.getElementById("spec-art").innerHTML = d
      ? `<img class="on-light" src="${d.light}" alt="${esc(d.alt)}" width="340" height="330"><img class="on-dark" src="${d.dark}" alt="${esc(d.alt)}" width="340" height="330">`
      : thumb(b);
    document.getElementById("spec-title").textContent = b.title;
    const rows = [["What it is", b.what], ["Problem I'm solving", b.problem], ["How it's built", b.built], ["Status", b.status]];
    document.getElementById("spec-body").innerHTML = rows.filter((r) => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
    const a = document.getElementById("spec-link");
    if (b.link) { a.href = b.link.href; a.textContent = `${b.link.label} ↗`; a.hidden = false; } else a.hidden = true;
    dlg.showModal();
  };
  document.getElementById("months").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-date]");
    if (btn) open(byDate[btn.dataset.date]);
  });
  document.getElementById("spec-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // click outside the card
})();
