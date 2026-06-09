from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import ee

from gee_engine import (
    get_precipitation_score,
    get_precipitation_tile,
    get_surface_water_score,
    get_surface_water_tile,
    initialize_gee,
    get_index_values,
    classify_region,
    get_tile_url,
    get_time_series,
    get_grace_timeseries,
    get_chirps_timeseries,
    get_modis_et_timeseries,
    get_worldcover,
    get_water_indices,
    get_jrc_water,
    get_osm_water_sources,
    get_temperature_score,   # ← nouveau
    get_temperature_tile,
    get_land_suitability_score,
    get_land_suitability_tile
)

load_dotenv()

app = Flask(__name__)
CORS(app)

initialize_gee()


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'gee': 'connected'})


@app.route('/api/tiles', methods=['POST'])
def tiles():
    data = request.json
    required = ['geometry', 'index', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        tile_url = get_tile_url(
            geometry   = geometry,
            index_name = data['index'],
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify({'tile_url': tile_url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/classify', methods=['POST'])
def classify():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        values = get_index_values(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        result = classify_region(values)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/timeseries', methods=['POST'])
def timeseries():
    data = request.json
    required = ['geometry', 'index', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        series = get_time_series(
            geometry   = geometry,
            index_name = data['index'],
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify({'series': series})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/timeseries/grace', methods=['POST'])
def grace_timeseries():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        series = get_grace_timeseries(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify({
            'series' : series,
            'unit'   : 'kg/m²',
            'dataset': 'GLDAS Root Zone Soil Moisture (GRACE alternative)'
        })
    except Exception as e:
        print('ERREUR GLDAS:', str(e))
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/timeseries/chirps', methods=['POST'])
def chirps_timeseries():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        series = get_chirps_timeseries(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify({'series': series, 'unit': 'mm/jour', 'dataset': 'CHIRPS'})
    except Exception as e:
        print('ERREUR CHIRPS:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/timeseries/modis-et', methods=['POST'])
def modis_et_timeseries():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        series = get_modis_et_timeseries(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify({'series': series, 'unit': 'mm', 'dataset': 'MODIS ET'})
    except Exception as e:
        print('ERREUR MODIS ET:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/worldcover', methods=['POST'])
def worldcover():
    data = request.json
    if 'geometry' not in data:
        return jsonify({'error': 'Champ manquant : geometry'}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result = get_worldcover(geometry)
        return jsonify({'landcover': result, 'dataset': 'ESA WorldCover 2021'})
    except Exception as e:
        print('ERREUR WorldCover:', str(e))
        return jsonify({'error': str(e)}), 500



@app.route('/api/water-analysis', methods=['POST'])
def water_analysis():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        # Calculer les indices eau
        water_indices = get_water_indices(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        # JRC Global Surface Water
        jrc_data = get_jrc_water(geometry)
        # Sources d'eau OSM
        osm_data = get_osm_water_sources(geometry)
        return jsonify({
            'water_class'  : water_indices['water_class'],
            'color'        : water_indices['color'],
            'label'        : water_indices['label'],
            'indices'      : water_indices['values'],
            'jrc'          : jrc_data,
            'osm'          : osm_data
        })
    except Exception as e:
        print('ERREUR water-analysis:', str(e))
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/layers/water-health', methods=['GET'])
def get_water_health():
    import json, os, time

    date_start = request.args.get('dateStart', '2023-01-01')
    date_end   = request.args.get('dateEnd',   '2023-12-31')

    # Build a filename based on the date range so each period is cached on disk
    safe_start = date_start.replace('-', '')
    safe_end   = date_end.replace('-', '')
    filename   = f'morocco_water_health_{safe_start}_{safe_end}.geojson'
    cache_path = os.path.join(os.path.dirname(__file__), 'data/static', filename)

    print(f'Water health request: {date_start} → {date_end}')
    print(f'Cache path: {cache_path}')
    print(f'Cache exists: {os.path.exists(cache_path)}')

    # Return cached file if it exists
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            return jsonify(json.load(f))

    # Otherwise compute fresh scores for the requested period
    print('Computing fresh scores...')
    base_path = os.path.join(os.path.dirname(__file__), 'data/static/morocco_regions.geojson')
    if not os.path.exists(base_path):
        return jsonify({'error': 'morocco_regions.geojson not found'}), 404

    with open(base_path) as f:
        regions = json.load(f)

    def compute_score(geom_geojson):
        geom = ee.Geometry(geom_geojson)

        # NDWI
        try:
            s2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                  .filterDate(date_start, date_end)
                  .filterBounds(geom)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .median())
            ndwi_val = (s2.normalizedDifference(['B3', 'B8'])
                        .reduceRegion(reducer=ee.Reducer.mean(), geometry=geom,
                                      scale=500, maxPixels=1e9)
                        .getInfo().get('nd', None))
            ndwi_score = max(0, min(100, (ndwi_val + 1) / 2 * 100)) if ndwi_val is not None else 0
        except:
            ndwi_score = 0

        # JRC
        try:
            jrc = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select('occurrence')
            water_val = (jrc.reduceRegion(reducer=ee.Reducer.mean(), geometry=geom,
                                          scale=500, maxPixels=1e9)
                         .getInfo().get('occurrence', None))
            water_score = water_val if water_val is not None else 0
        except:
            water_score = 0

        # CHIRPS
        try:
            chirps = (ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD")
                      .filterDate(date_start, date_end)
                      .filterBounds(geom).mean())
            precip_val = (chirps.reduceRegion(reducer=ee.Reducer.mean(), geometry=geom,
                                              scale=5000, maxPixels=1e9)
                          .getInfo().get('precipitation', None))
            precip_score = min(100, (precip_val / 10) * 100) if precip_val is not None else 0
        except:
            precip_score = 0

        combined = (ndwi_score * 0.40) + (water_score * 0.35) + (precip_score * 0.25)
        return {
            'score':         round(combined, 1),
            'ndwi':          round(ndwi_score, 1),
            'water':         round(water_score, 1),
            'precipitation': round(precip_score, 1)
        }

    def score_to_color(score):
        if score >= 75:   return '#0D47A1'
        elif score >= 50: return '#1976D2'
        elif score >= 25: return '#90CAF9'
        else:             return '#E3F2FD'

    for feature in regions['features']:
        try:
            result = compute_score(feature['geometry'])
            feature['properties']['water_score']  = result['score']
            feature['properties']['fill_color']   = score_to_color(result['score'])
            feature['properties']['score_ndwi']   = result['ndwi']
            feature['properties']['score_water']  = result['water']
            feature['properties']['score_precip'] = result['precipitation']
        except Exception as e:
            feature['properties']['water_score'] = 0
            feature['properties']['fill_color']  = '#E3F2FD'
        time.sleep(0.5)

    # Cache to disk for next time
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    with open(cache_path, 'w') as f:
        json.dump(regions, f)

    return jsonify(regions)

@app.route('/api/water-sources', methods=['GET'])
def get_water_sources():
    import requests, json
    region = request.args.get('region', '')
    if not region:
        return jsonify({'error': 'region parameter required'}), 400

    # Morocco region bounding boxes [south, west, north, east]
    REGION_BBOX = {
    'Tanger-Tétouan-Al Hoceïma': (34.5, -6.0, 36.0, -2.0),
    'Oriental': (32.0, -3.0, 35.5, 2.0),
    'Fès-Meknès': (33.0, -5.8, 35.0, -3.0),
    'Rabat-Salé-Kénitra': (33.5, -7.5, 35.2, -5.5),
    'Béni Mellal-Khénifra': (31.5, -7.5, 33.5, -5.0),
    'Casablanca-Settat': (32.0, -8.5, 34.0, -6.0),
    'Marrakech-Safi': (30.5, -10.0, 32.8, -6.5),
    'Drâa-Tafilalet': (29.0, -7.5, 33.0, -3.5),
    'Souss-Massa': (28.0, -10.5, 31.5, -5.0),
    'Guelmim-Oued Noun': (27.0, -12.5, 30.0, -8.0),
    'Laâyoune-Sakia El Hamra': (24.0, -15.5, 28.5, -11.0),
    'Dakhla-Oued Ed-Dahab': (20.0, -18.5, 24.5, -13.5),
}

    bbox = REGION_BBOX.get(region)
    if not bbox:
        # fallback: all Morocco
        bbox = (21.0, -17.5, 36.0, 2.0)

    south, west, north, east = bbox
    bbox_str = f"{south},{west},{north},{east}"

    # Overpass query — all water feature types
    query = f"""
    [out:json][timeout:60];
    (
      way["natural"="water"]({bbox_str});
      way["waterway"="river"]({bbox_str});
      way["waterway"="stream"]({bbox_str});
      way["waterway"="canal"]({bbox_str});
      way["waterway"="drain"]({bbox_str});
      way["waterway"="dam"]({bbox_str});
      way["natural"="wetland"]({bbox_str});
      node["natural"="spring"]({bbox_str});
      node["natural"="water"]({bbox_str});
      relation["natural"="water"]({bbox_str});
    );
    out geom;
    """

    try:
        resp = requests.post(
            'https://overpass-api.de/api/interpreter',
            data=query,
            headers={
                'Content-Type': 'text/plain',
                'User-Agent': 'HydroMaroc/1.0'
            },
            timeout=60
        )
        resp.raise_for_status()
        osm_data = resp.json()
        print("ELEMENTS FOUND:", len(osm_data.get('elements', [])))
    except Exception as e:
        return jsonify({'error': f'Overpass API error: {str(e)}'}), 500

    # Convert OSM elements to GeoJSON features
    features = []

    TYPE_COLORS = {
        'river':   {'color': '#1565C0', 'weight': 3,   'label': 'Rivière'},
        'stream':  {'color': '#1976D2', 'weight': 1.5, 'label': 'Cours d\'eau'},
        'canal':   {'color': '#0288D1', 'weight': 2,   'label': 'Canal'},
        'drain':   {'color': '#4FC3F7', 'weight': 1,   'label': 'Drain'},
        'dam':     {'color': '#0D47A1', 'weight': 3,   'label': 'Barrage'},
        'water':   {'color': '#1E88E5', 'weight': 1,   'label': 'Plan d\'eau'},
        'wetland': {'color': '#26C6DA', 'weight': 1,   'label': 'Zone humide'},
        'spring':  {'color': '#00ACC1', 'weight': 1,   'label': 'Source'},
    }

    for el in osm_data.get('elements', []):
        tags     = el.get('tags', {})
        el_type  = el.get('type')
        name     = tags.get('name') or tags.get('name:fr') or tags.get('name:ar') or 'Sans nom'
        wtype    = tags.get('waterway') or tags.get('natural') or 'water'
        style    = TYPE_COLORS.get(wtype, TYPE_COLORS['water'])

        geometry = None

        if el_type == 'node' and 'lat' in el:
            geometry = {
                'type': 'Point',
                'coordinates': [el['lon'], el['lat']]
            }

        elif el_type == 'way' and 'geometry' in el:
            coords = [[g['lon'], g['lat']] for g in el['geometry']]
            if len(coords) >= 2:
                # Closed way = polygon (lake, reservoir), open way = line (river)
                if coords[0] == coords[-1] and len(coords) >= 4:
                    geometry = {'type': 'Polygon', 'coordinates': [coords]}
                else:
                    geometry = {'type': 'LineString', 'coordinates': coords}

        if geometry:
            features.append({
                'type': 'Feature',
                'geometry': geometry,
                'properties': {
                    'name':   name,
                    'type':   wtype,
                    'label':  style['label'],
                    'color':  style['color'],
                    'weight': style['weight'],
                    'osm_id': el.get('id')
                }
            })

    return jsonify({
        'type':     'FeatureCollection',
        'features': features,
        'region':   region,
        'count':    len(features)
    })


@app.route('/api/analysis/surface-water', methods=['POST'])
def surface_water():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_surface_water_score(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR surface-water:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/precipitation', methods=['POST'])
def precipitation():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_precipitation_score(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR precipitation:', str(e))
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/analysis/surface-water-tile', methods=['POST'])
def surface_water_tile():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_surface_water_tile(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR surface-water-tile:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/precipitation-tile', methods=['POST'])
def precipitation_tile():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_precipitation_tile(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR precipitation-tile:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/all-morocco/surface-water', methods=['POST'])
def all_morocco_surface_water():
    import json, os
    data       = request.json
    date_start = data.get('dateStart', '2023-01-01')
    date_end   = data.get('dateEnd',   '2023-12-31')
    base_path = os.path.join(
        os.path.dirname(__file__),
        'data/static/morocco_regions.geojson'
    )
    if not os.path.exists(base_path):
        return jsonify({'error': 'morocco_regions.geojson not found'}), 404

    with open(base_path) as f:
        regions = json.load(f)

    results = []
    for feature in regions['features']:
        name = feature['properties'].get('NAME_1', 'unknown')
        print(f'Surface water: {name}')
        try:
            geom   = ee.Geometry(feature['geometry'])
            result = get_surface_water_score(geom, date_start, date_end)
            results.append({
                'name'             : name,
                'color'            : result['transition_color'],  # ← transition color
                'label'            : result['transition_label'],  # ← transition label
                'total_km2'        : result['total_km2'],
                'permanent_km2'    : result['permanent_km2'],
                'seasonal_km2'     : result['seasonal_km2'],
                'occurrence_pct'   : result['occurrence_pct'],
                'transition_class' : result['transition_class'],
                'transition_label' : result['transition_label'],
                'geometry'         : feature['geometry']
            })
        except Exception as e:
            print(f'Error {name}: {e}')
            results.append({
                'name'    : name,
                'color'   : '#E3F2FD',
                'label'   : 'No water',
                'geometry': feature['geometry']
            })

    return jsonify({'regions': results})

@app.route('/api/all-morocco/precipitation', methods=['POST'])
def all_morocco_precipitation():
    import json, os
    data       = request.json
    date_start = data.get('dateStart', '2023-01-01')
    date_end   = data.get('dateEnd',   '2023-12-31')

    base_path = os.path.join(
        os.path.dirname(__file__),
        'data/static/morocco_regions.geojson'
    )
    if not os.path.exists(base_path):
        return jsonify({'error': 'morocco_regions.geojson not found'}), 404

    with open(base_path) as f:
        regions = json.load(f)

    results = []
    for feature in regions['features']:
        name = feature['properties'].get('NAME_1', 'unknown')
        print(f'Precipitation: {name}')
        try:
            geom   = ee.Geometry(feature['geometry'])
            result = get_precipitation_score(geom, date_start, date_end)

            # Couleur basée sur total_mm
            total = result['total_mm']
            if total >= 800:
                color = '#bd0026'
            elif total >= 500:
                color = '#f03b20'
            elif total >= 300:
                color = '#fd8d3c'
            elif total >= 200:
                color = '#fecc5c'
            elif total >= 100:
                color = '#ffffb2'
            else:
                color = '#ffffff'

            results.append({
                'name'           : name,
                'color'          : color,
                'label'          : result.get('label', ''),
                'total_mm'       : result['total_mm'],
                'monthly_avg_mm' : result['monthly_avg_mm'],
                'annual_equiv_mm': result['annual_equiv_mm'],
                'geometry'       : feature['geometry']
            })
        except Exception as e:
            print(f'Error {name}: {e}')
            results.append({
                'name'    : name,
                'color'   : '#ffffff',
                'label'   : 'Erreur',
                'geometry': feature['geometry']
            })

    return jsonify({'regions': results})

@app.route('/api/analysis/temperature', methods=['POST'])
def temperature():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_temperature_score(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR temperature:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/temperature-tile', methods=['POST'])
def temperature_tile():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_temperature_tile(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR temperature-tile:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/all-morocco/temperature', methods=['POST'])
def all_morocco_temperature():
    import json, os
    data       = request.json
    date_start = data.get('dateStart', '2023-01-01')
    date_end   = data.get('dateEnd',   '2023-12-31')

    base_path = os.path.join(
        os.path.dirname(__file__),
        'data/static/morocco_regions.geojson'
    )
    if not os.path.exists(base_path):
        return jsonify({'error': 'morocco_regions.geojson not found'}), 404

    with open(base_path) as f:
        regions = json.load(f)

    results = []
    for feature in regions['features']:
        name = feature['properties'].get('NAME_1', 'unknown')
        print(f'Temperature: {name}')
        try:
            geom   = ee.Geometry(feature['geometry'])
            result = get_temperature_score(geom, date_start, date_end)
            results.append({
                'name'          : name,
                'color'         : result['color'],
                'label'         : result['label'],
                'lst_day_mean'  : result['lst_day_mean'],
                'lst_night_mean': result['lst_night_mean'],
                'amplitude'     : result['amplitude'],
                'geometry'      : feature['geometry']
            })
        except Exception as e:
            print(f'Error {name}: {e}')
            results.append({
                'name'    : name,
                'color'   : '#fee090',
                'label'   : 'Erreur',
                'geometry': feature['geometry']
            })

    return jsonify({'regions': results})

@app.route('/api/analysis/land-suitability', methods=['POST'])
def land_suitability():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_land_suitability_score(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR land-suitability:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/land-suitability-tile', methods=['POST'])
def land_suitability_tile():
    data = request.json
    required = ['geometry', 'dateStart', 'dateEnd']
    for field in required:
        if field not in data:
            return jsonify({'error': 'Champ manquant : ' + field}), 400
    try:
        geometry = ee.Geometry(data['geometry'])
        result   = get_land_suitability_tile(
            geometry   = geometry,
            date_start = data['dateStart'],
            date_end   = data['dateEnd']
        )
        return jsonify(result)
    except Exception as e:
        print('ERREUR land-suitability-tile:', str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/all-morocco/land-suitability', methods=['POST'])
def all_morocco_land_suitability():
    import json, os
    data       = request.json
    date_start = data.get('dateStart', '2023-01-01')
    date_end   = data.get('dateEnd',   '2023-12-31')

    base_path = os.path.join(
        os.path.dirname(__file__),
        'data/static/morocco_regions.geojson'
    )
    if not os.path.exists(base_path):
        return jsonify({'error': 'morocco_regions.geojson not found'}), 404

    with open(base_path) as f:
        regions = json.load(f)

    results = []
    for feature in regions['features']:
        name = feature['properties'].get('NAME_1', 'unknown')
        print(f'Land suitability: {name}')
        try:
            geom   = ee.Geometry(feature['geometry'])
            result = get_land_suitability_score(geom, date_start, date_end)
            results.append({
                'name'          : name,
                'color'         : result['dominant_color'],   # couleur classe dominante
                'label'         : result['dominant_class'],   # nom classe dominante
                'dominant_pct'  : result['dominant_pct'],
                'total_km2'     : result['total_km2'],
                'classes'       : result['classes'],
                'geometry'      : feature['geometry']
            })
        except Exception as e:
            print(f'Error {name}: {e}')
            results.append({
                'name'    : name,
                'color'   : '#b4b4b4',
                'label'   : 'Erreur',
                'geometry': feature['geometry']
            })

    return jsonify({'regions': results})

# app.run() doit toujours etre en dernier
if __name__ == '__main__':
    app.run(
        debug = True,
        port  = int(os.getenv('FLASK_PORT', 5000))
    )

