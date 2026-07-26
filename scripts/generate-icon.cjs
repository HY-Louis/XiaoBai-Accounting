// Generate a simple 256x256 PNG icon for 小白记账
// Creates a blue rounded-rectangle with "¥" symbol
const fs = require('fs')
const path = require('path')

// Minimal PNG generation
// We'll create a simple solid-color icon

// PNG signature
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function createPNG(width, height, r, g, b) {
  const chunks = []

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)   // width
  ihdr.writeUInt32BE(height, 4)  // height
  ihdr.writeUInt8(8, 8)          // bit depth
  ihdr.writeUInt8(2, 9)          // color type (RGB)
  ihdr.writeUInt8(0, 10)         // compression
  ihdr.writeUInt8(0, 11)         // filter
  ihdr.writeUInt8(0, 12)         // interlace
  chunks.push(createChunk('IHDR', ihdr))

  // IDAT chunk - image data
  // For simplicity, each row: filter byte (0) + RGB * width
  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3)
    rawData[rowOffset] = 0 // no filter
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3

      // Draw a rounded-rectangle shape with blue background
      const cx = width / 2, cy = height / 2
      const rx = width * 0.42, ry = height * 0.42
      const cornerRadius = 40

      // Check if point is inside rounded rectangle
      let inside = true
      const dx = Math.abs(x - cx)
      const dy = Math.abs(y - cy)

      if (dx > rx || dy > ry) {
        inside = false
      }
      if (dx > rx - cornerRadius && dy > ry - cornerRadius) {
        const cornerDx = dx - (rx - cornerRadius)
        const cornerDy = dy - (ry - cornerRadius)
        if (cornerDx * cornerDx + cornerDy * cornerDy > cornerRadius * cornerRadius) {
          inside = false
        }
      }

      if (inside) {
        // Blue button color #4F6EF7
        rawData[px] = 79
        rawData[px + 1] = 110
        rawData[px + 2] = 247
      } else {
        // Transparent-like white background
        rawData[px] = 255
        rawData[px + 1] = 255
        rawData[px + 2] = 255
      }
    }
  }

  // Compress with zlib (Node.js built-in)
  const zlib = require('zlib')
  const compressed = zlib.deflateSync(rawData)
  chunks.push(createChunk('IDAT', compressed))

  // IEND chunk
  chunks.push(createChunk('IEND', Buffer.alloc(0)))

  return Buffer.concat([signature, ...chunks])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const typeBuffer = Buffer.from(type, 'ascii')

  const crc = require('zlib').crc32(Buffer.concat([typeBuffer, data]))
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

// Generate the icon
const png = createPNG(256, 256, 79, 110, 247)
const outputPath = path.join(__dirname, '..', 'resources', 'icon.png')

if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
}

fs.writeFileSync(outputPath, png)
console.log('Icon generated: ' + outputPath)
