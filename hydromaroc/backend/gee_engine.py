import ee
import os
from dotenv import load_dotenv

load_dotenv()

# ── Initialisation GEE ──────────────────────────────────────────
def initialize_gee():
    try:
        credentials_path = os.getenv('GEE_CREDENTIALS')
        project_id       = os.getenv('GEE_PROJECT')

        credentials = ee.ServiceAccountCredentials(
            email    = None,
            key_file = credentials_path
        )
        ee.Initialize(credentials, project=project_id)
        print('✓ GEE initialisé avec succès')

    except Exception as e:
        print(f'✗ Erreur GEE : {e}')
        raise


# ── Masque nuages Sentinel-2 ────────────────────────────────────
def mask_clouds(image):
    qa   = image.select('QA60')
    mask = (qa.bitwiseAnd(1 << 10).eq(0)
              .And(qa.bitwiseAnd(1 << 11).eq(0)))
    return image.updateMask(mask).divide(10000)


# ── Charger image Sentinel-2 composite ─────────────────────────
def load_sentinel(geometry, date_start, date_end):
    return (
        ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15))
          .map(mask_clouds)
          .median()
          .clip(geometry)
    )


# ── Calcul des 7 indices ────────────────────────────────────────
def compute_indices(image):
    ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI')
    ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
    lswi = image.normalizedDifference(['B8', 'B11']).rename('LSWI')
    ndmi = image.normalizedDifference(['B8', 'B11']).rename('NDMI')

    savi = image.expression(
        '1.5 * (NIR - RED) / (NIR + RED + 0.5)',
        {
            'NIR': image.select('B8'),
            'RED': image.select('B4')
        }
    ).rename('SAVI')

    bsi = image.expression(
        '(SWIR + RED - NIR - BLUE) / (SWIR + RED + NIR + BLUE)',
        {
            'SWIR': image.select('B11'),
            'RED' : image.select('B4'),
            'NIR' : image.select('B8'),
            'BLUE': image.select('B2')
        }
    ).rename('BSI')

    evi = image.expression(
        '2.5 * (NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1)',
        {
            'NIR' : image.select('B8'),
            'RED' : image.select('B4'),
            'BLUE': image.select('B2')
        }
    ).rename('EVI')

    return ee.Image([ndwi, ndvi, lswi, ndmi, savi, bsi, evi])


# ── Extraire les valeurs moyennes des indices ───────────────────
def get_index_values(geometry, date_start, date_end):
    image   = load_sentinel(geometry, date_start, date_end)
    indices = compute_indices(image)

    stats = indices.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 100,
        bestEffort = True
    )

    # retourne un dict Python avec les valeurs de chaque indice
    return stats.getInfo()


# ── Classification agricole à 3 niveaux ────────────────────────
def classify_region(values):
    
    ndwi = values.get('NDWI', -1)
    ndvi = values.get('NDVI', -1)
    lswi = values.get('LSWI', -1)
    bsi  = values.get('BSI',   1)
    # Score par indice : 2 = bon, 1 = modéré, 0 = mauvais
    scores = {
        'NDWI': 2 if ndwi >= 0.3  else (1 if ndwi >= 0    else 0),
        'NDVI': 2 if ndvi >= 0.4  else (1 if ndvi >= 0.2   else 0),
        'LSWI': 2 if lswi >= 0.2  else (1 if lswi >= 0     else 0),
        'BSI' : 2 if bsi  < -0.1  else (1 if bsi  <= 0.1   else 0),
    }
    total     = sum(scores.values())
    max_score = len(scores) * 2   # 8 maximum

    pct = round((total / max_score) * 100)

    if pct >= 65:
        classe = 'bon'
        label  = "Bien adapté à l'agriculture"
        color  = '#1D9E75'
    elif pct >= 35:
        classe = 'modere'
        label  = 'Usage modéré / conditionnel'
        color  = '#BA7517'
    else:
        classe = 'mauvais'
        label  = 'Zone non exploitable'
        color  = '#D85A30'

    return {
        'score'  : pct,
        'classe' : classe,
        'label'  : label,
        'color'  : color,
        'details': scores,   # score individuel par indice
        'values' : values    # valeurs brutes des indices
    }


# ── Générer tile URL pour Leaflet ───────────────────────────────
def get_tile_url(geometry, index_name, date_start, date_end):
    image   = load_sentinel(geometry, date_start, date_end)
    indices = compute_indices(image)
    layer   = indices.select(index_name)

    palettes = {
        'NDWI': ['D85A30', 'BA7517', 'FAC775', '9FE1CB', '1D9E75'],
        'NDVI': ['D85A30', 'FAC775', '9FE1CB', '1D9E75', '085041'],
        'LSWI': ['D85A30', 'FAC775', '9FE1CB', '1D9E75', '085041'],
        'NDMI': ['D85A30', 'FAC775', '9FE1CB', '1D9E75', '085041'],
        'SAVI': ['D85A30', 'FAC775', '9FE1CB', '1D9E75', '085041'],
        'BSI' : ['1D9E75', '9FE1CB', 'FAC775', 'BA7517', 'D85A30'],
        'EVI' : ['D85A30', 'FAC775', '9FE1CB', '1D9E75', '085041'],
    }

    vis_params = {
        'min'    : -0.5,
        'max'    :  0.5,
        'palette': palettes.get(index_name, palettes['NDWI'])
    }

    map_id = layer.getMapId(vis_params)
    return map_id['tile_fetcher'].url_format


# ── Série temporelle ────────────────────────────────────────────
def get_time_series(geometry, index_name, date_start, date_end):

    collection = (
        ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15))
          .map(mask_clouds)
    )

    def extract(image):
        indices = compute_indices(image)
        value   = indices.select(index_name).reduceRegion(
            reducer    = ee.Reducer.mean(),
            geometry   = geometry,
            scale      = 100,
            bestEffort = True
        ).get(index_name)

        return ee.Feature(None, {
            'date' : image.date().format('YYYY-MM-dd'),
            'value': value
        })

    features = collection.map(extract).getInfo()['features']

    return [
        {
            'date' : f['properties']['date'],
            'value': round(f['properties']['value'], 4)
        }
        for f in features
        if f['properties']['value'] is not None
    ]


# ── Time Series GRACE (eaux souterraines) ──────────────────────
def get_grace_timeseries(geometry, date_start, date_end):
    # GLDAS RootMoist — meilleure alternative à GRACE accessible
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(25000)  # 25km — adapté à GLDAS 0.25°

    collection = (
        ee.ImageCollection('NASA/GLDAS/V021/NOAH/G025/T3H')
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
          .select('RootMoist_inst')  # humidité sol racinaire kg/m²
    )

    print('GLDAS size:', collection.size().getInfo())

    # Agréger en mensuel
    start    = ee.Date(date_start)
    end      = ee.Date(date_end)
    n_months = end.difference(start, 'month').round()
    months   = ee.List.sequence(0, n_months.subtract(1))

    def monthly_mean(n):
        start_m = start.advance(n, 'month')
        end_m   = start_m.advance(1, 'month')
        img     = (collection
                     .filterDate(start_m, end_m)
                     .mean())
        value   = img.reduceRegion(
            reducer    = ee.Reducer.mean(),
            geometry   = geometry,
            scale      = 25000,
            bestEffort = True
        ).get('RootMoist_inst')

        return ee.Feature(None, {
            'date' : start_m.format('YYYY-MM'),
            'value': value
        })

    features = ee.FeatureCollection(
        months.map(monthly_mean)
    ).getInfo()['features']

    print('GLDAS monthly features:', len(features))
    for f in features[:2]:
        print('GLDAS sample:', f['properties'])

    return [
        {
            'date' : f['properties']['date'],
            'value': round(f['properties']['value'], 4)
        }
        for f in features
        if f['properties'].get('value') is not None
    ]


def get_modis_et_timeseries(geometry, date_start, date_end):
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(10000)  # 10km buffer

    collection = (
        ee.ImageCollection('MODIS/061/MOD16A2')
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
          .select('ET')
    )

    print('MODIS size:', collection.size().getInfo())

    def extract(image):
        value = image.reduceRegion(
            reducer    = ee.Reducer.mean(),
            geometry   = geometry,
            scale      = 500,
            bestEffort = True
        ).get('ET')

        return ee.Feature(None, {
            'date' : image.date().format('YYYY-MM-dd'),
            'value': value
        })

    features = collection.map(extract).getInfo()['features']

    print('MODIS features:', len(features))
    for f in features[:2]:
        print('MODIS sample:', f['properties'])

    result = []
    for f in features:
        val = f['properties'].get('value')
        if val is not None and val != -28672:
            result.append({
                'date' : f['properties']['date'],
                'value': round(float(val) * 0.1, 4)
            })

    return result
# ── Time Series CHIRPS (précipitations) ────────────────────────
def get_chirps_timeseries(geometry, date_start, date_end):
    collection = (
        ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
          .filterBounds(geometry)
          .filterDate(date_start, date_end)
          .select('precipitation')  # mm/jour
    )

    def extract(image):
        value = image.reduceRegion(
            reducer    = ee.Reducer.mean(),
            geometry   = geometry,
            scale      = 5000,
            bestEffort = True
        ).get('precipitation')

        return ee.Feature(None, {
            'date' : image.date().format('YYYY-MM-dd'),
            'value': value
        })

    features = collection.map(extract).getInfo()['features']

    return [
        {
            'date' : f['properties']['date'],
            'value': round(f['properties']['value'], 4)
                     if f['properties']['value'] is not None else None
        }
        for f in features
        if f['properties']['value'] is not None
    ]


# ── ESA WorldCover (usage des terres) ──────────────────────────
def get_worldcover(geometry):
    worldcover = (
        ee.ImageCollection('ESA/WorldCover/v200')
          .first()
          .select('Map')
    )

    # Si c'est un Point, ajouter un buffer de 5km
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    classes = {
        10 : 'Foret',
        20 : 'Arbustes',
        30 : 'Prairie',
        40 : 'Agriculture',
        50 : 'Urbain',
        60 : 'Sol nu',
        70 : 'Neige/Glace',
        80 : 'Eau',
        90 : 'Zones humides',
        95 : 'Mangrove',
        100: 'Mousses'
    }

    result = {}

    for code, name in classes.items():
        area = (
            worldcover
              .eq(code)
              .multiply(ee.Image.pixelArea())
              .reduceRegion(
                  reducer    = ee.Reducer.sum(),
                  geometry   = geometry,
                  scale      = 100,
                  bestEffort = True
              )
              .getInfo()
        )

        vals = list(area.values())
        area_km2 = vals[0] / 1e6 if vals and vals[0] else 0

        if area_km2 > 0.01:
            result[name] = round(area_km2, 2)

    # Calculer les pourcentages
    total = sum(result.values())
    result_pct = {
        k: {
            'km2': v,
            'pct': round((v / total) * 100, 1)
        }
        for k, v in result.items()
    }

    return result_pct


# ── Water Analysis — indices eau ───────────────────────────────
def get_water_indices(geometry, date_start, date_end):

    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    image = load_sentinel(geometry, date_start, date_end)

    # Indices spectraux
    ndwi  = image.normalizedDifference(['B3', 'B8']).rename('NDWI')
    mndwi = image.normalizedDifference(['B3', 'B11']).rename('MNDWI')
    lswi  = image.normalizedDifference(['B8', 'B11']).rename('LSWI')
    awei  = image.expression(
        '4 * (GREEN - SWIR1) - (0.25 * NIR + 2.75 * SWIR2)',
        {
            'GREEN': image.select('B3'),
            'SWIR1': image.select('B11'),
            'NIR'  : image.select('B8'),
            'SWIR2': image.select('B12')
        }
    ).rename('AWEI')

    indices = ee.Image([ndwi, mndwi, lswi, awei])
    stats   = indices.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 100,
        bestEffort = True
    )
    values = stats.getInfo()

    # ── Surface Water — JRC Global Surface Water ────────────────
    jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')

    # Superficie eau permanente (occurrence > 75%)
    permanent_water = (jrc.select('occurrence')
                          .gt(75)
                          .multiply(ee.Image.pixelArea())
                          .reduceRegion(
                              reducer    = ee.Reducer.sum(),
                              geometry   = geometry,
                              scale      = 30,
                              bestEffort = True
                          ).getInfo())

    # Superficie eau saisonnière (occurrence 25-75%)
    seasonal_water = (jrc.select('occurrence')
                         .gt(25).And(jrc.select('occurrence').lt(75))
                         .multiply(ee.Image.pixelArea())
                         .reduceRegion(
                             reducer    = ee.Reducer.sum(),
                             geometry   = geometry,
                             scale      = 30,
                             bestEffort = True
                         ).getInfo())

    perm_vals  = list(permanent_water.values())
    seas_vals  = list(seasonal_water.values())

    surface_water_km2   = round(perm_vals[0]  / 1e6, 3) if perm_vals  and perm_vals[0]  else 0
    seasonal_water_km2  = round(seas_vals[0]  / 1e6, 3) if seas_vals  and seas_vals[0]  else 0

    # ── Ground Water — GLDAS Root Zone Soil Moisture ────────────
    gldas = (ee.ImageCollection('NASA/GLDAS/V021/NOAH/G025/T3H')
               .filterBounds(geometry)
               .filterDate(date_start, date_end)
               .select(['SoilMoi0_10cm_inst',
                        'SoilMoi10_40cm_inst',
                        'SoilMoi40_100cm_inst',
                        'SoilMoi100_200cm_inst'])
               .mean())

    gldas_stats = gldas.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 25000,
        bestEffort = True
    ).getInfo()

    # Humidité totale du sol (0-200cm) en kg/m²
    sm_0_10   = gldas_stats.get('SoilMoi0_10cm_inst',   0) or 0
    sm_10_40  = gldas_stats.get('SoilMoi10_40cm_inst',  0) or 0
    sm_40_100 = gldas_stats.get('SoilMoi40_100cm_inst', 0) or 0
    sm_100_200= gldas_stats.get('SoilMoi100_200cm_inst',0) or 0

    total_soil_moisture = round(sm_0_10 + sm_10_40 + sm_40_100 + sm_100_200, 2)

    # Niveau : faible < 200, modéré 200-400, élevé > 400 kg/m²
    if total_soil_moisture >= 400:
        gw_level = 'Élevé'
        gw_color = '#0C447C'
    elif total_soil_moisture >= 200:
        gw_level = 'Modéré'
        gw_color = '#378ADD'
    else:
        gw_level = 'Faible'
        gw_color = '#B5D4F4'

    # Classification couleur finale
    ndwi_val  = values.get('NDWI',  -1)
    mndwi_val = values.get('MNDWI', -1)

    if ndwi_val >= 0.2 or mndwi_val >= 0.2:
        water_class = 'abondant'
        color       = '#0C447C'
        label       = 'Ressources en eau abondantes'
    elif ndwi_val >= 0 or mndwi_val >= 0:
        water_class = 'modere'
        color       = '#378ADD'
        label       = 'Ressources en eau moderees'
    else:
        water_class = 'faible'
        color       = '#B5D4F4'
        label       = 'Ressources en eau faibles'

    return {
        'water_class'        : water_class,
        'color'              : color,
        'label'              : label,
        'values'             : values,
        'surface_water'      : {
            'permanent_km2' : surface_water_km2,
            'seasonal_km2'  : seasonal_water_km2,
            'total_km2'     : round(surface_water_km2 + seasonal_water_km2, 3)
        },
        'ground_water'       : {
            'total_moisture_kg_m2': total_soil_moisture,
            'level'               : gw_level,
            'color'               : gw_color,
            'layers'              : {
                '0-10cm'  : round(sm_0_10,    2),
                '10-40cm' : round(sm_10_40,   2),
                '40-100cm': round(sm_40_100,  2),
                '100-200cm': round(sm_100_200, 2)
            }
        }
    }
# ── JRC Global Surface Water — occurrence eau ──────────────────
def get_jrc_water(geometry):
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(10000)
    # JRC — fréquence de présence d'eau sur 1984-2021
    jrc = (ee.Image('JRC/GSW1_4/GlobalSurfaceWater')
             .select('occurrence')
             .clip(geometry))

    stats = jrc.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 30,
        bestEffort = True
    )

    # Superficie totale avec eau (occurrence > 10%)
    water_area = (jrc.gt(10)
                    .multiply(ee.Image.pixelArea())
                    .reduceRegion(
                        reducer    = ee.Reducer.sum(),
                        geometry   = geometry,
                        scale      = 30,
                        bestEffort = True
                    ).getInfo())

    occurrence  = stats.getInfo().get('occurrence', 0)
    area_vals   = list(water_area.values())
    area_km2    = round(area_vals[0] / 1e6, 2) if area_vals and area_vals[0] else 0

    return {
        'occurrence_mean': round(occurrence, 2) if occurrence else 0,
        'water_area_km2' : area_km2
    }

def compute_water_health_score(geometry, date_start, date_end):

    # NDWI from Sentinel-2 (weight 40%)
    try:
        s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                .filterDate(date_start, date_end)
                .filterBounds(geometry)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                .median())
        ndwi_val = (s2.normalizedDifference(['B3', 'B8'])
                      .reduceRegion(
                          reducer   = ee.Reducer.mean(),
                          geometry  = geometry,
                          scale     = 500,
                          maxPixels = 1e9
                      ).getInfo().get('nd', None))
        ndwi_score = max(0, min(100, (ndwi_val + 1) / 2 * 100)) if ndwi_val is not None else 0
    except Exception as e:
        print(f'NDWI error: {e}')
        ndwi_score = 0

    # JRC Surface Water occurrence (weight 35%)
    try:
        jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence')
        water_val = (jrc.reduceRegion(
                         reducer   = ee.Reducer.mean(),
                         geometry  = geometry,
                         scale     = 500,
                         maxPixels = 1e9
                     ).getInfo().get('occurrence', None))
        water_score = water_val if water_val is not None else 0
    except Exception as e:
        print(f'JRC error: {e}')
        water_score = 0

    # CHIRPS Precipitation (weight 25%)
    try:
        chirps = (ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
                    .filterDate(date_start, date_end)
                    .filterBounds(geometry)
                    .mean())
        precip_val = (chirps.reduceRegion(
                          reducer   = ee.Reducer.mean(),
                          geometry  = geometry,
                          scale     = 5000,
                          maxPixels = 1e9
                      ).getInfo().get('precipitation', None))
        precip_score = min(100, (precip_val / 10) * 100) if precip_val is not None else 0
    except Exception as e:
        print(f'CHIRPS error: {e}')
        precip_score = 0

    combined = (ndwi_score * 0.40) + (water_score * 0.35) + (precip_score * 0.25)

    # Couleur selon score
    if combined >= 75:   color = '#0D47A1'
    elif combined >= 50: color = '#1976D2'
    elif combined >= 25: color = '#90CAF9'
    else:                color = '#E3F2FD'

    return {
        'score'        : round(combined, 1),
        'color'        : color,
        'ndwi'         : round(ndwi_score, 1),
        'water'        : round(water_score, 1),
        'precipitation': round(precip_score, 1)
    }

# ── OSM — sources d'eau nommées via Overpass API ───────────────
def get_osm_water_sources(geometry):
    import requests
    from urllib.parse import urlencode

    # Obtenir la bounding box
    bounds = geometry.bounds().getInfo()
    coords = bounds['coordinates'][0]
    lats   = [c[1] for c in coords]
    lngs   = [c[0] for c in coords]

    south = min(lats)
    north = max(lats)
    west  = min(lngs)
    east  = max(lngs)

    print(f'OSM bbox: {south},{west},{north},{east}')

    query = f"""
[out:json][timeout:60];
(
  way["waterway"~"river|stream|canal"]({south},{west},{north},{east});
  relation["waterway"~"river|stream"]({south},{west},{north},{east});
  way["natural"="water"]({south},{west},{north},{east});
  relation["natural"="water"]({south},{west},{north},{east});
  node["natural"~"water|spring|lake"]({south},{west},{north},{east});
  way["man_made"="dam"]({south},{west},{north},{east});
  node["man_made"="dam"]({south},{west},{north},{east});
  way["water"~"lake|reservoir"]({south},{west},{north},{east});
);
out tags;
"""

    try:
        # Utiliser GET au lieu de POST
        response = requests.get(
            'https://overpass-api.de/api/interpreter',
            params  = {'data': query},
            headers = {'User-Agent': 'HydroMaroc/1.0'},
            timeout = 60
        )

        print(f'OSM status: {response.status_code}')

        if response.status_code != 200:
            print(f'OSM error: {response.text[:300]}')
            return {'rivers': [], 'lakes': [], 'dams': []}

        data     = response.json()
        elements = data.get('elements', [])

        print(f'OSM elements found: {len(elements)}')

        rivers = set()
        lakes  = set()
        dams   = set()

        for el in elements:
            tags = el.get('tags', {})

            name = (tags.get('name')
                 or tags.get('name:fr')
                 or tags.get('name:ar')
                 or tags.get('name:en'))

            if not name:
                continue

            waterway = tags.get('waterway', '')
            natural  = tags.get('natural',  '')
            water    = tags.get('water',    '')
            man_made = tags.get('man_made', '')

            if waterway in ['river', 'stream', 'canal']:
                rivers.add(name)
            elif natural in ['water', 'lake'] or water in ['lake', 'reservoir', 'pond']:
                lakes.add(name)
            elif man_made == 'dam' or waterway == 'dam':
                dams.add(name)

        result = {
            'rivers': sorted(list(rivers))[:15],
            'lakes' : sorted(list(lakes))[:15],
            'dams'  : sorted(list(dams))[:15]
        }

        print(f'OSM result: rivers={len(result["rivers"])} lakes={len(result["lakes"])} dams={len(result["dams"])}')
        return result

    except requests.exceptions.Timeout:
        print('OSM timeout')
        return {'rivers': [], 'lakes': [], 'dams': [], 'error': 'Timeout'}
    except Exception as e:
        print(f'OSM exception: {e}')
        return {'rivers': [], 'lakes': [], 'dams': [], 'error': str(e)}




    #Surface water Chirps ....

def get_surface_water_score(geometry, date_start, date_end):
    geometry = geometry.simplify(maxError=1000)
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    # JRC Global Surface Water — occurrence sur 1984-2021
    jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')
    occurrence  = jrc.select('occurrence')
    seasonality = jrc.select('seasonality')
    recurrence  = jrc.select('recurrence')
    transition  = jrc.select('transition')

    stats = occurrence.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 30,
        bestEffort = True
    ).getInfo()

    seas_stats = seasonality.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 30,
        bestEffort = True
    ).getInfo()

    # Superficie eau permanente km² (occurrence > 75%)
    perm = (occurrence.gt(75)
            .multiply(ee.Image.pixelArea())
            .reduceRegion(
                reducer    = ee.Reducer.sum(),
                geometry   = geometry,
                scale      = 30,
                bestEffort = True
            ).getInfo())

    # Superficie eau saisonnière km² (occurrence 25-75%)
    seas = (occurrence.gt(25).And(occurrence.lte(75))
            .multiply(ee.Image.pixelArea())
            .reduceRegion(
                reducer    = ee.Reducer.sum(),
                geometry   = geometry,
                scale      = 30,
                bestEffort = True
            ).getInfo())
    
    trans_stats = transition.reduceRegion(
        reducer    = ee.Reducer.mode(),
        geometry   = geometry,
        scale      = 30,
        bestEffort = True
    ).getInfo()


    occ_val   = stats.get('occurrence',   0) or 0
    seas_val  = seas_stats.get('seasonality', 0) or 0
    perm_vals = list(perm.values())
    seas_vals = list(seas.values())
    trans_val = int(trans_stats.get('transition', 0) or 0)

    perm_km2  = round(perm_vals[0] / 1e6, 3) if perm_vals and perm_vals[0] else 0
    seas_km2  = round(seas_vals[0] / 1e6, 3) if seas_vals and seas_vals[0] else 0
    total_km2 = round(perm_km2 + seas_km2, 3)
    TRANSITION_LABELS = {
        0 : {'label': 'No water',            'color': '#E3F2FD'},
        1 : {'label': 'Permanent water',     'color': '#0D47A1'},
        2 : {'label': 'New permanent water', 'color': '#00BCD4'},
        3 : {'label': 'Lost permanent water','color': '#D32F2F'},
        4 : {'label': 'Seasonal water',      'color': '#1976D2'},
        5 : {'label': 'New seasonal water',  'color': '#388E3C'},
        6 : {'label': 'Lost seasonal water', 'color': '#F57C00'},
        7 : {'label': 'Dried seasonal water','color': '#FBC02D'},
        8 : {'label': 'Ephemeral water',     'color': '#7B1FA2'},
        9 : {'label': 'Seasonal to permanent','color': '#00796B'},
        10: {'label': 'Permanent to seasonal','color': '#E91E63'},
        11: {'label': 'Ephemeral to permanent','color': '#303F9F'},
    }

    trans_info = TRANSITION_LABELS.get(trans_val, TRANSITION_LABELS[0])

    return {
        'occurrence_pct': round(occ_val, 2),
        'seasonality_months': round(seas_val, 1),
        'permanent_km2' : perm_km2,
        'seasonal_km2'  : seas_km2,
        'total_km2'     : total_km2,
        'transition_class'   : trans_val,
        'transition_label'   : trans_info['label'],
        'transition_color'   : trans_info['color'],
        'dataset'       : 'JRC Global Surface Water v1.4'
    }


def get_precipitation_score(geometry, date_start, date_end):
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    # CHIRPS Daily — précipitations journalières
    chirps_total = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
                      .filterBounds(geometry)
                      .filterDate(date_start, date_end)
                      .select('precipitation')
                      .sum())

    chirps_mean = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
                     .filterBounds(geometry)
                     .filterDate(date_start, date_end)
                     .select('precipitation')
                     .mean())

    # Jours de pluie (precipitation > 1mm)
    rainy_days = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
                    .filterBounds(geometry)
                    .filterDate(date_start, date_end)
                    .select('precipitation')
                    .map(lambda img: img.gt(1))
                    .sum())

    total_stats = chirps_total.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 5000,
        bestEffort = True
    ).getInfo()

    mean_stats = chirps_mean.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 5000,
        bestEffort = True
    ).getInfo()

    rainy_stats = rainy_days.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 5000,
        bestEffort = True
    ).getInfo()

    total_mm   = round(total_stats.get('precipitation', 0) or 0, 1)
    daily_avg  = round(mean_stats.get('precipitation',  0) or 0, 2)
    rainy_days_count = round(rainy_stats.get('precipitation', 0) or 0, 0)

    # Equivalent annuel
    from datetime import datetime
    d1   = datetime.strptime(date_start, '%Y-%m-%d')
    d2   = datetime.strptime(date_end,   '%Y-%m-%d')
    days = max((d2 - d1).days, 1)
    annual_equiv = round(total_mm * (365 / days), 1)
    monthly_avg  = round(total_mm / max(days / 30, 1), 1)
    return {
        'total_mm'     : total_mm,
        'daily_avg_mm' : daily_avg,
        'monthly_avg_mm': monthly_avg,
        'annual_equiv_mm': annual_equiv,
        'rainy_days'   : int(rainy_days_count),
        'dataset'      : 'CHIRPS v2.0 Daily '
    }

def get_surface_water_tile(geometry, date_start, date_end):
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)
    # JRC Global Surface Water — occurrence
    jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence')
    # Clipper sur la géométrie
    layer = jrc.clip(geometry)
    vis_params = {
        'min'    : 0,
        'max'    : 100,
        'palette': [
            'ffffff',  # 0%  — pas d'eau
            'b3d9ff',  # 25% — eau rare
            '6baed6',  # 50% — eau saisonnière
            '2171b5',  # 75% — eau fréquente
            '08306b'   # 100% — eau permanente
        ]
    }
    map_id = layer.getMapId(vis_params)
    return {
        'tile_url': map_id['tile_fetcher'].url_format,
        'dataset' : 'JRC Global Surface Water — Occurrence',
        'legend'  : [
            {'color': '#ffffff', 'label': '0%'},
            {'color': '#b3d9ff', 'label': '25%'},
            {'color': '#6baed6', 'label': '50%'},
            {'color': '#2171b5', 'label': '75%'},
            {'color': '#08306b', 'label': '100%'},
        ]
    }

def get_precipitation_tile(geometry, date_start, date_end):
    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)
    # CHIRPS — précipitations totales sur la période
    chirps = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
                .filterBounds(geometry)
                .filterDate(date_start, date_end)
                .select('precipitation')
                .sum()
                .clip(geometry))

    vis_params = {
        'min'    : 0,
        'max'    : 800,
        'palette': [
            'ffffff',  # 0mm   
            'ffffb2',  # 100mm
            'fecc5c',  # 200mm 
            'fd8d3c',  # 300mm 
            'f03b20',  # 500mm 
            'bd0026'   # 800mm 
        ]
    }

    map_id = chirps.getMapId(vis_params)
    return {
        'tile_url': map_id['tile_fetcher'].url_format,
        'dataset' : 'CHIRPS v2.0 — Précipitations totales',
        'legend'  : [
            {'color': '#ffffff', 'label': '0 mm'},
            {'color': '#ffffb2', 'label': '100 mm'},
            {'color': '#fecc5c', 'label': '200 mm'},
            {'color': '#fd8d3c', 'label': '300 mm'},
            {'color': '#f03b20', 'label': '500 mm'},
            {'color': '#bd0026', 'label': '800 mm'},
        ]
    }


def get_temperature_score(geometry, date_start, date_end):

    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    # MODIS LST — température de surface diurne
    lst = (ee.ImageCollection('MODIS/061/MOD11A2')
             .filterBounds(geometry)
             .filterDate(date_start, date_end)
             .select('LST_Day_1km')
             .mean()
             .multiply(0.02)       # facteur d'échelle officiel
             .subtract(273.15)     # Kelvin → Celsius
             .clip(geometry))

    lst_night = (ee.ImageCollection('MODIS/061/MOD11A2')
                   .filterBounds(geometry)
                   .filterDate(date_start, date_end)
                   .select('LST_Night_1km')
                   .mean()
                   .multiply(0.02)
                   .subtract(273.15)
                   .clip(geometry))

    stats_day = lst.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 1000,
        bestEffort = True
    ).getInfo()

    stats_night = lst_night.reduceRegion(
        reducer    = ee.Reducer.mean(),
        geometry   = geometry,
        scale      = 1000,
        bestEffort = True
    ).getInfo()

    stats_min = lst.reduceRegion(
        reducer    = ee.Reducer.min(),
        geometry   = geometry,
        scale      = 1000,
        bestEffort = True
    ).getInfo()

    stats_max = lst.reduceRegion(
        reducer    = ee.Reducer.max(),
        geometry   = geometry,
        scale      = 1000,
        bestEffort = True
    ).getInfo()

    lst_day_mean   = round(stats_day.get('LST_Day_1km',   0) or 0, 1)
    lst_night_mean = round(stats_night.get('LST_Night_1km', 0) or 0, 1)
    lst_min        = round(stats_min.get('LST_Day_1km',   0) or 0, 1)
    lst_max        = round(stats_max.get('LST_Day_1km',   0) or 0, 1)
    amplitude      = round(lst_day_mean - lst_night_mean, 1)

    if lst_day_mean < 10:
        color = '#313695'
    elif lst_day_mean < 20:
        color = '#74add1'
    elif lst_day_mean < 30:
        color = '#fee090'
    elif lst_day_mean < 40:
        color = '#f46d43'
    else:
        color = '#a50026'

    return {
        'lst_day_mean'  : lst_day_mean,
        'lst_night_mean': lst_night_mean,
        'lst_min'       : lst_min,
        'lst_max'       : lst_max,
        'amplitude'     : amplitude,
        'color'         : color,
        'dataset'       : 'MODIS MOD11A2 — Land Surface Temperature'
    }


def get_temperature_tile(geometry, date_start, date_end):

    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    lst = (ee.ImageCollection('MODIS/061/MOD11A2')
             .filterBounds(geometry)
             .filterDate(date_start, date_end)
             .select('LST_Day_1km')
             .mean()
             .multiply(0.02)
             .subtract(273.15)
             .clip(geometry))

    vis_params = {
        'min'    : 0,
        'max'    : 50,
        'palette': [
            '313695',
            '74add1', 
            'fee090', 
            'f46d43', 
            'a50026'   
        ]
    }

    map_id = lst.getMapId(vis_params)
    return {
        'tile_url': map_id['tile_fetcher'].url_format,
        'dataset' : 'MODIS MOD11A2 — LST Diurne',
        'legend'  : [
            {'color': '#313695', 'label': '< 10°C ' },
            {'color': '#74add1', 'label': '10–20°C'     },
            {'color': '#fee090', 'label': '20–30°C'   },
            {'color': '#f46d43', 'label': '30–40°C '     },
            {'color': '#a50026', 'label': '> 40°C ' },
        ]
    }

def get_land_suitability_score(geometry, date_start, date_end):

    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    worldcover = (ee.ImageCollection('ESA/WorldCover/v200')
                    .first()
                    .select('Map')
                    .clip(geometry))

    # Une seule requête GEE
    pixel_counts = worldcover.reduceRegion(
        reducer    = ee.Reducer.frequencyHistogram(),
        geometry   = geometry,
        scale      = 100,
        bestEffort = True,
        maxPixels  = 1e9
    ).getInfo()

    histogram  = pixel_counts.get('Map', {})
    pixel_size = 100 * 100  # 100m × 100m = 10000 m²

    # Classes officielles ESA WorldCover
    CLASS_MAP = {
        10 : {'label': 'Tree cover',        'color': '#006400'},
        20 : {'label': 'Shrubland',         'color': '#ffbb22'},
        30 : {'label': 'Grassland',         'color': '#ffff4c'},
        40 : {'label': 'Cropland',          'color': '#f096ff'},
        50 : {'label': 'Built-up',          'color': '#fa0000'},
        60 : {'label': 'Bare/sparse veg.',  'color': '#b4b4b4'},
        70 : {'label': 'Snow and ice',      'color': '#f0f0f0'},
        80 : {'label': 'Permanent water',   'color': '#0064c8'},
        90 : {'label': 'Herbaceous wetland','color': '#0096a0'},
        95 : {'label': 'Mangroves',         'color': '#00cf75'},
        100: {'label': 'Moss and lichen',   'color': '#fae6a0'},
    }

    total_pixels = sum(histogram.values()) if histogram else 1
    total_km2    = round(total_pixels * pixel_size / 1e6, 2)

    classes_result = {}
    dominant_class  = None
    dominant_pixels = 0

    for code, info in CLASS_MAP.items():
        pixels   = histogram.get(str(code), 0) or histogram.get(code, 0)
        area_km2 = round(pixels * pixel_size / 1e6, 3)
        pct      = round((pixels / total_pixels) * 100, 1) if total_pixels > 0 else 0

        if area_km2 > 0:
            classes_result[str(code)] = {
                'label'   : info['label'],
                'color'   : info['color'],
                'area_km2': area_km2,
                'pct'     : pct
            }

        if pixels > dominant_pixels:
            dominant_pixels = pixels
            dominant_class  = code

    dom_info = CLASS_MAP.get(dominant_class, CLASS_MAP[60])

    return {
        'dominant_class': dom_info['label'],
        'dominant_color': dom_info['color'],
        'dominant_pct'  : classes_result.get(str(dominant_class), {}).get('pct', 0),
        'total_km2'     : total_km2,
        'classes'       : classes_result,
        'dataset'       : 'ESA WorldCover v200 (2021)'
    }


def get_land_suitability_tile(geometry, date_start, date_end):

    geo_type = geometry.type().getInfo()
    if geo_type == 'Point':
        geometry = geometry.buffer(5000)

    worldcover = (ee.ImageCollection('ESA/WorldCover/v200')
                    .first()
                    .select('Map')
                    .clip(geometry))

    vis_params = {
        'min'    : 10,
        'max'    : 100,
        'palette': [
            '006400',  # 10 — Tree cover
            'ffbb22',  # 20 — Shrubland
            'ffff4c',  # 30 — Grassland
            'f096ff',  # 40 — Cropland
            'fa0000',  # 50 — Built-up
            'b4b4b4',  # 60 — Bare/sparse
            'f0f0f0',  # 70 — Snow/Ice
            '0064c8',  # 80 — Water
            '0096a0',  # 90 — Wetland
            '00cf75',  # 95 — Mangroves
            'fae6a0'   # 100 — Moss/lichen
        ]
    }

    map_id = worldcover.getMapId(vis_params)
    return {
        'tile_url': map_id['tile_fetcher'].url_format,
        'dataset' : 'ESA WorldCover v200 — Land Cover',
        'legend'  : [
            {'color': '#006400', 'label': 'Tree cover'   },
            {'color': '#ffbb22', 'label': 'Shrubland'    },
            {'color': '#ffff4c', 'label': 'Grassland'    },
            {'color': '#f096ff', 'label': 'Cropland'     },
            {'color': '#fa0000', 'label': 'Built-up'     },
            {'color': '#b4b4b4', 'label': 'Bare/sparse'  },
            {'color': '#0064c8', 'label': 'Water bodies' },
            {'color': '#0096a0', 'label': 'Wetland'      },
        ]
    }