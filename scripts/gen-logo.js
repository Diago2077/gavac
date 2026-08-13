const sharp = require("sharp");
const path = require("path");

const BG = "#0f5132";
const FG = "#ffffff";

function svgFor(size, radiusRatio) {
  const radius = Math.round(size * radiusRatio);
  const fontSize = Math.round(size * 0.62);
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="central"
    font-family="Arial, 'Helvetica Neue', sans-serif" font-weight="700"
    font-size="${fontSize}" fill="${FG}">G</text>
</svg>`;
}

async function run() {
  const outDir = path.join(__dirname, "..", "public", "icons");

  await sharp(Buffer.from(svgFor(192, 0.2)))
    .png()
    .toFile(path.join(outDir, "icon-192.png"));

  await sharp(Buffer.from(svgFor(512, 0.2)))
    .png()
    .toFile(path.join(outDir, "icon-512.png"));

  await sharp(Buffer.from(svgFor(180, 0.22)))
    .png()
    .toFile(path.join(outDir, "apple-touch-icon.png"));

  // Favicon sizes (square, sin bordes redondeados para que se vea bien chico)
  const favSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="central"
    font-family="Arial, 'Helvetica Neue', sans-serif" font-weight="700"
    font-size="${Math.round(size * 0.72)}" fill="${FG}">G</text>
</svg>`;

  const png16 = await sharp(Buffer.from(favSvg(16))).png().toBuffer();
  const png32 = await sharp(Buffer.from(favSvg(32))).png().toBuffer();

  writeIco(
    path.join(__dirname, "..", "app", "favicon.ico"),
    [
      { size: 16, data: png16 },
      { size: 32, data: png32 },
    ],
  );

  console.log("Listo: icons + favicon.ico generados");
}

// Construye un .ico válido embebiendo PNGs (formato soportado desde Windows Vista)
function writeIco(outPath, images) {
  const fs = require("fs");
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const dataChunks = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    const sizeByte = img.size >= 256 ? 0 : img.size;
    entry.writeUInt8(sizeByte, 0); // width
    entry.writeUInt8(sizeByte, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset

    dirEntries.push(entry);
    dataChunks.push(img.data);
    offset += img.data.length;
  }

  fs.writeFileSync(outPath, Buffer.concat([header, ...dirEntries, ...dataChunks]));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
