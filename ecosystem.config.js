module.exports = {
  apps: [{
    name: 'messenger-server',
    script: 'src/server.js',
    watch: true,
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    time: true
  }]
};
