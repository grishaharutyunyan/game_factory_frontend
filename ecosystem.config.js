module.exports = {
  apps: [
    {
      name: "game-factory-frontend",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "512M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],
};