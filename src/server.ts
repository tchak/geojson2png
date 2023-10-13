import { Elysia, t } from 'elysia';
import { bearer } from '@elysiajs/bearer';
import { LRUCache } from 'lru-cache';

import { FeatureCollection } from './geojson';
import { renderGeoJSON } from './render';
import { Config } from './config';

const cache = new LRUCache<string, Buffer>({
  max: Config.GEOJSON2PNG_MAX,
  maxSize: Config.GEOJSON2PNG_MAX_ITEM_SIZE * Config.GEOJSON2PNG_MAX,
  maxEntrySize: Config.GEOJSON2PNG_MAX_ITEM_SIZE,
  sizeCalculation: (buffer) => buffer.length,
  ttl: Config.GEOJSON2PNG_TTL,
});

class BadRequestError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

class UnauthorizedError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

const app = new Elysia()
  .use(bearer())
  .addError({
    BAD_REQUEST: BadRequestError,
    UNAUTHORIZED_REQUEST: UnauthorizedError,
  })
  .onError(({ code, error }) => {
    if (code == 'BAD_REQUEST') {
      return new Response(error.message, { status: 400 });
    } else if (code == 'UNAUTHORIZED_REQUEST') {
      return new Response(error.message, { status: 401 });
    }
  })
  .post(
    '/v1',
    async ({ body: { featureCollection, ...options } }) => {
      const key = sha256(JSON.stringify([featureCollection, options]));
      let buffer = cache.get(key);

      if (!buffer) {
        try {
          buffer = await renderGeoJSON(featureCollection, options);
          cache.set(key, buffer);
        } catch (error) {
          throw new BadRequestError((error as Error).message);
        }
      }

      return new Response(buffer, { headers: { 'content-type': 'image/png' } });
    },
    {
      beforeHandle({ bearer }) {
        if (bearer !== Config.GEOJSON2PNG_SECRET_TOKEN) {
          throw new UnauthorizedError('Invalid token');
        }
      },
      body: t.Object({
        featureCollection: FeatureCollection,
        size: t.ReadonlyOptional(
          t.Number({ default: 1000, minimum: 50, maximum: 4000 })
        ),
        fill: t.ReadonlyOptional(t.String({ default: 'blue' })),
        opacity: t.ReadonlyOptional(
          t.Number({ default: 0.5, minimum: 0, maximum: 1 })
        ),
        margin: t.ReadonlyOptional(
          t.Number({ default: 20, minimum: 0, maximum: 100 })
        ),
        marginUnit: t.ReadonlyOptional(
          t.Union(
            [t.Literal('meters'), t.Literal('kilometers'), t.Literal('miles')],
            { default: 'meters' }
          )
        ),
      }),
    }
  )
  .listen(Config.PORT);

function sha256(str: string) {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(str);
  return hasher.digest('hex');
}

console.log(
  `🦊 geojson2png is running at ${app.server?.hostname}:${app.server?.port}`
);
