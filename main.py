"""
LEMI AI – FastAPI Backend (RETRAINED MODEL VERSION)
=========================
Offline Edge-AI Plant Disease Detection API

🟢 CRITICAL: This version uses the class order from the RETRAINING SCRIPT
   Class Order: [Common_Rust, Gray_Leaf_Spot, Blight, Healthy]
   (NOT alphabetical)

If you used the retrained model with train_lemi_with_explicit_classes.py,
use THIS backend file.

Endpoints
---------
GET  /          → API info
GET  /health    → Backend liveness check
POST /predict   → Classify a leaf image
GET  /history   → Stub for future server-side scan history

Run
---
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Detection Modes
---------------
  1. REAL MODEL  – Keras .h5 model loaded from backend/model/
  2. DEMO MODE   – Color-analysis fallback when model file is absent.
"""

from __future__ import annotations
import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import io
import logging

import time
import uuid
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
import tensorflow_hub as hub

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
log = logging.getLogger("lemi_ai")

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "lemi_lite0_web_model.h5")

# ─── Model config ─────────────────────────────────────────────────────────────
IMG_SIZE     = (224, 224)
IMG_CHANNELS = 3
NUM_CLASSES  = 4

# ─── Preprocessing mode ───────────────────────────────────────────────────────
NORMALIZE_0_1: bool = False   # EfficientNetLite0 (TF Hub) expects [0, 255]

# ─── Class index → name mapping ───────────────────────────────────────────────
# 🟢 CLASS ORDER FROM RETRAINING SCRIPT (matches dataset description)
# This is the order used when you trained with train_lemi_with_explicit_classes.py
#
# DO NOT CHANGE THIS ORDER unless you retrain with a different order!
CLASS_NAMES: list[str] = [
    "Common_Rust",      # index 0 - 1306 images
    "Gray_Leaf_Spot",   # index 1 - 574 images
    "Blight",           # index 2 - 1146 images
    "Healthy",          # index 3 - 1162 images
]

# ─── Label map (keyed by retraining class index) ──────────────────────────────
# MUST stay in sync with CLASS_NAMES above
CLASS_LABELS: dict[int, dict] = {
    # 0 → Common Rust
    0: {
        "name_am":      "የቅጠል ዝገት",
        "name_en":      "Common Rust",
        "status":       "ታሟል",
        "treatment_am": (
            "በሽታውን የሚቋቋሙ የበቆሎ ዝርያዎችን ይዝሩ። "
            "ምልክቱ እንደታየ የፈንገስ ማጥፊያ ኬሚካል በቶሎ ይረጩ።"
        ),
    },
    # 1 → Gray Leaf Spot
    1: {
        "name_am":      "ግራጫ የቅጠል ነጠብጣብ",
        "name_en":      "Gray Leaf Spot",
        "status":       "ታሟል",
        "treatment_am": (
            "በማሳው ውስጥ በቂ አየር እንዲዘዋወር ተክሎችን ያራርቁ። "
            "ከማሳው ላይ አረም በደንብ ያስወግዱ።"
        ),
    },
    # 2 → Blight
    2: {
        "name_am":      "የቅጠል መድረቅ",
        "name_en":      "Blight Disease",
        "status":       "ታሟል",
        "treatment_am": (
            "ተገቢውን የፈንገስ ማጥፊያ (Fungicide) ኬሚካል ይጠቀሙ። "
            "በሽታው እንዳይዛመት የታመሙትን ተክሎች ነቅለው ያቃጥሉ። "
            "በሚቀጥለው አመት የሰብል ማፈራረቅ ዘዴን ይጠቀሙ።"
        ),
    },
    # 3 → Healthy
    3: {
        "name_am":      "ጤናማ",
        "name_en":      "Healthy Corn Leaf",
        "status":       "ጤናማ",
        "treatment_am": (
            "በቆሎዎ ጤናማ ነው። ወቅታዊ እንክብካቤውን እና ማዳበሪያውን "
            "መስጠት ይቀጥሉ። ምርትዎ የተባረከ ይሁን!"
        ),
    },
}

# ─── Global model holder ──────────────────────────────────────────────────────
class ModelState:
    model:     Optional[object] = None
    loaded:    bool = False
    demo_mode: bool = False

model_state = ModelState()

# ─── Pydantic schemas ─────────────────────────────────────────────────────────
class PredictResponse(BaseModel):
    prediction_id: str
    name_am:       str
    name_en:       str
    status:        str
    treatment_am:  str
    confidence:    float
    inference_ms:  float
    demo_mode:     bool = False

class HealthResponse(BaseModel):
    status:       str
    model_loaded: bool
    demo_mode:    bool
    version:      str

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "LEMI AI – Plant Disease Detection API",
    description = "Offline Edge-AI backend for the LEMI AI web application.",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ══════════════════════════════════════════════════════════════════════════════
#  DEMO MODE — Color-analysis engine
# ══════════════════════════════════════════════════════════════════════════════
def _demo_predict(image: Image.Image) -> tuple[int, float]:
    """
    Predict disease class using PIL color-channel statistics.
    
    Score array is built in CLASS_NAMES order (RETRAINING ORDER):
    CLASS_NAMES = ['Common_Rust'(0), 'Gray_Leaf_Spot'(1), 'Blight'(2), 'Healthy'(3)]
    """
    img = image.resize(IMG_SIZE, _RESAMPLE).convert("RGB")
    arr = np.array(img, dtype=np.float32) / 255.0

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    # ── Feature scores ────────────────────────────────────────────────────────
    green_dominant = (g > r) & (g > b) & (g > 0.25)
    healthy_score  = float(np.mean(green_dominant))

    rust_mask  = (r > 0.45) & (g > 0.20) & (g < 0.55) & (b < 0.30) & (r > g * 1.15)
    rust_score = float(np.mean(rust_mask)) * 3.5

    blight_mask  = (r > 0.35) & (r > b * 1.2) & (r > g * 1.1) & (g < 0.65)
    blight_score = float(np.mean(blight_mask)) * 2.8

    grey_mask = (
        (np.abs(r - g) < 0.12) &
        (np.abs(g - b) < 0.12) &
        (np.abs(r - b) < 0.12) &
        (r > 0.25) & (r < 0.78) &
        ~green_dominant
    )
    gls_score = float(np.mean(grey_mask)) * 2.2

    # ── Build raw score array in CLASS_NAMES order ─────────────────────────────
    # CLASS_NAMES = ['Common_Rust'(0), 'Gray_Leaf_Spot'(1), 'Blight'(2), 'Healthy'(3)]
    raw = np.array(
        [rust_score, gls_score, blight_score, healthy_score],
        dtype=np.float64,
    )

    if healthy_score > 0.45:
        raw[3] += healthy_score * 1.8

    total = raw.sum()
    if total < 1e-6:
        return 3, 65.0

    probs      = raw / total
    class_idx  = int(np.argmax(probs))
    confidence = float(probs[class_idx]) * 100.0
    confidence = round(max(52.0, min(94.0, confidence)), 2)

    log.info(
        "[DEMO] scores Common_Rust=%.3f Gray_Leaf_Spot=%.3f Blight=%.3f Healthy=%.3f "
        "→ class=%d (%s) conf=%.1f%%",
        raw[0], raw[1], raw[2], raw[3],
        class_idx, CLASS_NAMES[class_idx], confidence,
    )
    return class_idx, confidence


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def load_model() -> None:
    """Try to load the real Keras model; fall back to DEMO MODE if absent."""

    print()
    print("=" * 60)
    print("  LEMI AI  –  Backend Startup (Retrained Model Version)")
    print("=" * 60)
    print(f"  BASE_DIR   : {BASE_DIR}")
    print(f"  MODEL_PATH : {MODEL_PATH}")
    print(f"  File exists: {os.path.isfile(MODEL_PATH)}")
    print(f"  CLASS_NAMES: {CLASS_NAMES}")
    print("=" * 60)

    if os.path.isfile(MODEL_PATH):
        print("⏳  Real model found — loading with TensorFlow …")
        log.info("Attempting to load model from: %s", MODEL_PATH)
        t0 = time.perf_counter()
        try:
            import tensorflow as tf
            model_state.model  = tf.keras.models.load_model(
                MODEL_PATH,
                custom_objects={'KerasLayer': hub.KerasLayer}
            )
            model_state.loaded = True
            model_state.demo_mode = False
            elapsed = (time.perf_counter() - t0) * 1000
            print(f"✅  Real model loaded in {elapsed:.1f} ms")
            print(f"    Input  : {model_state.model.input_shape}")
            print(f"    Output : {model_state.model.output_shape}")
            log.info("✅  Model loaded in %.1f ms", elapsed)

            print("⏳  Running warm-up inference …")
            _dummy_val = 0.0 if NORMALIZE_0_1 else 128.0
            dummy = np.full((1, *IMG_SIZE, IMG_CHANNELS), _dummy_val, dtype=np.float32)
            warmup_preds = model_state.model.predict(dummy, verbose=0)
            print(f"✅  Warm-up complete. Warmup probs: {warmup_preds[0].tolist()}")
            print(f"    NORMALIZE_0_1 = {NORMALIZE_0_1}  (pixel range: {'[0,1]' if NORMALIZE_0_1 else '[0,255]'})")
            print(f"    Real AI model is active.\n")
            log.info("✅  Warm-up complete. warmup_probs=%s", warmup_preds[0].tolist())
            return

        except Exception as exc:
            import traceback
            print(f"\n❌  Model load FAILED: {type(exc).__name__}: {exc}")
            traceback.print_exc()
            log.error("❌  Failed to load real model: %s", exc, exc_info=True)
            print("⚠️   Falling back to DEMO MODE …\n")

    model_state.loaded    = True
    model_state.demo_mode = True
    model_state.model     = None

    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║  ⚡ DEMO MODE ACTIVE                                     ║")
    print("║                                                          ║")
    print("║  No lemi_lite0_web_model.h5 found.                       ║")
    print("║  Using color-analysis engine for disease detection.      ║")
    print("║                                                          ║")
    print("║  To use the real model:                                  ║")
    print(f"║    Place .h5 file in:                                    ║")
    print(f"║    {os.path.join(BASE_DIR, 'model', ''):<52} ║")
    print("║    Then restart uvicorn.                                 ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()
    log.info("⚡ DEMO MODE active — color-analysis engine will be used.")


# ─── Pillow resampling compat ─────────────────────────────────────────────────
try:
    _RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:
    _RESAMPLE = Image.LANCZOS


# ─── Image preprocessing ──────────────────────────────────────────────────────
def preprocess_image(raw_bytes: bytes) -> tuple[np.ndarray, Image.Image]:
    """Decode raw bytes → PIL Image + numpy array ready for the model."""
    try:
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {exc}",
        )

    resized = pil_img.resize(IMG_SIZE, _RESAMPLE)
    arr = np.array(resized, dtype=np.float32)

    if NORMALIZE_0_1:
        arr = arr / 255.0

    assert arr.ndim == 3 and arr.shape == (IMG_SIZE[1], IMG_SIZE[0], IMG_CHANNELS), (
        f"Unexpected array shape after resize: {arr.shape}. "
        f"Expected ({IMG_SIZE[1]}, {IMG_SIZE[0]}, {IMG_CHANNELS})."
    )
    expected_max = 1.0 if NORMALIZE_0_1 else 255.0
    assert arr.max() <= expected_max and arr.min() >= 0.0, (
        f"Pixel values out of expected range [0, {expected_max:.0f}]: "
        f"min={arr.min():.4f} max={arr.max():.4f}"
    )

    arr = np.expand_dims(arr, axis=0)
    return arr, pil_img


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Info"])
async def root():
    return {
        "name":        "LEMI AI Plant Disease Detection API",
        "version":     "1.0.0",
        "model_ready": model_state.loaded,
        "demo_mode":   model_state.demo_mode,
        "docs":        "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status       = "ok",
        model_loaded = model_state.loaded,
        demo_mode    = model_state.demo_mode,
        version      = "1.0.0",
    )


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict(file: UploadFile = File(..., description="Leaf image (JPEG / PNG / WebP)")):
    """Classify a leaf image and return the disease diagnosis."""
    if not model_state.loaded:
        raise HTTPException(
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE,
            detail      = "Backend is still initialising. Please wait a moment.",
        )

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail      = f"Unsupported file type '{file.content_type}'. Use JPEG, PNG or WebP.",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) == 0:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Uploaded file is empty.",
        )

    log.info(
        "Received image: name='%s' size=%d bytes type='%s' demo=%s",
        file.filename, len(raw_bytes), file.content_type, model_state.demo_mode,
    )

    img_array, pil_img = preprocess_image(raw_bytes)

    t0 = time.perf_counter()

    if model_state.demo_mode:
        class_index, confidence = _demo_predict(pil_img)
    else:
        np.set_printoptions(suppress=True, precision=4)
        print(f"\n{'='*50}")
        print(f"  NEW PREDICTION REQUEST")
        print(f"{'='*50}")
        print(f"  Original size   : {pil_img.size}  mode={pil_img.mode}")
        print(f"  NORMALIZE_0_1   : {NORMALIZE_0_1}  "
              f"(pixel range: {'[0.0, 1.0]' if NORMALIZE_0_1 else '[0.0, 255.0]'})")

        _s = img_array[0]
        print(f"  Model input     : shape={_s.shape}  "
              f"dtype={_s.dtype}  "
              f"min={np.min(_s):.4f}  max={np.max(_s):.4f}")

        if not NORMALIZE_0_1 and np.max(_s) < 2.0:
            print("  ⚠  WARNING: max pixel value is near 0–1 but NORMALIZE_0_1=False.")
            print("     The model may have been trained with rescale=1/255.")
            print("     Consider setting NORMALIZE_0_1 = True in main.py.")
        elif NORMALIZE_0_1 and np.max(_s) > 2.0:
            print("  ⚠  WARNING: max pixel value > 2.0 but NORMALIZE_0_1=True.")
            print("     Image was not normalised! This should not happen.")

        predictions = model_state.model.predict(img_array, verbose=0)
        probs       = predictions[0]
        class_index = int(np.argmax(probs))
        confidence  = round(float(probs[class_index]) * 100, 1)

        print(f"  Raw probabilities (sum={probs.sum():.4f}):")
        for i, (name, p) in enumerate(zip(CLASS_NAMES, probs)):
            marker = " ◄ WINNER" if i == class_index else ""
            print(f"    [{i}] {name:<20} {p:.4f}  ({p*100:.1f}%){marker}")
        print(f"{'='*50}\n")

    inference_ms = round((time.perf_counter() - t0) * 1000, 2)

    label = CLASS_LABELS.get(class_index, CLASS_LABELS[3])

    log.info(
        "Prediction: class=%d (%s) confidence=%.1f%% inference=%.1f ms demo=%s",
        class_index, label["name_en"], confidence, inference_ms, model_state.demo_mode,
    )

    return PredictResponse(
        prediction_id = str(uuid.uuid4()),
        name_am       = label["name_am"],
        name_en       = label["name_en"],
        status        = label["status"],
        treatment_am  = label["treatment_am"],
        confidence    = confidence,
        inference_ms  = inference_ms,
        demo_mode     = model_state.demo_mode,
    )


@app.get("/history", tags=["History"])
async def get_history():
    """Stub — history is managed client-side in localStorage."""
    return {
        "message": "Server-side history not yet implemented. History is stored in localStorage.",
        "scans":   [],
    }


# ══════════════════════════════════════════════════════════════════════════════
#  DEBUG endpoints
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/debug/classes", tags=["Debug"])
async def debug_classes():
    """Returns the class-index mapping used by this server."""
    return {
        "class_names": CLASS_NAMES,
        "label_map":   {
            str(idx): {
                "class_name": CLASS_NAMES[idx],
                "name_en":    CLASS_LABELS[idx]["name_en"],
                "name_am":    CLASS_LABELS[idx]["name_am"],
            }
            for idx in range(NUM_CLASSES)
        },
        "preprocessing": {
            "NORMALIZE_0_1": NORMALIZE_0_1,
            "pixel_range":   "[0.0, 1.0]" if NORMALIZE_0_1 else "[0.0, 255.0]",
        },
        "class_index_note": (
            "Using EXPLICIT class order from retraining script. "
            "Order: Common_Rust=0, Gray_Leaf_Spot=1, Blight=2, Healthy=3"
        ),
    }


@app.post("/debug/predict", tags=["Debug"])
async def debug_predict(
    file: UploadFile = File(..., description="Leaf image for raw-probability inspection"),
):
    """Like /predict but returns the FULL raw probability vector for every class."""
    if not model_state.loaded:
        raise HTTPException(status_code=503, detail="Backend still initialising.")
    if model_state.demo_mode:
        raise HTTPException(
            status_code=400,
            detail="/debug/predict requires the real model. Currently in DEMO MODE.",
        )

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported type: {file.content_type}")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    img_array, pil_img = preprocess_image(raw_bytes)

    t0          = time.perf_counter()
    predictions = model_state.model.predict(img_array, verbose=0)
    elapsed_ms  = round((time.perf_counter() - t0) * 1000, 2)

    probs       = predictions[0].tolist()
    class_index = int(np.argmax(probs))

    return {
        "predicted_index":      class_index,
        "predicted_class_name": CLASS_NAMES[class_index],
        "predicted_label_en":   CLASS_LABELS[class_index]["name_en"],
        "confidence_pct":       round(probs[class_index] * 100, 2),
        "inference_ms":         elapsed_ms,
        "all_probabilities": [
            {
                "index":      i,
                "class_name": CLASS_NAMES[i],
                "label_en":   CLASS_LABELS[i]["name_en"],
                "probability": round(probs[i], 6),
                "pct":         round(probs[i] * 100, 2),
            }
            for i in range(NUM_CLASSES)
        ],
        "input_shape": list(img_array.shape),
        "input_dtype": str(img_array.dtype),
        "input_range": {
            "min": round(float(img_array.min()), 4),
            "max": round(float(img_array.max()), 4),
        },
    }