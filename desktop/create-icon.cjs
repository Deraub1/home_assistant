const fs = require('node:fs/promises');
const path = require('node:path');
const source = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'res',
  'mipmap-xhdpi',
  'ic_launcher.png'
);
const destination = path.join(__dirname, 'app.ico');

async function createIcon() {
  const { default: pngToIco } = await import('png-to-ico');
  const icon = await pngToIco(source);
  await fs.writeFile(destination, icon);
}

createIcon().catch((error) => {
  console.error(`Unable to create the Windows app icon from ${source}:`, error);
  process.exitCode = 1;
});
