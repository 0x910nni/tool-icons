import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const owner = process.env.GITHUB_REPOSITORY?.split('/')[0] ?? '0x910nni';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'tool-icons';
const branch = process.env.GITHUB_REF_NAME ?? 'main';
const rawBase = process.env.RAW_BASE ?? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

const iconsetPath = 'iconset.json';
const sourcePath = 'source-icons.json';
const outputDir = 'icons';

function slugFromUrl(url) {
  const match = String(url).match(/cdn\.simpleicons\.org\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function uniqueIcons(icons) {
  const seen = new Set();
  const result = [];
  for (const icon of icons) {
    if (!icon.slug || seen.has(icon.slug)) continue;
    seen.add(icon.slug);
    result.push(icon);
  }
  return result;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function loadSourceIcons() {
  try {
    const source = await readJson(sourcePath);
    return uniqueIcons(source.icons.map((icon) => ({
      name: icon.name,
      slug: icon.slug,
    })));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const iconset = await readJson(iconsetPath);
  const icons = iconset.icons.map((icon) => ({
    name: icon.name,
    slug: slugFromUrl(icon.url),
  }));
  return uniqueIcons(icons);
}

async function fetchSvg(slug) {
  const response = await fetch(`https://cdn.simpleicons.org/${slug}?size=144`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${slug}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function buildIcon(icon) {
  const svg = await fetchSvg(icon.slug);
  const outputPath = path.join(outputDir, `${icon.slug}.png`);
  await sharp(svg, { density: 384 })
    .resize(144, 144, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  return {
    name: icon.name,
    url: `${rawBase}/icons/${icon.slug}.png`,
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

await fs.writeFile(sourcePath, `${JSON.stringify({ icons: sourceIcons }, null, 2)}\n`);
await fs.writeFile(iconsetPath, `${JSON.stringify({
  name: 'Pod042 Network Service Icons',
  description: 'Network-service oriented brand icons for Surge policy groups. PNG icons generated from Simple Icons CDN.',
  icons: builtIcons,
}, null, 2)}\n`);

console.log(`Built ${builtIcons.length} PNG icons.`);
