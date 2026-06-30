import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import * as simpleIcons from 'simple-icons';

const owner = process.env.GITHUB_REPOSITORY?.split('/')[0] ?? '0x910nni';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'tool-icons';
const branch = process.env.GITHUB_REF_NAME ?? 'main';
const rawBase = process.env.RAW_BASE ?? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

const iconsetPath = 'iconset.json';
const sourcePath = 'source-icons.json';
const extraSourcePath = 'source-icons-extra.json';
const outputDir = 'icons';

const iconsBySlug = new Map(
  Object.values(simpleIcons)
    .filter((icon) => icon && typeof icon === 'object' && icon.slug && icon.svg)
    .map((icon) => [icon.slug, icon]),
);

function slugFromUrl(url) {
  const match = String(url).match(/cdn\.simpleicons\.org\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function sanitizeFileName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fileBaseForIcon(icon) {
  const raw = icon.file ?? icon.slug ?? icon.name;
  const fileBase = sanitizeFileName(raw);
  if (!fileBase) {
    throw new Error(`Invalid file name for icon: ${JSON.stringify(icon)}`);
  }
  return fileBase;
}

function uniqueIcons(icons) {
  const seen = new Set();
  const result = [];
  for (const icon of icons) {
    const normalized = normalizeIcon(icon);
    const key = fileBaseForIcon(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function normalizeIcon(icon) {
  return {
    name: icon.name,
    slug: icon.slug,
    file: icon.file,
    color: icon.color,
    svgPath: icon.svgPath,
    sourceUrl: icon.sourceUrl,
  };
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function readOptionalSourceFile(file) {
  try {
    const source = await readJson(file);
    return source.icons.map(normalizeIcon);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function loadCoreIcons() {
  const sourceIcons = await readOptionalSourceFile(sourcePath);
  if (sourceIcons.length > 0) return sourceIcons;

  const iconset = await readJson(iconsetPath);
  return iconset.icons.map((icon) => ({
    name: icon.name,
    slug: slugFromUrl(icon.url),
  }));
}

async function loadSourceIcons() {
  const coreIcons = await loadCoreIcons();
  const extraIcons = await readOptionalSourceFile(extraSourcePath);
  return uniqueIcons([...coreIcons, ...extraIcons]);
}

function colorForIcon(icon, simpleIcon) {
  if (!icon.color || icon.color === 'brand') {
    return simpleIcon?.hex ? `#${simpleIcon.hex}` : null;
  }

  if (icon.color === 'white') return '#ffffff';
  if (icon.color === 'black') return '#000000';
  return icon.color;
}

function applySvgSize(svg) {
  return svg.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    const cleanedAttrs = attrs
      .replace(/\swidth="[^"]*"/gi, '')
      .replace(/\sheight="[^"]*"/gi, '');
    return `<svg width="144" height="144"${cleanedAttrs}>`;
  });
}

function forceSvgColor(svg, color) {
  if (!color) return svg;

  let recolored = svg
    .replaceAll('currentColor', color)
    .replace(/fill="(?!none\b)[^"]*"/gi, `fill="${color}"`)
    .replace(/stroke="(?!none\b)[^"]*"/gi, `stroke="${color}"`)
    .replace(/fill:\s*(?!none\b)[^;"']+/gi, `fill:${color}`)
    .replace(/stroke:\s*(?!none\b)[^;"']+/gi, `stroke:${color}`);

  if (/^<svg\s/i.test(recolored) && !/^<svg\s[^>]*\bfill=/i.test(recolored)) {
    recolored = recolored.replace('<svg ', `<svg fill="${color}" `);
  }

  return recolored;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'pod042-tool-icons-builder/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function svgForIcon(icon) {
  if (icon.svgPath) {
    const svg = await fs.readFile(icon.svgPath, 'utf8');
    return { svg, color: colorForIcon(icon, null) };
  }

  if (icon.sourceUrl) {
    const svg = await fetchText(icon.sourceUrl);
    return { svg, color: colorForIcon(icon, null) };
  }

  const simpleIcon = iconsBySlug.get(icon.slug);
  if (!simpleIcon) {
    throw new Error(`Missing simple-icons entry for slug: ${icon.slug}`);
  }

  return {
    svg: simpleIcon.svg,
    color: colorForIcon(icon, simpleIcon),
  };
}

async function buildIcon(icon) {
  const { svg, color } = await svgForIcon(icon);
  const fileBase = fileBaseForIcon(icon);
  const outputPath = path.join(outputDir, `${fileBase}.png`);
  const preparedSvg = applySvgSize(forceSvgColor(svg, color));

  await sharp(Buffer.from(preparedSvg), { density: 384 })
    .resize(144, 144, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  return {
    name: icon.name,
    url: `${rawBase}/icons/${fileBase}.png`,
  };
}

const sourceIcons = await loadSourceIcons();
if (sourceIcons.length === 0) {
  throw new Error('No source icons found.');
}

await fs.mkdir(outputDir, { recursive: true });

const builtIcons = [];
for (const icon of sourceIcons) {
  builtIcons.push(await buildIcon(icon));
}

await fs.writeFile(iconsetPath, `${JSON.stringify({
  name: 'Pod042 Network Service Icons',
  description: 'Network-service oriented brand icons for Surge policy groups. PNG icons generated from Simple Icons and curated custom SVG sources.',
  icons: builtIcons,
}, null, 2)}\n`);

console.log(`Built ${builtIcons.length} PNG icons.`);
