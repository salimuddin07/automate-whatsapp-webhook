module.exports = {
  apps: [
    {
      name: 'automate-whatsapp-webhook',
      script: 'index.js',
      // Use fork mode for a single instance app. If you want clustering, set instances: 'max' and exec_mode: 'cluster'
      exec_mode: 'fork',
      instances: 1,
      // If your app uses ES modules (type: module), pm2 will still execute node with ESM support
      node_args: [],
      watch: false,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      // Optional: increase log date format readability
      time: true,
      // Log files (pm2 will create the folder if needed)
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
