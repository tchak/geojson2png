import { z } from 'zod';

const Int = z.coerce.number().positive().int();
const ConfigSchema = z.object({
  PORT: Int.default(8080),
  GEOJSON2PNG_SECRET_TOKEN: z.string().min(5),
  REDIS_URL: z.string().url(),
});

const result = ConfigSchema.safeParse(process.env);
if (!result.success) {
  const formatted = result.error.format();
  throw new Error(formatted + '');
}
const Config = result.data;

export { Config };
