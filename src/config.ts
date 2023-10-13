import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const ConfigSchema = Type.Object(
  {
    PORT: Type.Number({ default: 8080 }),
    GEOJSON2PNG_TTL: Type.Number({ default: 1000 * 60 * 10 }),
    GEOJSON2PNG_MAX: Type.Number({ default: 100 }),
    GEOJSON2PNG_MAX_ITEM_SIZE: Type.Number({ default: 3_000_000 }),
    GEOJSON2PNG_SECRET_TOKEN: Type.String({ minLength: 5 }),
  },
  { additionalProperties: true }
);
const Config = Value.Create(ConfigSchema);

Object.keys(Config).forEach((key) => {
  if (process.env[key]) {
    Object.assign(Config, { [key]: process.env[key] });
  } else if (key == 'GEOJSON2PNG_SECRET_TOKEN') {
    Object.assign(Config, { GEOJSON2PNG_SECRET_TOKEN: '' });
  }
});

if (!Value.Check(ConfigSchema, Config)) {
  throw new Error(
    [...Value.Errors(ConfigSchema, Config)].map((e) => e.message).join('\n')
  );
}

export { Config };
