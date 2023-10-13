import { GeoJSON2SVG } from 'geojson2svg';
import sharp from 'sharp';
import proj4 from 'proj4';
//  @ts-ignore
import { bbox, square, bboxPolygon, buffer } from '@turf/turf';

import type { FeatureCollection, BBox } from 'geojson';

const DEFAULT_SIZE = 1000;
const DEFAULT_FILL = 'blue';
const DEFAULT_OPACITY = 0.5;
const DEFAULT_MARGIN = 20;
const DEFAULT_MARGIN_UNIT = 'meters';

export type RenderGeoJSONOptions = Partial<{
  size: number;
  fill: string;
  opacity: number;
  margin: number;
  marginUnit: 'meters' | 'kilometers' | 'miles';
}>;

export async function renderGeoJSON(
  featureCollection: FeatureCollection,
  options?: RenderGeoJSONOptions
) {
  const bbox = getSquareBBox(featureCollection, options);
  const size = options?.size || DEFAULT_SIZE;

  const svg = await convertGeoJSONtoSVG(
    decorateFeatureCollection(featureCollection, options),
    bbox,
    size
  );

  const [background, ...inputs] = await Promise.all(
    urls.map((url) =>
      fetch(buildIGNURL(url, bbox, size)).then((response) =>
        response.arrayBuffer()
      )
    )
  );

  return sharp(background)
    .composite([
      ...inputs.map((input) => ({ input: Buffer.from(input) })),
      { input: Buffer.from(svg) },
    ])
    .png()
    .toBuffer();
}

function decorateFeatureCollection(
  featureCollection: FeatureCollection,
  options?: Pick<RenderGeoJSONOptions, 'fill' | 'opacity'>
) {
  const decoratedFeatureCollection = structuredClone(featureCollection);
  for (const feature of decoratedFeatureCollection.features) {
    feature.properties ||= {};
    feature.properties.fill ||= options?.fill ?? DEFAULT_FILL;
    feature.properties.opacity ||= options?.opacity ?? DEFAULT_OPACITY;
  }
  return decoratedFeatureCollection;
}

function convertGeoJSONtoSVG(
  featureCollection: FeatureCollection,
  [minX, minY, maxX, maxY]: BBox,
  size: number
) {
  const converter = new GeoJSON2SVG({
    mapExtent: {
      left: minX,
      bottom: minY,
      right: maxX,
      top: maxY,
    },
    viewportSize: { width: size, height: size },
    //  @ts-ignore
    coordinateConverter: forward,
    attributes: [
      { type: 'dynamic', property: 'properties.fill', key: 'fill' },
      { type: 'dynamic', property: 'properties.opacity', key: 'opacity' },
    ],
    r: 5,
    pointAsCircle: true,
  });
  const svg = converter.convert(featureCollection).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${svg}</svg>`;
}

function buildIGNURL(
  url: string,
  [minX, minY, maxX, maxY]: BBox,
  size: number
) {
  const params = new URLSearchParams();
  params.set('EXCEPTIONS', 'text/xml');
  params.set('FORMAT', 'image/png');
  params.set('SERVICE', 'WMS');
  params.set('VERSION', '1.3.0');
  params.set('REQUEST', 'GetMap');
  params.set('STYLES', '');
  params.set('CRS', 'EPSG:4326');
  params.set('BBOX', `${minY},${minX},${maxY},${maxX}`);
  params.set('WIDTH', `${size}`);
  params.set('HEIGHT', `${size}`);

  return `https://${url}&${params}`;
}

const urls = [
  'wxs.ign.fr/ortho/geoportail/r/wms?LAYERS=ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO',
  'wxs.ign.fr/administratif/geoportail/r/wms?LAYERS=ADMINEXPRESS-COG-CARTO.LATEST',
  //'wxs.ign.fr/parcellaire/geoportail/r/wms?LAYERS=CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
];

const { forward } = proj4('EPSG:3857', 'EPSG:4326');

function getSquareBBox(
  featureCollection: FeatureCollection,
  options?: Pick<RenderGeoJSONOptions, 'margin' | 'marginUnit'>
): BBox {
  const noMarginBBox: BBox = featureCollection.bbox
    ? square(featureCollection.bbox)
    : square(bbox(featureCollection));
  const margin = options?.margin ?? DEFAULT_MARGIN;
  const marginUnit = options?.marginUnit ?? DEFAULT_MARGIN_UNIT;

  if (margin > 0) {
    const polygon = bboxPolygon(noMarginBBox);
    const buffered = buffer(polygon, margin, { units: marginUnit });
    return square(bbox(buffered));
  }
  return noMarginBBox;
}
