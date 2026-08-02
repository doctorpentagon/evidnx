export const env = {
  port: Number(process.env.PORT ?? 4010),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};
