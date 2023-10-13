# geojson2png

To install dependencies:

```bash
bun install
```

To run:

```bash
GEOJSON2PNG_SECRET_TOKEN="SECRET" bun start
```

To use:

```bash
curl --request POST \
  --url http://localhost:8080/v1 \
  --header 'Authorization: Bearer SECRET' \
  --header 'Content-Type: application/json' \
  --data '{
  "featureCollection": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                2.47312545776367,
                48.72845439491962
              ],
              [
                2.4759578704834,
                48.72955840196789
              ],
              [
                2.4759578704834,
                48.72955840196789
              ],
              [
                2.47715950012207,
                48.72771837675469
              ],
              [
                2.47308254241943,
                48.7276900681486
              ],
              [
                2.47312545776367,
                48.72845439491962
              ]
            ]
          ]
        }
      }
    ]
  },
  "size": 500,
  "fill": "green"
}'
```
