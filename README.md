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

## Notes

The current icon set references Simple Icons CDN URLs with `?size=144`. Those URLs return SVG icons. If Surge iOS does not render SVG icons reliably, convert the icons to PNG and update `iconset.json` to point at hosted PNG assets.

Source: https://github.com/LitoMore/simple-icons-cdn
