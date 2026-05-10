// PM2 evaluates this file as JS, so we can resolve paths relative to the file
// itself. That way the same config works on any server / user
// (e.g. /home/devgrhar/apps/game_factory_frontend, /var/www/..., etc.).
//
// Next.js standalone: run `server.js` with cwd = `.next/standalone` (same as the
// official Docker image). Build first: `npm run build`.
const path = require('path');

const appRoot = __dirname;
const standaloneDir = path.join(appRoot, '.next/standalone');
const logsDir = path.join(appRoot, 'logs');

module.exports = {
  apps: [
    {
      name: 'game_frontend',

      cwd: standaloneDir,
      script: 'server.js',

      instances: 1,
      exec_mode: 'fork',

      autorestart: true,
      watch: false,

      max_memory_restart: '512M',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },

      error_file: path.join(logsDir, 'error.log'),
      out_file: path.join(logsDir, 'out.log'),
      log_file: path.join(logsDir, 'combined.log'),
      merge_logs: true,
      time: true,
    },
  ],
};