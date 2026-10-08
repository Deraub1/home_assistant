const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { downloadArtifact } = require('@electron/get');

const projectDirectory = path.resolve(__dirname, '..');
const electronVersion = require('electron/package.json').version;
const appDataDirectory = process.env.LOCALAPPDATA
  || path.join(os.homedir(), 'AppData', 'Local');
const cacheDirectory = path.join(
  appDataDirectory,
  'HomeAssistantBuild',
  `electron-v${electronVersion}-win32-x64`
);
const runtimeExecutable = path.join(cacheDirectory, 'electron.exe');
const completeMarker = path.join(cacheDirectory, '.complete');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectDirectory,
      stdio: 'inherit',
      windowsHide: true,
      ...options
    });

    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${path.basename(command)} exited with code ${code}`));
      }
    });
  });
}

function quotePowerShellLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function ensureElectronRuntime() {
  try {
    await Promise.all([
      fs.access(runtimeExecutable),
      fs.access(completeMarker)
    ]);
    return;
  } catch {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  }

  const archivePath = await downloadArtifact({
    version: electronVersion,
    artifactName: 'electron',
    platform: 'win32',
    arch: 'x64'
  });

  await fs.mkdir(cacheDirectory, { recursive: true });
  const extractionCommand = [
    "$ErrorActionPreference = 'Stop';",
    `Expand-Archive -LiteralPath ${quotePowerShellLiteral(archivePath)}`,
    `-DestinationPath ${quotePowerShellLiteral(cacheDirectory)} -Force`
  ].join(' ');

  try {
    await run('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      extractionCommand
    ]);
    await fs.access(runtimeExecutable);
    await fs.writeFile(completeMarker, electronVersion);
  } catch (error) {
    await fs.rm(cacheDirectory, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Unable to prepare the cached Electron runtime: ${error.message}`);
  }
}

async function buildInstaller() {
  if (process.platform !== 'win32') {
    throw new Error('The Windows installer must be built on Windows.');
  }

  await run(process.execPath, [path.join(__dirname, 'create-icon.cjs')]);
  await ensureElectronRuntime();

  await run(process.execPath, [
    path.join(projectDirectory, 'node_modules', 'electron-builder', 'cli.js'),
    '--win',
    'nsis',
    '--x64',
    `--config.electronDist=${cacheDirectory}`
  ]);
}

buildInstaller().catch((error) => {
  console.error(`Windows installer build failed: ${error.message}`);
  process.exitCode = 1;
});
