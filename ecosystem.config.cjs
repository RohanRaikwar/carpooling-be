module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'dist/server.js',
      instances: 1, // increase if needed
      exec_mode: 'fork', // cluster if you want scaling
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'mail-worker',
      script: 'dist/modules/mail/mail.worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/mail-worker-error.log',
      out_file: 'logs/mail-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10, 
    },
    {
      name: 'sms-worker',
      script: 'dist/modules/sms/sms.worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/sms-worker-error.log',
      out_file: 'logs/sms-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
