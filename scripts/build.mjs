import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, rm, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const root = process.cwd();
const output = path.join(root, '_site');
const allowedIcons = new Set(['work', 'side-bets', 'training', 'writing']);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

async function readMarkdown(file) {
  const source = await readFile(file, 'utf8');
  const parsed = matter(source);
  return { data: parsed.data, body: parsed.content.trim() };
}

async function markdownFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(directory, entry.name));
}

function sortedByOrder(items) {
  return items.sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0));
}

function entrySlug(file) {
  return path.basename(file, '.md');
}

// A "### Heading" in an entry starts a collapsible section that runs until the next
// heading of that level, a horizontal rule, or the end of the entry.
function collapsibleSections(html) {
  const parts = html.split(/(<h3>[\s\S]*?<\/h3>)/);
  let out = parts[0];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].replace(/^<h3>|<\/h3>$/g, '');
    const rest = parts[i + 1] ?? '';
    const cut = rest.search(/<hr\s*\/?>/);
    const body = cut === -1 ? rest : rest.slice(0, cut);
    const after = cut === -1 ? '' : rest.slice(cut);
    out += `<details class="toggle"><summary>${title}</summary><div class="toggle-body">${body.trim()}</div></details>${after}`;
  }
  return out;
}

function renderEntry(category, entry) {
  const slug = entrySlug(entry.file);
  const body = entry.body === 'Under construction.'
    ? '<p class="soon">Under construction.</p>'
    : collapsibleSections(marked.parse(entry.body));
  return `
        <article id="${category.slug}/${slug}">
          <a class="back" href="#${category.slug}">${escapeHtml(category.data.title)}</a>
          <h3 tabindex="-1">${escapeHtml(entry.data.title)}</h3>
          <p class="meta">${escapeHtml(entry.data.meta)}</p>
          <div class="entry-content">${body}</div>
        </article>`;
}

function renderCategoryNavigation(category) {
  return `
      <a href="#${category.slug}" data-folder="${category.slug}"><span class="who"><svg class="bot" aria-hidden="true"><use href="#bot-${category.data.icon}"/></svg><span class="who-text"><span>${escapeHtml(category.data.title)}</span><small>${escapeHtml(category.data.agent)}</small></span></span><span class="count">${category.entries.length}</span></a>`;
}

function renderCategory(category) {
  const list = category.entries.map((entry) => {
    const slug = entrySlug(entry.file);
    return `
          <li><a href="#${category.slug}/${slug}"><span class="row-title">${escapeHtml(entry.data.title)}</span><span class="row-meta">${escapeHtml(entry.data.meta)}</span></a></li>`;
  }).join('');
  const articles = category.entries.map((entry) => renderEntry(category, entry)).join('');
  return `
    <section class="folder" id="${category.slug}" data-folder="${category.slug}">
      <header class="agent">
        <svg class="bot" aria-hidden="true"><use href="#bot-${category.data.icon}"/></svg>
        <div class="agent-id"><p class="agent-name">${escapeHtml(category.data.agent)}</p><p class="agent-job">${escapeHtml(category.data.description)}</p></div>
        <p class="agent-status"><i></i>${escapeHtml(category.data.status)}</p>
      </header>
      <div class="list">
        <a class="back" href="#">My team</a>
        <h2 class="folder-title" tabindex="-1">${escapeHtml(category.data.title)}</h2>
        <ul>${list}
        </ul>
      </div>
      <div class="entries">${articles}
      </div>
    </section>`;
}

const home = await readMarkdown(path.join(root, 'content/home.md'));
const profile = await readMarkdown(path.join(root, 'content/profile.md'));
const teamDirectory = path.join(root, 'content/team');
const categoryFolders = await readdir(teamDirectory, { withFileTypes: true });
const categories = [];

for (const folder of categoryFolders.filter((entry) => entry.isDirectory())) {
  const slug = folder.name;
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid category folder name: ${slug}`);
  const directory = path.join(teamDirectory, slug);
  const dataFile = path.join(directory, '_category.md');
  const category = await readMarkdown(dataFile);
  if (!allowedIcons.has(category.data.icon)) throw new Error(`Unknown icon in ${dataFile}`);
  const entries = sortedByOrder(await Promise.all((await markdownFiles(directory))
    .filter((file) => path.basename(file) !== '_category.md')
    .map(async (file) => ({ file, ...await readMarkdown(file) }))));
  for (const entry of entries) {
    if (!/^[a-z0-9-]+$/.test(entrySlug(entry.file))) throw new Error(`Invalid entry filename: ${entry.file}`);
    if (!entry.data.title || !entry.data.meta) throw new Error(`Entry needs title and meta: ${entry.file}`);
  }
  categories.push({ slug, data: category.data, entries });
}

sortedByOrder(categories);
const template = await readFile(path.join(root, 'src/index.template.html'), 'utf8');
const css = await readFile(path.join(root, 'site.css'));
const js = await readFile(path.join(root, 'site.js'));
const replacements = {
  '{{home.title}}': escapeHtml(home.data.title),
  '{{home.description}}': escapeHtml(home.data.description),
  '{{home.welcome}}': escapeHtml(home.data.welcome),
  '{{home.hint}}': escapeHtml(home.data.hint),
  '{{profile.name}}': escapeHtml(profile.data.name),
  '{{profile.role}}': escapeHtml(profile.data.role),
  '{{profile.lede}}': escapeHtml(profile.data.lede),
  '{{profile.body}}': marked.parse(profile.body),
  '{{teamNavigation}}': `    <nav class="folders" aria-label="My team">\n      <p class="team-label">My team</p>${categories.map(renderCategoryNavigation).join('')}\n    </nav>`,
  '{{teamSections}}': categories.map(renderCategory).join('\n'),
  '{{cssVersion}}': createHash('sha256').update(css).digest('hex').slice(0, 8),
  '{{jsVersion}}': createHash('sha256').update(js).digest('hex').slice(0, 8),
};

let html = template;
for (const [placeholder, value] of Object.entries(replacements)) html = html.replaceAll(placeholder, value);
if (/\{\{[^}]+\}\}/.test(html)) throw new Error('Unfilled template placeholder remains in index.html');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'index.html'), html);
for (const file of ['site.css', 'site.js', 'favicon.png', 'apple-touch-icon.png', '404.html', 'CNAME', '.nojekyll']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
console.log(`Built ${path.relative(root, output)} with ${categories.length} sections and ${categories.reduce((sum, category) => sum + category.entries.length, 0)} entries.`);
