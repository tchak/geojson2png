import { z } from 'zod';

const Int = z.coerce.number().positive().int();
const ConfigSchema = z.object({
  PORT: Int.default(8080),
  GEOJSON2PNG_TTL: Int.default(1000 * 60 * 10),
  GEOJSON2PNG_MAX: Int.default(100),
  GEOJSON2PNG_MAX_ITEM_SIZE: Int.default(3_000_000),
  GEOJSON2PNG_SECRET_TOKEN: z.string().min(5),
});

const result = ConfigSchema.safeParse(process.env);
if (!result.success) {
  const formatted = result.error.format();
  throw new Error(formatted + '');
}
const Config = result.data;

export { Config };
