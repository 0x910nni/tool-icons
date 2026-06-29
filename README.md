# Tool Icons

Public icon indexes for Surge iOS and related tools.

## Surge Icon Set

Use this URL in Surge iOS: Custom Icon Sets -> Add Icon Set:

```text
https://raw.githubusercontent.com/0x910nni/tool-icons/main/iconset.json
```

CDN mirror option:

```text
https://cdn.jsdelivr.net/gh/0x910nni/tool-icons@main/iconset.json
```

## Files

- `iconset.json`: Surge-compatible custom icon set index.
- `source-icons.json`: Maintained base source list using Simple Icons slugs.
- `source-icons-extra.json`: Extra variants and custom-source icons, such as white icons and non-Simple-Icons brands.
- `icons/*.png`: Generated 144x144 transparent PNG icons for Surge.
- `scripts/build-png-iconset.mjs`: PNG generator.
- `.github/workflows/build-png-iconset.yml`: GitHub Actions workflow that rebuilds PNG icons.

## Update Flow

Edit `source-icons.json` for the base icon list. Edit `source-icons-extra.json` for variants or custom icon sources. The workflow regenerates `icons/*.png` and `iconset.json` on push to `main`.

Simple Icons entry:

```json
{
  "name": "Claude White",
  "slug": "claude",
  "file": "claude-white",
  "color": "white"
}
```

Custom SVG URL entry:

```json
{
  "name": "ChatGPT White",
  "file": "chatgpt-white",
  "color": "white",
  "sourceUrl": "https://example.com/icon.svg"
}
```

Supported optional fields:

- `file`: output PNG filename without extension.
- `color`: `brand`, `white`, `black`, or a hex color such as `#ffffff`.
- `sourceUrl`: remote SVG source for brands not available in Simple Icons.
- `svgPath`: local SVG source path inside this repository.

Slugs come from Simple Icons: https://github.com/simple-icons/simple-icons/blob/develop/slugs.md

## Notes

Surge iOS did not render SVG icons in testing, so the published icon set points to generated PNG files.
