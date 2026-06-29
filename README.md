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
- `source-icons.json`: Maintained source list using Simple Icons slugs.
- `icons/*.png`: Generated 144x144 transparent PNG icons for Surge.
- `scripts/build-png-iconset.mjs`: PNG generator.
- `.github/workflows/build-png-iconset.yml`: GitHub Actions workflow that rebuilds PNG icons.

## Update Flow

Edit `source-icons.json` to add, remove, or rename icons. The workflow will regenerate `icons/*.png` and `iconset.json` on push to `main`.

Each source icon entry should look like this:

```json
{
  "name": "Claude",
  "slug": "claude"
}
```

Slugs come from Simple Icons: https://github.com/simple-icons/simple-icons/blob/develop/slugs.md

## Notes

Surge iOS did not render SVG icons in testing, so the published icon set points to generated PNG files instead of Simple Icons CDN SVG URLs.
