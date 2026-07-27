/**
 * Script to generate valid PNG icon files for the Chrome Extension.
 * Uses standard Node.js zlib module to create raw image files.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output icons directory exists
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Creates a PNG buffer with a given width, height, and solid RGBA color drawing a simple shield motif.
 */
function createIconPng(size) {
  const width = size;
  const height = size;

  // Prepare raw RGBA pixel data (scanline format: 1 filter byte per row + width * 4 RGBA bytes)
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Determine pixel color: modern dark purple/indigo shield badge with cyan center
      if (dist <= radius) {
        // Inner gradient effect
        const innerRatio = dist / radius;
        if (innerRatio < 0.5) {
          // Center shield core (Purple #8B5CF6)
          rawData[pxOffset] = 139;     // R
          rawData[pxOffset + 1] = 92;  // G
          rawData[pxOffset + 2] = 246; // B
          rawData[pxOffset + 3] = 255; // A
        } else {
          // Shield outer boundary (Dark Slate Blue #1E1B4B)
          rawData[pxOffset] = 30;      // R
          rawData[pxOffset + 1] = 27;  // G
          rawData[pxOffset + 2] = 75;  // B
          rawData[pxOffset + 3] = 255; // A
        }
      } else {
        // Transparent background
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // Helper CRC32 implementation
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);

    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  // PNG Header
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression method
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

[16, 48, 128].forEach((size) => {
  const iconBuffer = createIconPng(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, iconBuffer);
  console.log(`Generated icon: ${filePath}`);
});
