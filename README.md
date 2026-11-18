# oleenamak.ca

This is a static personal website. Its text lives in Markdown files under `content/`; GitHub Actions builds the site and publishes it to GitHub Pages when changes are pushed to `main`.

## Update website copy

- `content/home.md` contains the page title, search description, and welcome text.
- `content/profile.md` contains the short bio in the left column.
- `content/team/<section>/_category.md` contains a section's title, team role, short description, icon, and status.
- `content/team/<section>/<entry>.md` contains an entry's title, label, and body. Write the body in Markdown.

For example, edit `content/team/work/american-operator.md`, then commit and push to `main`. The deploy workflow turns the Markdown into the website automatically. Markdown supports paragraphs, headings, lists, links, and emphasis.

## Preview a change locally

Install the dependencies once with `npm install`, then run `npm run build`. Open `_site/index.html` in a browser to see the generated page.

The visual layout and interactions are in `src/index.template.html`, `site.css`, and `site.js`.
