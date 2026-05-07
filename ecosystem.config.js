// PM2 evaluates this file as JS, so we can resolve paths relative to the file
// itself. That way the same config works on any server / user
// (e.g. /home/devgrhar/apps/game_factory_frontend, /var/www/..., etc.).
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'game_frontend',

      cwd: __dirname,

      script: path.join(__dirname, '.next/standalone/server.js'),

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

      error_file: '/var/log/game/error.log',
      out_file: '/var/log/game/out.log',
      log_file: '/var/log/game/combined.log',
      time: true,
    },
  ],
};