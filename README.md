# oleenamak.ca

This is a static personal website. Its text lives in Markdown files under `content/`; GitHub Actions builds the site and publishes it to GitHub Pages when changes are pushed to `main`.

## Update website copy

- `content/home.md` contains the page title, search description, and welcome text.
- `content/profile.md` contains the short bio in the left column.
- `content/team/<section>/_category.md` contains a section's title, team role, short description, icon, and status.
- `content/team/<section>/<entry>.md` contains an entry's title, label, and body. Write the body in Markdown.

For example, edit `content/team/work/american-operator.md`, then commit and push to `main`. The deploy workflow turns the Markdown into the website automatically. Markdown supports paragraphs, headings, lists, links, and emphasis. Start a line with `### ` to make a collapsible section: everything under it, up to the next `### ` heading, opens and closes when the heading is clicked. To add an image, put the file in `assets/` and write `![Description](assets/file.jpg)`; wrap it as `[![Description](assets/file.jpg)](https://link)` to make it a link.

## Preview a change locally

Install the dependencies once with `npm install`, then run `npm run build`. Open `_site/index.html` in a browser to see the generated page.

The visual layout and interactions are in `src/index.template.html`, `site.css`, and `site.js`.

## Add a locked prototype

A prototype made for one company lives in its own folder under `locked/`, for example `locked/minoan/`. Put the page in it as `index.html` (link back to the site with `../../`), plus any files it uses. Add an `_unlock.md` listing the passwords that open it:

```
---
keys:
  - minoan
---
```

Visitors type a password into "Unlock your prototype" under Prototypes and go straight to the page, which lives at `oleenamak.ca/<folder>/` (for example `oleenamak.ca/minoan/`). Capitals, spaces and punctuation don't matter. Extra passwords each get a short page that forwards to the folder. Nothing on the site links to these pages, but this repository is public, so anyone reading it on GitHub can see them.
