import json
import time
from dotenv import load_dotenv
load_dotenv()

from gee_engine import initialize_gee
initialize_gee()

import ee

START_DATE = '2023-01-01'
END_DATE   = '2023-12-31'


def compute_score(geom_geojson):
    geom = ee.Geometry(geom_geojson)

    # NDWI from Sentinel-2 (weight 40%)
    try:
        s2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
              .filterDate(START_DATE, END_DATE)
              .filterBounds(geom)
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
              .median())
        ndwi_val = (s2.normalizedDifference(['B3', 'B8'])
                    .reduceRegion(
                        reducer   = ee.Reducer.mean(),
                        geometry  = geom,
                        scale     = 500,
                        maxPixels = 1e9
                    ).getInfo().get('nd', None))
        ndwi_score = max(0, min(100, (ndwi_val + 1) / 2 * 100)) if ndwi_val is not None else 0
    except Exception as e:
        print(f"    NDWI error: {e}")
        ndwi_score = 0

    # JRC Surface Water occurrence (weight 35%)
    try:
        jrc = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select('occurrence')
        water_val = (jrc.reduceRegion(
                        reducer   = ee.Reducer.mean(),
                        geometry  = geom,
                        scale     = 500,
                        maxPixels = 1e9
                    ).getInfo().get('occurrence', None))
        water_score = water_val if water_val is not None else 0
    except Exception as e:
        print(f"    JRC error: {e}")
        water_score = 0

    # CHIRPS Precipitation (weight 25%)
    try:
        chirps = (ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD")
                  .filterDate(START_DATE, END_DATE)
                  .filterBounds(geom)
                  .mean())
        precip_val = (chirps.reduceRegion(
                          reducer   = ee.Reducer.mean(),
                          geometry  = geom,
                          scale     = 5000,
                          maxPixels = 1e9
                      ).getInfo().get('precipitation', None))
        precip_score = min(100, (precip_val / 10) * 100) if precip_val is not None else 0
    except Exception as e:
        print(f"    CHIRPS error: {e}")
        precip_score = 0

    combined = (ndwi_score * 0.40) + (water_score * 0.35) + (precip_score * 0.25)

    return {
        'score'        : round(combined, 1),
        'ndwi'         : round(ndwi_score, 1),
        'water'        : round(water_score, 1),
        'precipitation': round(precip_score, 1)
    }


def score_to_color(score):
    if score >= 75:   return '#0D47A1'
    elif score >= 50: return '#1976D2'
    elif score >= 25: return '#90CAF9'
    else:             return '#E3F2FD'


# Charger le GeoJSON des régions
with open('data/static/morocco_regions.geojson') as f:
    regions = json.load(f)

print(f"Found {len(regions['features'])} regions. Starting...\n")

# Calculer le score de chaque région
for feature in regions['features']:
    name = feature['properties'].get('NAME_1', 'unknown')
    print(f"Computing {name}...")
    try:
        result = compute_score(feature['geometry'])
        feature['properties']['water_score']  = result['score']
        feature['properties']['fill_color']   = score_to_color(result['score'])
        feature['properties']['score_ndwi']   = result['ndwi']
        feature['properties']['score_water']  = result['water']
        feature['properties']['score_precip'] = result['precipitation']
        print(f"  Score: {result['score']} | NDWI: {result['ndwi']} | Water: {result['water']} | Precip: {result['precipitation']}")
    except Exception as e:
        print(f"  ERROR: {e}")
        feature['properties']['water_score'] = 0
        feature['properties']['fill_color']  = '#E3F2FD'
    time.sleep(1)

# Sauvegarder le résultat
with open('data/static/morocco_water_health.geojson', 'w') as f:
    json.dump(regions, f)

print("\nDone! Saved to data/static/morocco_water_health.geojson")