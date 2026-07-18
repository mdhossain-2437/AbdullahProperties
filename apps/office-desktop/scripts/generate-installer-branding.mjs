import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDirectory, "..");
const outputDirectory = join(desktopRoot, "src-tauri", "windows", "branding");
const primaryLogoPath = join(desktopRoot, "public", "brand", "logo-primary.png");
const inverseLogoPath = join(desktopRoot, "public", "brand", "logo-inverse.png");
const markLogoPath = join(desktopRoot, "public", "brand", "logo-mark.png");
const iconPath = join(desktopRoot, "src-tauri", "icons", "icon.ico");

const palette = {
  ink: [4, 17, 20, 255],
  inkSoft: [10, 28, 31, 255],
  orange: [255, 103, 31, 255],
  orangeWarm: [255, 153, 0, 255],
  cream: [255, 248, 241, 255],
  creamDeep: [247, 236, 225, 255],
  white: [255, 255, 255, 255],
};

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodeRgbaPng(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("Expected a PNG source asset.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === "IHDR") {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
      interlace = buffer[dataStart + 12];
    } else if (type === "IDAT") {
      idatChunks.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(
      `Unsupported PNG encoding: bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}`,
    );
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let inputOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const rowStart = y * stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[inputOffset + x];
      const left = x >= bytesPerPixel ? pixels[rowStart + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[rowStart - stride + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel
        ? pixels[rowStart - stride + x - bytesPerPixel]
        : 0;

      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + above;
      else if (filter === 3) value = raw + Math.floor((left + above) / 2);
      else if (filter === 4) value = raw + paeth(left, above, upperLeft);
      else throw new Error(`Unsupported PNG filter: ${filter}`);

      pixels[rowStart + x] = value & 0xff;
    }
    inputOffset += stride;
  }

  return { width, height, pixels };
}

function createCanvas(width, height, color) {
  const pixels = new Uint8Array(width * height * 4);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels.set(color, offset);
  }
  return { width, height, pixels };
}

function blendPixel(canvas, x, y, color) {
  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
  const offset = (y * canvas.width + x) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  canvas.pixels[offset] = Math.round(color[0] * alpha + canvas.pixels[offset] * inverse);
  canvas.pixels[offset + 1] = Math.round(color[1] * alpha + canvas.pixels[offset + 1] * inverse);
  canvas.pixels[offset + 2] = Math.round(color[2] * alpha + canvas.pixels[offset + 2] * inverse);
  canvas.pixels[offset + 3] = 255;
}

function fillRectangle(canvas, x, y, width, height, color) {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(canvas.width, Math.ceil(x + width));
  const endY = Math.min(canvas.height, Math.ceil(y + height));
  for (let row = startY; row < endY; row += 1) {
    for (let column = startX; column < endX; column += 1) {
      blendPixel(canvas, column, row, color);
    }
  }
}

function fillCircle(canvas, centerX, centerY, radius, color) {
  const radiusSquared = radius * radius;
  for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
      if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radiusSquared) {
        blendPixel(canvas, x, y, color);
      }
    }
  }
}

function sampleBilinear(image, x, y) {
  const x0 = Math.max(0, Math.min(image.width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(image.height - 1, Math.floor(y)));
  const x1 = Math.min(image.width - 1, x0 + 1);
  const y1 = Math.min(image.height - 1, y0 + 1);
  const xWeight = x - Math.floor(x);
  const yWeight = y - Math.floor(y);
  const result = [0, 0, 0, 0];

  for (let channel = 0; channel < 4; channel += 1) {
    const topLeft = image.pixels[(y0 * image.width + x0) * 4 + channel];
    const topRight = image.pixels[(y0 * image.width + x1) * 4 + channel];
    const bottomLeft = image.pixels[(y1 * image.width + x0) * 4 + channel];
    const bottomRight = image.pixels[(y1 * image.width + x1) * 4 + channel];
    const top = topLeft + (topRight - topLeft) * xWeight;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
    result[channel] = Math.round(top + (bottom - top) * yWeight);
  }
  return result;
}

function drawImageContain(canvas, image, bounds, opacity = 1) {
  const scale = Math.min(bounds.width / image.width, bounds.height / image.height);
  const renderedWidth = Math.max(1, Math.round(image.width * scale));
  const renderedHeight = Math.max(1, Math.round(image.height * scale));
  const startX = Math.round(bounds.x + (bounds.width - renderedWidth) / 2);
  const startY = Math.round(bounds.y + (bounds.height - renderedHeight) / 2);

  for (let y = 0; y < renderedHeight; y += 1) {
    const sourceY = ((y + 0.5) / renderedHeight) * image.height - 0.5;
    for (let x = 0; x < renderedWidth; x += 1) {
      const sourceX = ((x + 0.5) / renderedWidth) * image.width - 0.5;
      const color = sampleBilinear(image, sourceX, sourceY);
      color[3] = Math.round(color[3] * opacity);
      blendPixel(canvas, startX + x, startY + y, color);
    }
  }
}

function addDotGrid(canvas, color, xStart, yStart, xEnd, yEnd, spacing) {
  for (let y = yStart; y <= yEnd; y += spacing) {
    for (let x = xStart; x <= xEnd; x += spacing) {
      fillCircle(canvas, x, y, 1, color);
    }
  }
}

function encodeBmp(canvas) {
  const rowBytes = canvas.width * 3;
  const rowStride = (rowBytes + 3) & ~3;
  const pixelBytes = rowStride * canvas.height;
  const fileSize = 54 + pixelBytes;
  const buffer = Buffer.alloc(fileSize);

  buffer.write("BM", 0, "ascii");
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(canvas.width, 18);
  buffer.writeInt32LE(canvas.height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(pixelBytes, 34);
  buffer.writeInt32LE(3780, 38);
  buffer.writeInt32LE(3780, 42);

  for (let outputY = 0; outputY < canvas.height; outputY += 1) {
    const sourceY = canvas.height - outputY - 1;
    const outputRow = 54 + outputY * rowStride;
    for (let x = 0; x < canvas.width; x += 1) {
      const sourceOffset = (sourceY * canvas.width + x) * 4;
      const outputOffset = outputRow + x * 3;
      buffer[outputOffset] = canvas.pixels[sourceOffset + 2];
      buffer[outputOffset + 1] = canvas.pixels[sourceOffset + 1];
      buffer[outputOffset + 2] = canvas.pixels[sourceOffset];
    }
  }
  return buffer;
}

function installerSidebar({ inverseLogo, markLogo }) {
  const canvas = createCanvas(164, 314, palette.ink);
  fillRectangle(canvas, 0, 0, 8, 314, palette.orange);
  fillCircle(canvas, 146, 25, 62, [255, 103, 31, 38]);
  addDotGrid(canvas, [255, 255, 255, 28], 30, 32, 150, 142, 12);
  fillRectangle(canvas, 26, 48, 112, 112, [255, 248, 241, 245]);
  drawImageContain(canvas, markLogo, { x: 37, y: 59, width: 90, height: 90 });
  drawImageContain(canvas, inverseLogo, { x: 20, y: 178, width: 132, height: 49 });
  fillRectangle(canvas, 26, 249, 96, 2, palette.orange);
  fillRectangle(canvas, 26, 259, 62, 2, [255, 248, 241, 92]);
  fillRectangle(canvas, 26, 269, 82, 2, [255, 248, 241, 52]);
  fillRectangle(canvas, 8, 298, 156, 16, palette.orange);
  return canvas;
}

function uninstallerSidebar({ primaryLogo, markLogo }) {
  const canvas = createCanvas(164, 314, palette.cream);
  fillRectangle(canvas, 0, 0, 8, 314, palette.orange);
  fillCircle(canvas, 146, 24, 62, [255, 103, 31, 28]);
  addDotGrid(canvas, [4, 17, 20, 24], 30, 32, 150, 142, 12);
  fillRectangle(canvas, 26, 48, 112, 112, palette.white);
  drawImageContain(canvas, markLogo, { x: 37, y: 59, width: 90, height: 90 });
  drawImageContain(canvas, primaryLogo, { x: 20, y: 178, width: 132, height: 49 });
  fillRectangle(canvas, 26, 249, 96, 2, palette.orange);
  fillRectangle(canvas, 26, 259, 62, 2, [4, 17, 20, 74]);
  fillRectangle(canvas, 26, 269, 82, 2, [4, 17, 20, 38]);
  fillRectangle(canvas, 8, 298, 156, 16, palette.ink);
  return canvas;
}

function installerHeader({ primaryLogo }) {
  const canvas = createCanvas(150, 57, palette.cream);
  fillRectangle(canvas, 0, 0, 5, 57, palette.orange);
  fillRectangle(canvas, 5, 0, 145, 3, palette.ink);
  drawImageContain(canvas, primaryLogo, { x: 11, y: 8, width: 132, height: 42 });
  return canvas;
}

function uninstallerHeader({ inverseLogo }) {
  const canvas = createCanvas(150, 57, palette.ink);
  fillRectangle(canvas, 0, 0, 5, 57, palette.orange);
  fillRectangle(canvas, 5, 54, 145, 3, palette.orange);
  drawImageContain(canvas, inverseLogo, { x: 11, y: 8, width: 132, height: 42 });
  return canvas;
}

function wixDialog({ inverseLogo, markLogo }) {
  const canvas = createCanvas(493, 312, palette.cream);
  fillRectangle(canvas, 0, 0, 176, 312, palette.ink);
  fillRectangle(canvas, 0, 0, 9, 312, palette.orange);
  fillRectangle(canvas, 176, 0, 3, 312, palette.orange);
  fillCircle(canvas, 163, 18, 82, [255, 103, 31, 28]);
  addDotGrid(canvas, [255, 255, 255, 24], 28, 27, 160, 133, 12);
  fillRectangle(canvas, 31, 43, 116, 116, [255, 248, 241, 245]);
  drawImageContain(canvas, markLogo, { x: 42, y: 54, width: 94, height: 94 });
  drawImageContain(canvas, inverseLogo, { x: 21, y: 186, width: 143, height: 52 });
  fillRectangle(canvas, 29, 262, 94, 2, palette.orange);
  fillRectangle(canvas, 29, 272, 62, 2, [255, 248, 241, 88]);
  fillRectangle(canvas, 179, 0, 314, 5, palette.orange);
  fillCircle(canvas, 476, 296, 76, [255, 103, 31, 18]);
  addDotGrid(canvas, [4, 17, 20, 16], 396, 220, 480, 298, 12);
  return canvas;
}

function wixBanner({ primaryLogo, markLogo }) {
  const canvas = createCanvas(493, 58, palette.cream);
  fillRectangle(canvas, 0, 0, 493, 4, palette.orange);
  fillRectangle(canvas, 0, 55, 493, 3, palette.ink);
  fillCircle(canvas, 478, 12, 52, [255, 103, 31, 30]);
  drawImageContain(canvas, primaryLogo, { x: 333, y: 8, width: 112, height: 40 });
  drawImageContain(canvas, markLogo, { x: 450, y: 8, width: 40, height: 40 });
  return canvas;
}

function parseBmpMetadata(buffer) {
  if (buffer.toString("ascii", 0, 2) !== "BM") throw new Error("Invalid BMP signature.");
  return {
    width: buffer.readInt32LE(18),
    height: Math.abs(buffer.readInt32LE(22)),
    bitsPerPixel: buffer.readUInt16LE(28),
    compression: buffer.readUInt32LE(30),
  };
}

function parseIcoMetadata(buffer) {
  if (buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    throw new Error("Invalid ICO signature.");
  }
  const imageCount = buffer.readUInt16LE(4);
  const sizes = [];
  for (let index = 0; index < imageCount; index += 1) {
    const offset = 6 + index * 16;
    sizes.push({
      width: buffer[offset] || 256,
      height: buffer[offset + 1] || 256,
      bitsPerPixel: buffer.readUInt16LE(offset + 6),
    });
  }
  return { imageCount, sizes };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const [primaryLogoBuffer, inverseLogoBuffer, markLogoBuffer, iconBuffer] = await Promise.all([
    readFile(primaryLogoPath),
    readFile(inverseLogoPath),
    readFile(markLogoPath),
    readFile(iconPath),
  ]);

  const logos = {
    primaryLogo: decodeRgbaPng(primaryLogoBuffer),
    inverseLogo: decodeRgbaPng(inverseLogoBuffer),
    markLogo: decodeRgbaPng(markLogoBuffer),
  };

  const definitions = [
    ["nsis-sidebar.bmp", installerSidebar(logos), 164, 314],
    ["nsis-header.bmp", installerHeader(logos), 150, 57],
    ["nsis-uninstaller-sidebar.bmp", uninstallerSidebar(logos), 164, 314],
    ["nsis-uninstaller-header.bmp", uninstallerHeader(logos), 150, 57],
    ["wix-dialog.bmp", wixDialog(logos), 493, 312],
    ["wix-banner.bmp", wixBanner(logos), 493, 58],
  ];

  const manifest = {
    generatedBy: "scripts/generate-installer-branding.mjs",
    sourceAssets: {
      "logo-primary.png": sha256(primaryLogoBuffer),
      "logo-inverse.png": sha256(inverseLogoBuffer),
      "logo-mark.png": sha256(markLogoBuffer),
      "icon.ico": sha256(iconBuffer),
    },
    files: {},
  };

  for (const [name, canvas, expectedWidth, expectedHeight] of definitions) {
    const buffer = encodeBmp(canvas);
    const metadata = parseBmpMetadata(buffer);
    if (
      metadata.width !== expectedWidth
      || metadata.height !== expectedHeight
      || metadata.bitsPerPixel !== 24
      || metadata.compression !== 0
    ) {
      throw new Error(`${name} did not meet the required BMP contract.`);
    }
    await writeFile(join(outputDirectory, name), buffer);
    manifest.files[name] = { ...metadata, sha256: sha256(buffer) };
  }

  const icoMetadata = parseIcoMetadata(iconBuffer);
  await writeFile(join(outputDirectory, "installer-icon.ico"), iconBuffer);
  manifest.files["installer-icon.ico"] = { ...icoMetadata, sha256: sha256(iconBuffer) };

  await writeFile(
    join(outputDirectory, "asset-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  for (const [name, metadata] of Object.entries(manifest.files)) {
    console.log(`${name}: ${JSON.stringify(metadata)}`);
  }
}

await main();
