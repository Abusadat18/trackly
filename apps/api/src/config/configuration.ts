export default () => ({
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || 'localhost',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
