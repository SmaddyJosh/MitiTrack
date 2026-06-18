import io
import os
import math
import base64
import zipfile
import hashlib
import requests
from functools import lru_cache

from dotenv import load_dotenv
load_dotenv()  # reads .env automatically

from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageDraw
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from ultralytics import YOLO

# ── Config from .env ────────────────────────────────────────
GOOGLE_API_KEY  = os.getenv("GOOGLE_MAPS_API_KEY", "")
MODEL_PATH_ENV  = os.getenv("MODEL_PATH", "deforestation_yolov8_best/best.pt")
CACHE_MAX_SIZE  = int(os.getenv("CACHE_MAX_SIZE", 128))

# ─────────────────────────────────────────────
# Model Loading
# ─────────────────────────────────────────────
import torch

MODEL_DIR = "deforestation_yolov8_best/best"
MODEL_PT  = "deforestation_yolov8_best/best.pt"

def _load_model():
    """
    Try loading the YOLO model from multiple possible locations/formats:
    1. best.pt  (standard YOLO export)
    2. best/    (PyTorch v2 directory checkpoint — load data.pkl directly)
    """
    # Option 1: plain .pt file next to the directory
    if os.path.exists(MODEL_PT):
        try:
            m = YOLO(MODEL_PT)
            print(f"[MitiTrack] Loaded from {MODEL_PT}. Classes: {m.names}")
            return m
        except Exception as e:
            print(f"[MitiTrack] {MODEL_PT} failed: {e}")

    # Option 2: PyTorch v2 directory — load via torch then hand to YOLO
    pkl_path = os.path.join(MODEL_DIR, "data.pkl")
    if os.path.exists(pkl_path):
        try:
            ckpt = torch.load(pkl_path, map_location="cpu", weights_only=False)
            # ckpt may be the full YOLO checkpoint dict or just the state_dict
            if isinstance(ckpt, dict) and "model" in ckpt:
                m = YOLO(MODEL_PT if os.path.exists(MODEL_PT) else "yolov8n.pt")
                m.model.load_state_dict(ckpt["model"].state_dict(), strict=False)
            else:
                # It's already a model object
                m = YOLO("yolov8n.pt")   # skeleton for names/config
                m.model = ckpt
            print(f"[MitiTrack] Loaded from {pkl_path}. Classes: {m.names}")
            return m
        except Exception as e:
            print(f"[MitiTrack] data.pkl load failed: {e}")

    raise FileNotFoundError(
        "Cannot load model. Expected one of:\n"
        f"  • {MODEL_PT}\n"
        f"  • {MODEL_DIR}/data.pkl\n"
        "Please make sure deforestation_yolov8_best/ is present."
    )

model = _load_model()

# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────
app = FastAPI(
    title="MitiTrack Forest Analysis API",
    description="Detect deforestation & reforestation rates using YOLOv8 satellite imagery analysis.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Class label helpers — matched to actual model classes
# ─────────────────────────────────────────────
FOREST_LABELS     = {"tree", "Tree"}
DEFORESTED_LABELS = {"farmland", "building"}

COLOR_MAP = {
    "Tree":     "#22c55e",
    "tree":     "#16a34a",
    "building": "#8b5cf6",
    "farmland": "#eab308",
    "water":    "#3b82f6",
}

# ─────────────────────────────────────────────
# Utility functions
# ─────────────────────────────────────────────
@lru_cache(maxsize=256)
def geocode(place: str):
    """Cached geocoding — returns lat, lon, and full address hierarchy."""
    try:
        geo = Nominatim(user_agent="mititrack-v2", timeout=10)
        loc = None
        
        # Check if coordinates (e.g. "-1.25, 36.8")
        try:
            parts = [float(p.strip()) for p in place.split(",")]
            if len(parts) == 2:
                loc = geo.reverse((parts[0], parts[1]), addressdetails=True)
        except Exception:
            pass

        # If not coordinates or reverse failed, search as text
        if not loc:
            loc = geo.geocode(place, addressdetails=True)

        if not loc:
            raise HTTPException(status_code=404, detail=f"Location not found: '{place}'")

        addr = loc.raw.get("address", {})

        # Extract hierarchy
        village   = addr.get("village") or addr.get("hamlet") or addr.get("isolated_dwellings")
        subcounty = addr.get("subcounty") or addr.get("district") or addr.get("suburb") or addr.get("neighborhood")
        city      = addr.get("city") or addr.get("town") or addr.get("municipality")
        county    = addr.get("county") or addr.get("state")
        country   = addr.get("country")

        parts = []
        if village:
            parts.append(village)
        if subcounty:
            parts.append(subcounty)
        if city:
            parts.append(city)
        if county:
            parts.append(county)
        if country:
            parts.append(country)

        resolved_address = ", ".join(parts) if parts else loc.address
        return loc.latitude, loc.longitude, resolved_address
    except GeocoderTimedOut:
        raise HTTPException(status_code=504, detail="Geocoding service timed out. Try again.")


@lru_cache(maxsize=512)
def lat_lon_to_tile(lat: float, lon: float, zoom: int):
    lat_r = math.radians(lat)
    n     = 2 ** zoom
    x     = int((lon + 180.0) / 360.0 * n)
    y     = int((1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n)
    return x, y


# ── Tile cache (keyed by url hash) ─────────────────────────
_tile_cache: dict = {}

def _get_tile_bytes(url: str) -> bytes:
    """Fetch a tile URL with in-memory caching so the same tile is never re-downloaded."""
    key = hashlib.md5(url.encode()).hexdigest()
    if key in _tile_cache:
        return _tile_cache[key]
    resp = requests.get(url, timeout=20)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Tile fetch failed: {url} ({resp.status_code})")
    if len(_tile_cache) >= CACHE_MAX_SIZE:
        _tile_cache.pop(next(iter(_tile_cache)))  # evict oldest
    _tile_cache[key] = resp.content
    return resp.content


def fetch_esri_tile(lat: float, lon: float, zoom: int = 15) -> Image.Image:
    """Free Esri World Imagery satellite tile (no key required)."""
    x, y = lat_lon_to_tile(lat, lon, zoom)
    url  = (
        f"https://server.arcgisonline.com/ArcGIS/rest/services/"
        f"World_Imagery/MapServer/tile/{zoom}/{y}/{x}"
    )
    return Image.open(io.BytesIO(_get_tile_bytes(url))).convert("RGB")


def fetch_nasa_landsat_tile(lat: float, lon: float, year: int, zoom: int = 10) -> Image.Image:
    """NASA GIBS WMTS — free Landsat annual imagery back to 2013 (cached)."""
    x, y  = lat_lon_to_tile(lat, lon, zoom)
    date  = f"{year}-01-01"
    layer = "Landsat_WELD_CorrectedReflectance_Bands321_Global_Annual"
    url   = (
        f"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/"
        f"{layer}/default/{date}/GoogleMapsCompatible_Level12/{zoom}/{y}/{x}.jpg"
    )
    try:
        return Image.open(io.BytesIO(_get_tile_bytes(url))).convert("RGB")
    except HTTPException:
        return fetch_esri_tile(lat, lon, zoom)  # fallback if year not available


def fetch_google_tile(lat: float, lon: float, zoom: int, api_key: str) -> Image.Image:
    """Google Maps Static API — high-resolution satellite (cached)."""
    url = (
        f"https://maps.googleapis.com/maps/api/staticmap"
        f"?center={lat},{lon}&zoom={zoom}&size=640x640&maptype=satellite&key={api_key}"
    )
    return Image.open(io.BytesIO(_get_tile_bytes(url))).convert("RGB")


def run_inference(image: Image.Image):
    results      = model.predict(image, conf=0.25, iou=0.45, verbose=False)
    result       = results[0]
    detections   = []
    class_counts = {}

    for box in result.boxes:
        label      = result.names[int(box.cls)]
        confidence = round(float(box.conf), 3)
        bbox       = [round(v, 1) for v in box.xyxy[0].tolist()]
        detections.append({"label": label, "confidence": confidence, "bbox": bbox})
        class_counts[label] = class_counts.get(label, 0) + 1

    # Color-based segmentation using numpy
    import numpy as np
    img_arr = np.array(image)
    r = img_arr[:, :, 0].astype(float)
    g = img_arr[:, :, 1].astype(float)
    b = img_arr[:, :, 2].astype(float)

    # Forest/Vegetation: Green is dominant
    forest_mask = (g > r) & (g > b) & (g > 30)
    # Water: Blue is dominant
    water_mask = (b > g) & (b > r) & (b > 30)
    # Sand/Desert: high brightness, yellowish/beige
    sand_mask = (r > 150) & (g > 120) & (r > g) & (g > b * 1.05) & ~forest_mask & ~water_mask

    
    # Clay Soil: reddish/brownish, moderate brightness
    clay_mask = (r > 90) & (r > g * 1.1) & (g > b) & (r < 180) & ~forest_mask & ~water_mask & ~sand_mask

    # Stony / Rocky / Gray area: low saturation, moderate brightness
    stone_mask = (np.abs(r - g) < 10) & (np.abs(g - b) < 10) & (r > 50) & (r < 160) & ~forest_mask & ~water_mask & ~sand_mask & ~clay_mask

    # Deforested/Bare Land: everything else that isn't sand, clay, stone, forest, or water
    deforested_mask = ~forest_mask & ~water_mask & ~sand_mask & ~clay_mask & ~stone_mask & ((r > 40) | (g > 40) | (b > 40))

    total_pixels = img_arr.shape[0] * img_arr.shape[1]
    forest_area_pct = round(float(forest_mask.sum()) / total_pixels * 100, 1)
    deforested_area_pct = round(float(deforested_mask.sum()) / total_pixels * 100, 1)
    sand_area_pct = round(float(sand_mask.sum()) / total_pixels * 100, 1)
    clay_area_pct = round(float(clay_mask.sum()) / total_pixels * 100, 1)
    stone_area_pct = round(float(stone_mask.sum()) / total_pixels * 100, 1)

    return detections, class_counts, deforested_area_pct, forest_area_pct, sand_area_pct, clay_area_pct, stone_area_pct


def annotate(image: Image.Image, detections: list) -> Image.Image:
    draw = ImageDraw.Draw(image)
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        color = COLOR_MAP.get(det["label"].lower(), "#ffffff")
        draw.rectangle([x1, y1, x2, y2], outline=color, width=2)
        draw.text((x1 + 2, y1 + 2), f'{det["label"]} {det["confidence"]}', fill=color)
    return image


def to_b64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


def forest_metrics(class_counts: dict, total: int, forest_area_pct: float = 0.0, deforested_area_pct: float = 0.0) -> dict:
    forest_n     = sum(v for k, v in class_counts.items() if k.lower() in FOREST_LABELS)
    deforested_n = sum(v for k, v in class_counts.items() if k.lower() in DEFORESTED_LABELS)
    combined     = max(forest_n + deforested_n, 1)

    forest_pct     = forest_area_pct if forest_area_pct > 0 else round(forest_n / max(total, 1) * 100, 1)
    deforested_pct = deforested_area_pct if deforested_area_pct > 0 else round(deforested_n / max(total, 1) * 100, 1)
    
    total_area = forest_pct + deforested_pct
    if total_area > 0:
        risk_score = round((deforested_pct / total_area) * 100, 1)
    else:
        risk_score = round(deforested_n / combined * 100, 1)

    if risk_score > 60:
        status = "Critical"
    elif risk_score > 30:
        status = "Warning"
    else:
        status = "Healthy"

    return {
        "forest_coverage_pct":      forest_pct,
        "deforested_pct":           deforested_pct,
        "deforestation_risk_score": risk_score,
        "health_status":            status,
    }


def estimate_carbon(forest_area_pct: float, image_width: int, image_height: int,
                    pixel_resolution_m: float = 10.0) -> dict:
    """
    Convert forest canopy pixel area to carbon credit estimate.
    pixel_resolution_m: metres per pixel (Sentinel-2 = 10m, Google Maps zoom-15 ≈ 4m)
    CARBON_TONNES_PER_HA: average tropical forest = ~150 tCO2/ha
    CREDIT_PRICE_USD:     market average ~$15 per tonne
    """
    CARBON_TONNES_PER_HA = 150.0
    CREDIT_PRICE_USD     = 15.0

    total_pixels  = image_width * image_height
    forest_pixels = total_pixels * (forest_area_pct / 100.0)
    area_m2       = forest_pixels * (pixel_resolution_m ** 2)
    area_ha       = area_m2 / 10_000

    carbon_tonnes  = round(area_ha * CARBON_TONNES_PER_HA, 2)
    carbon_credits = carbon_tonnes  # 1 Carbon Credit = 1 Tonne of CO2 sequestered
    credit_value   = round(carbon_credits * CREDIT_PRICE_USD, 2)

    return {
        "canopy_area_hectares":       round(area_ha, 4),
        "estimated_carbon_tonnes":    carbon_tonnes,
        "estimated_carbon_credits":   carbon_credits,
        "credit_value_usd":           credit_value,
        "pixel_resolution_m":         pixel_resolution_m,
    }


def analyze_planting_suitability(
    class_counts: dict,
    deforested_area_pct: float,
    forest_area_pct: float,
    sand_area_pct: float = 0.0,
    clay_area_pct: float = 0.0,
    stone_area_pct: float = 0.0,
    location_name: str = ""
) -> dict:
    """
    Determine suitability for tree planting based on detailed soil and land composition.
    """
    buildings = class_counts.get("building", 0)
    farmlands = class_counts.get("farmland", 0)

    loc_lower = location_name.lower()
    is_desert_keyword = "sahara" in loc_lower or "desert" in loc_lower or "arid" in loc_lower or "dune" in loc_lower or "sand" in loc_lower
    is_clay_keyword = "clay" in loc_lower or "cotton soil" in loc_lower or "black cotton" in loc_lower
    is_stony_keyword = "stone" in loc_lower or "rock" in loc_lower or "quarry" in loc_lower or "gravel" in loc_lower or "stony" in loc_lower

    # 1. Desert / Sand
    if sand_area_pct > 30 or (is_desert_keyword and (sand_area_pct > 10 or deforested_area_pct > 50)):
        suitability = "Not Suitable"
        reason = "Arid desert terrain detected. Sandy soil lacks the moisture, organic nutrients, and water retention required to support tree growth."
        soil_type = "Arid Desert Sand"

    # 2. Stony / Rocky outcrop
    elif stone_area_pct > 40 or (is_stony_keyword and stone_area_pct > 25):
        suitability = "Not Suitable"
        reason = "Stony/rocky terrain detected with high rock density. Shallow soil depth prevents root penetration and cannot support stable tree plantations."
        soil_type = "Stony / Rocky Outcrop"

    # 3. Urban / Developed Area
    elif buildings >= 3 or (buildings > 0 and deforested_area_pct < 15 and forest_area_pct < 15):
        suitability = "Not Suitable"
        reason = "Urban area detected with active infrastructure. No available space for tree plantations."
        soil_type = "Concrete / Urban Soil"

    # 4. Dense Forest already
    elif forest_area_pct > 80:
        suitability = "Fully Forested"
        reason = "Area is already dense forest. Additional planting space is not needed."
        soil_type = "Rich Forest Humus"

    # 5. Clay Soil
    elif clay_area_pct > 25 or is_clay_keyword:
        suitability = "Moderately Suitable"
        reason = "Heavy clay soil detected. Excellent water retention but prone to waterlogging and compaction. Requires deep tillage and water-tolerant species (e.g. bamboo, eucalyptus, willow)."
        soil_type = "Heavy Clay Soil (Black Cotton)"

    # 6. Stony / Gravelly Soil (moderate)
    elif stone_area_pct > 15:
        suitability = "Moderately Suitable"
        reason = "Stony/gravelly soil detected. Planting is possible but requires manual stone clearing and selective species (e.g., Acacia, pine) that thrive in rocky, well-draining soils."
        soil_type = "Stony / Gravelly Soil"

    # 7. Deforested Arable land
    elif deforested_area_pct > 20 or farmlands > 0:
        suitability = "Highly Suitable"
        reason = "Open land or deforested patches detected. Optimal conditions for new tree planting."
        soil_type = "Arable Loamy Soil" if farmlands > 0 else "Degraded Clay-Loam"

    else:
        suitability = "Moderately Suitable"
        reason = "Mixed land cover detected. Suitable for agroforestry and selective canopy expansion."
        soil_type = "Sandy Clay Soil"

    return {
        "suitability": suitability,
        "reason": reason,
        "soil_type": soil_type,
    }


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/", summary="Health check")
def health():
    return {
        "status": "MitiTrack Forest AI API is running",
        "model_classes": model.names,
    }


@app.get("/analyze", summary="Analyze a named area using current satellite imagery")
async def analyze_area(
    location: str = Query(..., description="Place name, e.g. 'Mau Forest, Kenya'"),
    zoom:     int = Query(15,  description="Tile zoom level (10–18)"),
    google_api_key: str = Query(None, description="Google Maps API key (optional, for higher resolution)"),
):
    """
    Geocodes the location, fetches a satellite tile, runs YOLOv8, and returns
    detection counts + deforestation risk score.
    """
    lat, lon, resolved_address = geocode(location)

    # Use key from request → fallback to .env → fallback to free Esri tiles
    active_key = google_api_key or GOOGLE_API_KEY
    if active_key:
        try:
            image = fetch_google_tile(lat, lon, zoom, active_key)
        except Exception as e:
            print(f"[MitiTrack] Google Static Maps API failed ({e}), falling back to Esri World Imagery.")
            image = fetch_esri_tile(lat, lon, zoom)
    else:
        image = fetch_esri_tile(lat, lon, zoom)

    detections, class_counts, def_area_pct, forest_area_pct, sand_area_pct, clay_area_pct, stone_area_pct = run_inference(image)
    annotated_img = annotate(image.copy(), detections)
    metrics = forest_metrics(class_counts, len(detections), forest_area_pct, def_area_pct)
    carbon  = estimate_carbon(forest_area_pct, *image.size)
    suitability = analyze_planting_suitability(class_counts, def_area_pct, forest_area_pct, sand_area_pct, clay_area_pct, stone_area_pct, resolved_address)

    return {
        "location":             resolved_address,
        "coordinates":          {"lat": lat, "lon": lon},
        "zoom":                 zoom,
        "total_detections":     len(detections),
        "class_counts":         class_counts,
        "detections":           detections,
        "deforested_area_pct":  def_area_pct,
        "forest_area_pct":      forest_area_pct,
        **metrics,
        "carbon":               carbon,
        "suitability":          suitability,
        "annotated_image":      to_b64(annotated_img),
    }


@app.get("/compare", summary="Compare deforestation between two years for an area")
async def compare_periods(
    location: str = Query(..., description="Place name"),
    year1:    int = Query(..., description="Earlier year, e.g. 2019"),
    year2:    int = Query(..., description="Later year, e.g. 2024"),
    zoom:     int = Query(12,  description="Zoom level (lower = wider area, ~10-13 works best)"),
    google_api_key: str = Query(None, description="Google Maps API key (optional)"),
):
    """
    Fetches NASA Landsat imagery for two different years, runs inference on both,
    then computes the change in forest coverage — positive = reforestation,
    negative = deforestation.
    """
    lat, lon, resolved_address = geocode(location)

    # For current-year comparisons, Google tile may be higher quality
    if google_api_key and year2 >= 2024:
        img1 = fetch_nasa_landsat_tile(lat, lon, year1, zoom)
        try:
            img2 = fetch_google_tile(lat, lon, zoom, google_api_key)
        except Exception as e:
            print(f"[MitiTrack] Google Static Maps API failed in compare ({e}), falling back to Esri World Imagery.")
            img2 = fetch_esri_tile(lat, lon, zoom)
    else:
        img1 = fetch_nasa_landsat_tile(lat, lon, year1, zoom)
        img2 = fetch_nasa_landsat_tile(lat, lon, year2, zoom)

    det1, counts1, def_pct1, forest_pct1, sand_pct1, clay_pct1, stone_pct1 = run_inference(img1)
    det2, counts2, def_pct2, forest_pct2, sand_pct2, clay_pct2, stone_pct2 = run_inference(img2)

    m1 = forest_metrics(counts1, len(det1), forest_pct1, def_pct1)
    m2 = forest_metrics(counts2, len(det2), forest_pct2, def_pct2)

    forest_change = round(m2["forest_coverage_pct"] - m1["forest_coverage_pct"], 1)
    risk_change   = round(m2["deforestation_risk_score"] - m1["deforestation_risk_score"], 1)

    if forest_change > 5:
        trend   = "Reforestation"
        verdict = f"Forest grew by {abs(forest_change)}% between {year1} and {year2}."
    elif forest_change < -5:
        trend   = "Deforestation"
        verdict = f"Forest shrank by {abs(forest_change)}% between {year1} and {year2}."
    else:
        trend   = "Stable"
        verdict = f"No significant change between {year1} and {year2}."

    return {
        "location":    resolved_address,
        "coordinates": {"lat": lat, "lon": lon},
        f"year_{year1}": {
            **m1,
            "class_counts":        counts1,
            "total_detections":    len(det1),
            "deforested_area_pct": def_pct1,
            "forest_area_pct":     forest_pct1,
            "carbon":              estimate_carbon(forest_pct1, *img1.size),
            "annotated_image":     to_b64(annotate(img1.copy(), det1)),
        },
        f"year_{year2}": {
            **m2,
            "class_counts":        counts2,
            "total_detections":    len(det2),
            "deforested_area_pct": def_pct2,
            "forest_area_pct":     forest_pct2,
            "carbon":              estimate_carbon(forest_pct2, *img2.size),
            "annotated_image":     to_b64(annotate(img2.copy(), det2)),
        },
        "change": {
            "forest_coverage_change_pct":      forest_change,
            "deforestation_risk_change_score": risk_change,
            "carbon_credit_change":            round(
                estimate_carbon(forest_pct2, *img2.size)["estimated_carbon_credits"] -
                estimate_carbon(forest_pct1, *img1.size)["estimated_carbon_credits"], 2
            ),
            "trend":   trend,
            "verdict": verdict,
            "alert":   forest_change < -10,
        },
    }


@app.post("/upload-analyze", summary="Analyze an uploaded satellite image")
async def upload_analyze(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    detections, class_counts, def_area_pct, forest_area_pct, sand_area_pct, clay_area_pct, stone_area_pct = run_inference(image)
    annotated_img = annotate(image.copy(), detections)
    metrics = forest_metrics(class_counts, len(detections), forest_area_pct, def_area_pct)
    carbon  = estimate_carbon(forest_area_pct, *image.size)
    suitability = analyze_planting_suitability(class_counts, def_area_pct, forest_area_pct, sand_area_pct, clay_area_pct, stone_area_pct)

    return {
        "total_detections":    len(detections),
        "class_counts":        class_counts,
        "detections":          detections,
        "deforested_area_pct": def_area_pct,
        "forest_area_pct":     forest_area_pct,
        **metrics,
        "carbon":              carbon,
        "suitability":          suitability,
        "annotated_image":     to_b64(annotated_img),
    }


@app.post("/upload-compare", summary="Compare two uploaded satellite images (before / after)")
async def upload_compare(
    before:       UploadFile = File(...),
    after:        UploadFile = File(...),
    label_before: str = Query("Before", description="Label for the first image"),
    label_after:  str = Query("After",  description="Label for the second image"),
):
    img_b = Image.open(io.BytesIO(await before.read())).convert("RGB")
    img_a = Image.open(io.BytesIO(await after.read())).convert("RGB")

    det_b, cnt_b, def_b, for_b, sand_b, clay_b, stone_b = run_inference(img_b)
    det_a, cnt_a, def_a, for_a, sand_a, clay_a, stone_a = run_inference(img_a)

    m_b = forest_metrics(cnt_b, len(det_b), for_b, def_b)
    m_a = forest_metrics(cnt_a, len(det_a), for_a, def_a)
    forest_change = round(m_a["forest_coverage_pct"] - m_b["forest_coverage_pct"], 1)

    carbon_b = estimate_carbon(for_b, *img_b.size)
    carbon_a = estimate_carbon(for_a, *img_a.size)

    return {
        label_before: {**m_b, "class_counts": cnt_b, "total_detections": len(det_b),
                       "deforested_area_pct": def_b, "forest_area_pct": for_b,
                       "carbon": carbon_b,
                       "annotated_image": to_b64(annotate(img_b.copy(), det_b))},
        label_after:  {**m_a, "class_counts": cnt_a, "total_detections": len(det_a),
                       "deforested_area_pct": def_a, "forest_area_pct": for_a,
                       "carbon": carbon_a,
                       "annotated_image": to_b64(annotate(img_a.copy(), det_a))},
        "change": {
            "forest_coverage_change_pct":  forest_change,
            "carbon_credit_change":        round(carbon_a["estimated_carbon_credits"] - carbon_b["estimated_carbon_credits"], 2),
            "trend":   "Reforestation" if forest_change > 5 else "Deforestation" if forest_change < -5 else "Stable",
            "alert":   forest_change < -10,
            "verdict": (
                f"Forest coverage {'grew' if forest_change > 0 else 'shrank'} "
                f"by {abs(forest_change)}% from {label_before} to {label_after}."
            ),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)