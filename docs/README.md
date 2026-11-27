# UTAC QA Calendar documentation · เอกสารประกอบระบบ

Three guides, one per audience, each in Thai and English.

| Guide | ไทย | English | For |
|---|---|---|---|
| User Guide · คู่มือผู้ใช้ | [th/user-guide.md](th/user-guide.md) | [en/user-guide.md](en/user-guide.md) | QA Planners, QMS Hosts, QA Admins, report users |
| Developer Guide · คู่มือนักพัฒนา | [th/developer-guide.md](th/developer-guide.md) | [en/developer-guide.md](en/developer-guide.md) | Developers maintaining the app |
| IT Handover · คู่มือส่งมอบ IT | [th/it-handover.md](th/it-handover.md) | [en/it-handover.md](en/it-handover.md) | UTAC IT: ownership, releases, security findings |

**HTML version:** open [`index.html`](index.html) in a browser. Each guide is also generated as a printable page next to its Markdown file. Use the search box at the top of any page (or press <kbd>/</kbd>) to search every guide in that language; the home page searches both languages. Search works offline, straight from the files.

## Editing these docs

1. Edit the Markdown in `th/` and `en/`. Change both languages together so they say the same thing.
2. Put screenshots in `images/` with descriptive names, and reference them as `../images/<name>.png "Caption"`.
3. Rebuild the HTML: `npm run docs`. Do not edit the generated `.html` files by hand; the build overwrites them.
4. Commit the Markdown and the regenerated HTML together.

### Refreshing screenshots

After a UI change, regenerate the app screenshots instead of editing images by hand:

```bash
npm run dev                 # leave running
npm run docs:screenshots    # in a second terminal
npm run docs
```

The script opens the dev app in headless Chrome at 1440×900, loads fictional demonstration data dated around today, and overwrites the PNGs in `images/`. It never contacts a real Worker or database. Set `CHROME_PATH` if Chrome is not installed in a standard location. If the UI labels it clicks change, update `scripts/capture-docs-screenshots.mjs`.

```
docs/
├── README.md            this index
├── index.html           HTML home (generated)
├── th/  en/             guides: <name>.md is the source, <name>.html is generated
├── images/              screenshots and the architecture diagram
└── assets/              shared CSS, script, and self-hosted fonts for the HTML
```

The generator is `scripts/build-docs.mjs`. It supports GitHub alerts (`> [!NOTE]`, `> [!WARNING]` …), tables, code blocks, and images with a title as their caption.
