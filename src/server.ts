import { Elysia, t } from 'elysia';
import { bearer } from '@elysiajs/bearer';
import Redis from 'ioredis';

import { FeatureCollection } from './geojson';
import { renderGeoJSON } from './render';
import { Config } from './config';

const cache = new Redis(Config.REDIS_URL);
cache.on('error', (err) => console.error('Redis Client Error', err));

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
  .error({
    BAD_REQUEST: BadRequestError,
    UNAUTHORIZED_REQUEST: UnauthorizedError,
  })
  .onError(({ code, error }) => {
    switch (code) {
      case 'BAD_REQUEST':
        return new Response(error.message, { status: 400 });
      case 'UNAUTHORIZED_REQUEST':
        return new Response(error.message, { status: 401 });
    }
  })
  .post(
    '/v1',
    async ({ body: { featureCollection, ...options } }) => {
      const key = sha256(JSON.stringify([featureCollection, options]));
      let buffer = await cache.getBuffer(key);

      if (!buffer) {
        try {
          buffer = await renderGeoJSON(featureCollection, options);
          cache.set(key, buffer, 'EX', 60 * 60);
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
