function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  dbProxyUrl: required('DB_PROXY_URL'),
  dbProxyToken: required('DB_PROXY_TOKEN'),
  stripeSecretKey: required('STRIPE_SECRET_KEY'),
  akashConsoleKey: required('VARITY_AKASH_CONSOLE_KEY'),
  port: Number(process.env.PORT) || 8080,
  meterIntervalMs: Number(process.env.METER_INTERVAL_MS) || 86_400_000,
  maxHourlyMultiplier: Number(process.env.MAX_HOURLY_MULTIPLIER) || 10,
};
