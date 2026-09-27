# oleenamak.ca

Static site served by GitHub Pages from `main`, repo root. `CNAME` claims the domain.

- `index.html` — homepage
- `notes.html` — field notes index
- `note.html?n=<slug>` — a single note, rendered from `notes.json`
- `notes.json` — all note content (title, date, blocks, figures)

Pages are self-contained bundles exported from the design project. To update, re-export and replace these files.

## Publish

```
# from a clone of oleenamak/oleenamak.github.io
git rm -r --quiet . && git clean -fdq
# copy the contents of this folder in, then:
git add -A && git commit -m "New site" && git push
```
