/* ============================================================
   The index — DESIGN-SYSTEM §8 and §12.

   "The list responds; the page does not perform."
   A facet click re-typesets the list in place: the query header
   and count update, the facet inverts, the URL updates. No page
   transition, no loading state, no animation of rows.
   ============================================================ */

(function () {
  "use strict";

  var PAGE_SIZE = 20;                       // §8: "next 20 →"
  var MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var WRITING_KINDS = ["essay", "note", "field note", "playbook"];

  var root = document.querySelector("[data-index]");
  if (!root) return;

  var scope = root.getAttribute("data-scope") || "all";   // all | writing | projects
  var entries = (window.ENTRIES || []).slice();

  /* --- Scope: /writing and /projects are pre-filtered index states --- */

  function inScope(e) {
    if (scope === "writing")  return WRITING_KINDS.indexOf(e.kind) !== -1;
    if (scope === "projects") return e.kind === "project";
    return true;
  }
  var universe = entries.filter(inScope);

  /* --- Query state ------------------------------------------ */

  function readQuery() {
    var p = new URLSearchParams(location.search);
    return {
      kind:  p.get("kind")  || null,
      subj:  p.get("subj")  || null,
      ctx:   p.get("ctx")   || null,
      year:  p.get("year")  || null,
      has:   p.get("has")   || null,
      order: p.get("order") === "oldest" ? "oldest" : "newest",
      page:  Math.max(1, parseInt(p.get("page"), 10) || 1)
    };
  }

  function writeQuery(q, replace) {
    var p = new URLSearchParams();
    if (q.kind)  p.set("kind", q.kind);
    if (q.subj)  p.set("subj", q.subj);
    if (q.ctx)   p.set("ctx", q.ctx);
    if (q.year)  p.set("year", q.year);
    if (q.has)   p.set("has", q.has);
    if (q.order === "oldest") p.set("order", "oldest");
    if (q.page > 1) p.set("page", String(q.page));
    var s = p.toString();
    var url = location.pathname + (s ? "?" + s : "");
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  }

  var query = readQuery();

  /* --- Filtering -------------------------------------------- */

  function matches(e, q) {
    if (q.kind && e.kind !== q.kind) return false;
    if (q.subj && (e.subjects || []).indexOf(q.subj) === -1) return false;
    if (q.ctx && e.ctx !== q.ctx) return false;
    if (q.year && e.date.slice(0, 4) !== q.year) return false;
    if (q.has === "plates" && !(e.plates > 0)) return false;
    return true;
  }

  function results(q) {
    var out = universe.filter(function (e) { return matches(e, q); });
    out.sort(function (a, b) {
      return q.order === "oldest" ? a.date.localeCompare(b.date)
                                  : b.date.localeCompare(a.date);
    });
    return out;
  }

  /* Count for a facet value, honouring the rest of the live query.
     §8: counts are always shown. */
  function countFor(field, value) {
    var probe = {
      kind: query.kind, subj: query.subj, year: query.year,
      ctx: query.ctx, has: query.has, order: query.order, page: 1
    };
    probe[field] = value;
    return universe.filter(function (e) { return matches(e, probe); }).length;
  }

  /* --- Formatting — §1. `·` is the only separator. ----------- */

  function fmtDate(iso) {
    var p = iso.split("-");
    return MONTHS[parseInt(p[1], 10) - 1] + " " + p[2];
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function thirdOrder(e) {
    var bits = [];
    if (e.ctx)    bits.push("ctx: " + e.ctx);
    if (e.series) bits.push("series: " + e.series);
    if (e.status) bits.push(e.status);
    return bits;
  }

  /* --- Row — §8. One pattern, used for every kind. ----------- */

  function row(e) {
    var a = el("a", "entry");
    a.href = e.slug;

    a.appendChild(el("span", "entry-title", e.title));
    a.appendChild(el("span", "entry-meta", e.kind.toUpperCase() + " · " + fmtDate(e.date)));

    var subj = el("span", "entry-subj");
    var parts = (e.subjects || []).slice();
    subj.appendChild(document.createTextNode(parts.join(" · ")));
    thirdOrder(e).forEach(function (t) {
      if (parts.length || subj.textContent) subj.appendChild(document.createTextNode(" · "));
      subj.appendChild(el("span", "third", t));
    });
    a.appendChild(subj);

    /* Mobile — §11: one mono line combining kind, date and subjects. */
    var line = el("span", "entry-line");
    line.appendChild(document.createTextNode(e.kind.toUpperCase() + " · " + fmtDate(e.date)));
    if (parts.length) {
      line.appendChild(document.createTextNode(" · "));
      line.appendChild(el("span", "subjects", parts.join(", ")));
    }
    a.appendChild(line);

    return a;
  }

  /* --- Query header — §8. Must always reflect the live query. --- */

  function describe(q) {
    var bits = [];
    if (q.kind) bits.push(q.kind);
    else if (scope === "writing")  bits.push("writing");
    else if (scope === "projects") bits.push("projects");
    else bits.push("all");
    if (q.subj) bits.push(q.subj);
    if (q.ctx)  bits.push("ctx: " + q.ctx);
    if (q.year) bits.push(q.year);
    if (q.has === "plates") bits.push("with artifacts");
    bits.push(q.order === "oldest" ? "oldest first" : "newest first");
    return "showing " + bits.join(" · ");
  }

  /* --- Facet rail ------------------------------------------- */

  function facetButton(field, value, labelText, count, isActive) {
    var b = el("button", "facet");
    b.type = "button";
    b.textContent = count === null ? labelText : labelText + " · " + count;
    b.setAttribute("aria-pressed", isActive ? "true" : "false");
    b.addEventListener("click", function () {
      /* Facets compose; clicking an active facet removes it. §12 */
      query[field] = isActive ? null : value;
      query.page = 1;
      writeQuery(query, false);
      render();
    });
    return b;
  }

  /* Declared taxonomy order first, then anything unlisted, by count. §8 */
  function ordered(values, declared, field) {
    var known = (declared || []).filter(function (v) { return values.indexOf(v) !== -1; });
    var rest  = values.filter(function (v) { return known.indexOf(v) === -1; });
    rest.sort(function (a, b) { return countFor(field, b) - countFor(field, a) || a.localeCompare(b); });
    return known.concat(rest);
  }

  function renderFacets(container, opts) {
    container.textContent = "";

    var kinds = [];
    universe.forEach(function (e) { if (kinds.indexOf(e.kind) === -1) kinds.push(e.kind); });
    kinds = ordered(kinds, (window.TAXONOMY || {}).kinds, "kind");

    /* KIND */
    var kindBlock = el("div", "block");
    kindBlock.appendChild(el("div", "label", "Kind"));
    var kindList = el("div", "facet-list");
    var all = facetButton("kind", null, "all", countFor("kind", null), !query.kind);
    kindList.appendChild(all);
    kinds.forEach(function (k) {
      kindList.appendChild(facetButton("kind", k, k, countFor("kind", k), query.kind === k));
    });
    kindBlock.appendChild(kindList);
    container.appendChild(kindBlock);

    if (opts && opts.kindOnly) return;

    /* SUBJECT */
    var subjects = [];
    universe.forEach(function (e) {
      (e.subjects || []).forEach(function (s) { if (subjects.indexOf(s) === -1) subjects.push(s); });
    });
    subjects = ordered(subjects, (window.TAXONOMY || {}).subjects, "subj");

    var subjBlock = el("div", "block");
    subjBlock.appendChild(el("div", "label", "Subject"));
    var subjList = el("div", "facet-list");
    subjects.forEach(function (s) {
      subjList.appendChild(facetButton("subj", s, s, countFor("subj", s), query.subj === s));
    });
    subjBlock.appendChild(subjList);
    container.appendChild(subjBlock);

    /* YEAR — one wrapped line with `·` separators. §8 */
    var years = [];
    universe.forEach(function (e) {
      var y = e.date.slice(0, 4);
      if (years.indexOf(y) === -1) years.push(y);
    });
    years.sort().reverse();

    var yearBlock = el("div", "block");
    yearBlock.appendChild(el("div", "label", "Year"));
    var yearList = el("div", "facet-list--inline");
    years.forEach(function (y, i) {
      if (i) yearList.appendChild(el("span", "sep", " · "));
      yearList.appendChild(facetButton("year", y, y, null, query.year === y));
    });
    yearBlock.appendChild(yearList);
    container.appendChild(yearBlock);
  }

  /* Mobile strip — §11: kind facets only, truncated with `…`. */
  function renderStrip(container) {
    container.textContent = "";
    var kinds = [];
    universe.forEach(function (e) { if (kinds.indexOf(e.kind) === -1) kinds.push(e.kind); });
    kinds = ordered(kinds, (window.TAXONOMY || {}).kinds, "kind");

    var b = el("button", "facet");
    b.type = "button";
    b.textContent = "all " + countFor("kind", null);
    b.setAttribute("aria-pressed", query.kind ? "false" : "true");
    b.addEventListener("click", function () { query.kind = null; query.page = 1; writeQuery(query, false); render(); });
    container.appendChild(b);

    kinds.forEach(function (k) {
      var active = query.kind === k;
      var n = el("button", "facet");
      n.type = "button";
      n.textContent = k + " " + countFor("kind", k);
      n.setAttribute("aria-pressed", active ? "true" : "false");
      n.addEventListener("click", function () {
        query.kind = active ? null : k; query.page = 1; writeQuery(query, false); render();
      });
      container.appendChild(n);
    });
    /* §11: overflow truncates with `…`. Only shown when the line actually
       overflows — otherwise it would claim entries that do not exist. */
    var ell = el("span", "truncation", "…");
    container.appendChild(ell);
    requestAnimationFrame(function () {
      ell.hidden = container.scrollWidth <= container.clientWidth + 1;
    });
  }


  /* --- Render ----------------------------------------------- */

  var listEl   = root.querySelector("[data-entries]");
  var queryEl  = root.querySelector("[data-query]");
  var countEl  = root.querySelector("[data-count]");
  var pageEl   = root.querySelector("[data-pagination]");
  var railEl   = root.querySelector("[data-facets]");
  var stripEl  = document.querySelector("[data-facet-strip]");

  function render() {
    var all = results(query);
    var start = (query.page - 1) * PAGE_SIZE;
    var page = all.slice(start, start + PAGE_SIZE);

    queryEl.textContent = describe(query);
    countEl.textContent = all.length + (all.length === 1 ? " entry" : " entries");

    listEl.textContent = "";
    if (!page.length) {
      listEl.appendChild(el("div", "empty", "nothing under this query"));
    } else {
      page.forEach(function (e) { listEl.appendChild(row(e)); });
    }

    var more = start + PAGE_SIZE < all.length;
    pageEl.hidden = !more;
    if (more) {
      pageEl.textContent = "";
      var a = el("a", null, "next " + PAGE_SIZE + " →");
      a.href = "#";
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        query.page += 1;
        writeQuery(query, false);
        render();
        window.scrollTo(0, 0);
      });
      pageEl.appendChild(a);
    }

    if (railEl)  renderFacets(railEl, {});
    if (stripEl) renderStrip(stripEl);
    focused = -1;
  }

  window.addEventListener("popstate", function () {
    query = readQuery();
    render();
  });

  /* --- Keyboard — §12 --------------------------------------- */

  var focused = -1;

  function rows() { return Array.prototype.slice.call(listEl.querySelectorAll(".entry")); }

  function setFocus(i) {
    var r = rows();
    r.forEach(function (n) { n.classList.remove("is-focused"); });
    if (i < 0 || i >= r.length) { focused = -1; return; }
    focused = i;
    r[i].classList.add("is-focused");
    r[i].focus({ preventScroll: false });
  }

  document.addEventListener("keydown", function (ev) {
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

    if (ev.key === "/") {                       // focus the index filter
      ev.preventDefault();
      var first = (railEl || stripEl) && (railEl || stripEl).querySelector(".facet");
      if (first) first.focus();
      return;
    }
    if (ev.key === "ArrowDown") { ev.preventDefault(); setFocus(Math.min(focused + 1, rows().length - 1)); return; }
    if (ev.key === "ArrowUp")   { ev.preventDefault(); setFocus(Math.max(focused - 1, 0)); return; }
    if (ev.key === "Enter" && focused > -1) { rows()[focused].click(); return; }
    if (ev.key === "Escape") {                  // clears the query
      query = { kind: null, subj: null, ctx: null, year: null, has: null, order: "newest", page: 1 };
      writeQuery(query, false);
      render();
    }
  });

  render();
})();
