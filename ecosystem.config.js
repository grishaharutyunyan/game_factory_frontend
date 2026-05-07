const path = require('path');

module.exports = {
  apps: [
    {
      name: 'game_frontend',

      // Always run from the directory this ecosystem file lives in,
      // so deploys to ~/apps/game_factory_frontend, /var/www/..., etc. all work.
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

      error_file: '/var/log/cherry/error.log',
      out_file: '/var/log/cherry/out.log',
      log_file: '/var/log/cherry/combined.log',
      time: true,
    },
  ],
};