import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const svgBuffer = readFileSync(join(process.cwd(), 'src/app/icon.svg'))
const outputDir = join(process.cwd(), 'public/icons')
mkdirSync(outputDir, { recursive: true })

const sizes = [180, 192, 384, 512]

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(outputDir, `icon-${size}x${size}.png`))
  console.log(`Generated icon-${size}x${size}.png`)
}

// Maskable icon: 20% safe-area padding on dark background
const maskableSize = 512
const iconSize = Math.round(maskableSize * 0.8)
const offset = Math.round((maskableSize - iconSize) / 2)
const resizedIcon = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer()
await sharp({
  create: { width: maskableSize, height: maskableSize, channels: 4, background: { r: 10, g: 10, b: 15, alpha: 1 } },
})
  .composite([{ input: resizedIcon, left: offset, top: offset }])
  .png()
  .toFile(join(outputDir, `icon-maskable-512x512.png`))
console.log('Generated icon-maskable-512x512.png')
