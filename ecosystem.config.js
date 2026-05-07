module.exports = {
  apps: [
    {
      name: 'game_frontend',

      cwd: '/var/www/cherry_admin_frontend',

      script: '.next/standalone/server.js',

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