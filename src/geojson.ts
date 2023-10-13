import { t } from 'elysia';

const Coordinate = t.Union([
  t.Tuple([t.Number(), t.Number()]),
  t.Tuple([t.Number(), t.Number(), t.Number()]),
]);
const BBox = t.Tuple([t.Number(), t.Number(), t.Number(), t.Number()]);
const Point = t.Object({
  type: t.Literal('Point'),
  coordinates: Coordinate,
});
const MultiPoint = t.Object({
  type: t.Literal('MultiPoint'),
  coordinates: t.Array(Coordinate),
});
const LineString = t.Object({
  type: t.Literal('LineString'),
  coordinates: t.Array(Coordinate),
});
const MultiLineString = t.Object({
  type: t.Literal('MultiLineString'),
  coordinates: t.Array(t.Array(Coordinate)),
});
const Polygon = t.Object({
  type: t.Literal('Polygon'),
  coordinates: t.Array(t.Array(Coordinate)),
});
const MultiPolygon = t.Object({
  type: t.Literal('MultiPolygon'),
  coordinates: t.Array(t.Array(t.Array(Coordinate))),
});
const Geometry = t.Union([
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
]);
const GeometryCollection = t.Object({
  type: t.Literal('GeometryCollection'),
  geometries: t.Array(Geometry),
});
const Feature = t.Object({
  type: t.Literal('Feature'),
  geometry: t.Union([Geometry, GeometryCollection]),
  properties: t.Record(t.String(), t.Unknown()),
});

export const FeatureCollection = t.Object({
  type: t.Literal('FeatureCollection'),
  features: t.Array(Feature, { minItems: 1 }),
  bbox: t.Optional(BBox),
});
