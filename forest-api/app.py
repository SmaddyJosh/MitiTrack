from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image, ImageDraw
import io, base64, json, requests
from pydantic import BaseModel
from typing import List

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


model = YOLO("best.pt")

@app.get("/")
def health():
    return {"status": "Forest AI API is running"}

class MapFeatures(BaseModel):
    lat: float
    lon: float
    zoom: int
    api_key: str

@app.post("/predict_map")
async def predict_map(payload: MapFeatures):
    """Fetches satellite image from Static Maps API and runs YOLO inference"""
    url = f"https://maps.googleapis.com/maps/api/staticmap?center={payload.lat},{payload.lon}&zoom={payload.zoom}&size=640x640&maptype=satellite&key={payload.api_key}"
    
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "Failed to fetch image from Google Static Maps API."}
        
    image = Image.open(io.BytesIO(response.content)).convert("RGB")
    
    
    results = model.predict(image, conf=0.3, iou=0.5)
    result  = results[0]

    detections = []
    class_counts = {}

    for box in result.boxes:
        label      = result.names[int(box.cls)]
        confidence = round(float(box.conf), 3)
        bbox       = [round(x, 1) for x in box.xyxy[0].tolist()]

        detections.append({"label": label, "confidence": confidence, "bbox": bbox})
        class_counts[label] = class_counts.get(label, 0) + 1

    draw = ImageDraw.Draw(image)
    colors = {"Tree": "green", "Farmland": "yellow", "Building": "red", "Water": "blue", "Tin_Shade": "orange"}

    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        color = colors.get(det["label"], "white")
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        draw.text((x1, y1 - 12), f'{det["label"]} {det["confidence"]}', fill=color)

    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    img_b64 = base64.b64encode(buf.getvalue()).decode()

    total = len(detections)
    trees = class_counts.get("Tree", 0)
    risk_score = round((1 - trees / max(total, 1)) * 100, 1) if total > 0 else 0

    co2_kg_per_year = trees * 22
    carbon_credits = round(co2_kg_per_year / 1000, 2)

    return {
        "detections": detections,
        "class_counts": class_counts,
        "total_detections": total,
        "deforestation_risk_score": risk_score,
        "annotated_image": img_b64,
        "estimated_co2_kg_per_year": co2_kg_per_year,
        "estimated_carbon_credits": carbon_credits
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    
    results = model.predict(image, conf=0.3, iou=0.5)
    result  = results[0]

    
    detections = []
    class_counts = {}

    for box in result.boxes:
        label      = result.names[int(box.cls)]
        confidence = round(float(box.conf), 3)
        bbox       = [round(x, 1) for x in box.xyxy[0].tolist()]  

        detections.append({
            "label":      label,
            "confidence": confidence,
            "bbox":       bbox
        })
        class_counts[label] = class_counts.get(label, 0) + 1

    
    draw = ImageDraw.Draw(image)
    colors = {"Tree": "green", "Farmland": "yellow", 
              "Building": "red", "Water": "blue", "Tin_Shade": "orange"}

    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        color = colors.get(det["label"], "white")
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        draw.text((x1, y1 - 12), f'{det["label"]} {det["confidence"]}', fill=color)

    
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    img_b64 = base64.b64encode(buf.getvalue()).decode()

    
    total = len(detections)
    trees = class_counts.get("Tree", 0)
    risk_score = round((1 - trees / max(total, 1)) * 100, 1) if total > 0 else 0

    
    co2_kg_per_year = trees * 22
    carbon_credits = round(co2_kg_per_year / 1000, 2)

    return {
        "detections":       detections,
        "class_counts":     class_counts,
        "total_detections": total,
        "deforestation_risk_score": risk_score,  
        "annotated_image":  img_b64,             
        "estimated_co2_kg_per_year": co2_kg_per_year,
        "estimated_carbon_credits": carbon_credits
    }


@app.post("/compare")
async def compare_images(
    before: UploadFile = File(...),
    after:  UploadFile = File(...)
):
    """Compare two images to detect deforestation change over time"""
    before_img = Image.open(io.BytesIO(await before.read())).convert("RGB")
    after_img  = Image.open(io.BytesIO(await after.read())).convert("RGB")

    before_res = model.predict(before_img, conf=0.3)[0]
    after_res  = model.predict(after_img,  conf=0.3)[0]

    def count_class(result, label):
        return sum(1 for b in result.boxes if result.names[int(b.cls)] == label)

    before_trees = count_class(before_res, "Tree")
    after_trees  = count_class(after_res,  "Tree")
    loss         = before_trees - after_trees
    loss_pct     = round((loss / max(before_trees, 1)) * 100, 1)

    
    before_credits = round((before_trees * 22) / 1000, 2)
    after_credits  = round((after_trees * 22) / 1000, 2)
    credits_lost   = round(max(0, before_credits - after_credits), 2)

    return {
        "before_tree_count": before_trees,
        "after_tree_count":  after_trees,
        "tree_loss":         loss,
        "tree_loss_percent": loss_pct,
        "alert":             loss_pct > 20,
        "alert_message":     f"⚠️ {loss_pct}% tree loss detected!" if loss_pct > 20 else "✅ No significant change",
        "before_carbon_credits": before_credits,
        "after_carbon_credits": after_credits,
        "carbon_credits_lost": credits_lost
    }
