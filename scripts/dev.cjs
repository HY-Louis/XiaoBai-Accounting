/**
 * Dev launcher — removes ELECTRON_RUN_AS_NODE from the environment
 * before starting electron-vite, because merely setting it to empty
 * string does NOT work (Electron checks for the variable's EXISTENCE,
 * not its value).
 */
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = require('child_process');

const child = spawn(
  'npx electron-vite dev',
  {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  }
);

child.on('exit', (code) => {
  process.exit(code || 0);
});
