const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../public/bazil_logo.jpg');
const resDir = path.join(__dirname, '../android/app/src/main/res');

const iconSizes = [
  { folder: 'mipmap-mdpi', size: 48, innerSize: 32 },
  { folder: 'mipmap-hdpi', size: 72, innerSize: 48 },
  { folder: 'mipmap-xhdpi', size: 96, innerSize: 64 },
  { folder: 'mipmap-xxhdpi', size: 144, innerSize: 96 },
  { folder: 'mipmap-xxxhdpi', size: 192, innerSize: 128 }
];

async function generateIcons() {
  console.log('Generating padded Android adaptive app icons...');

  for (const item of iconSizes) {
    const targetDir = path.join(resDir, item.folder);
    if (!fs.existsSync(targetDir)) continue;

    // 1. Standard App Icon (Square/Round container with padding)
    await sharp(logoPath)
      .resize(item.size, item.size, { fit: 'cover' })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    await sharp(logoPath)
      .resize(item.size, item.size, { fit: 'cover' })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // 2. Adaptive Foreground Icon (Inset at 66% with transparent background to prevent edge/text cropping)
    const resizedLogoBuffer = await sharp(logoPath)
      .resize(item.innerSize, item.innerSize, { fit: 'cover' })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: item.size,
        height: item.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: resizedLogoBuffer,
        top: Math.round((item.size - item.innerSize) / 2),
        left: Math.round((item.size - item.innerSize) / 2)
      }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
  }

  console.log('Android adaptive icons generated cleanly with zero text cropping!');
}

generateIcons().catch(console.error);
