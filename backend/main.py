# -*- coding: utf-8 -*-
"""
FinanceAI Backend - FastAPI + MongoDB
"""

import os
import json
import re
from datetime import datetime
from typing import Optional, List
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

app = FastAPI(title="FinanceAI Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "expense_model.pkl")

MONGO_URI = os.getenv(
    "MONGO_URI",
    "MONGO_URI",
)

# ── MongoDB setup ──────────────────────────────────────────────────────────

mongo_client: Optional[AsyncIOMotorClient] = None
db = None


@app.on_event("startup")
async def startup_db():
    global mongo_client, db
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URI)
        db = mongo_client.get_default_database()  # uses "alerthub" from URI
        # Quick connection test
        await mongo_client.admin.command("ping")
        print("✅ Connected to MongoDB Atlas")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {e}")
        db = None


@app.on_event("shutdown")
async def shutdown_db():
    global mongo_client
    if mongo_client:
        mongo_client.close()


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return {}
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Request models ─────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    date: str
    description: str = ""

class IncomeUpsert(BaseModel):
    monthly_income: float
    month: int
    year: int

class CategorizeRequest(BaseModel):
    description: str

class AnomalyRequest(BaseModel):
    past_amounts: List[float]
    new_amount: float

class PredictionRequest(BaseModel):
    monthly_totals: List[float]

class GeminiCategorizeRequest(BaseModel):
    description: str

class GeminiBillRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


# ── Helpers ────────────────────────────────────────────────────────────────

def model_available() -> bool:
    return os.path.exists(MODEL_PATH)


async def call_gemini(prompt: str, image_data: Optional[dict] = None) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in environment")

    parts = [{"text": prompt}]
    if image_data:
        parts.append({"inline_data": image_data})

    payload = {"contents": [{"parts": parts}]}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


# ── MongoDB CRUD Routes ───────────────────────────────────────────────────

@app.get("/api/expenses")
async def get_expenses():
    """Get all expenses, ordered by date ascending."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    cursor = db.expenses.find().sort("date", 1)
    expenses = []
    async for doc in cursor:
        expenses.append(serialize_doc(doc))
    return expenses


@app.post("/api/expenses")
async def create_expense(req: ExpenseCreate):
    """Insert a new expense document."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    doc = {
        "amount": req.amount,
        "category": req.category,
        "date": req.date,
        "description": req.description,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.expenses.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    """Delete an expense by ID."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"deleted": True}


@app.get("/api/income")
async def get_income(month: int, year: int):
    """Get income for a specific month/year."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    doc = await db.user_income.find_one({"month": month, "year": year})
    if doc:
        return serialize_doc(doc)
    return None


@app.post("/api/income")
async def upsert_income(req: IncomeUpsert):
    """Upsert monthly income."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    await db.user_income.update_one(
        {"month": req.month, "year": req.year},
        {
            "$set": {
                "monthly_income": req.monthly_income,
                "month": req.month,
                "year": req.year,
                "updated_at": datetime.utcnow().isoformat(),
            }
        },
        upsert=True,
    )
    return {"success": True}


@app.get("/api/db-status")
async def db_status():
    """Check database connection status."""
    return {"connected": db is not None}


# ── Original AI/ML Routes ─────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "FinanceAI backend running", "model_ready": model_available(), "db_connected": db is not None}


@app.get("/metrics")
def get_metrics():
    if not os.path.exists(METRICS_PATH):
        return {"error": "Model not trained yet. Run: python train.py"}
    with open(METRICS_PATH) as f:
        return json.load(f)


@app.post("/categorize")
def categorize(req: CategorizeRequest):
    if not model_available():
        raise HTTPException(status_code=503, detail="Model not trained. Run: python train.py")
    from model import predict
    return predict(req.description)


@app.post("/anomaly")
def anomaly_detection(req: AnomalyRequest):
    from model import predict_anomaly
    return predict_anomaly(req.past_amounts, req.new_amount)


@app.post("/predict")
def predict_spending(req: PredictionRequest):
    from model import predict_next_month
    return predict_next_month(req.monthly_totals)


@app.post("/gemini/categorize")
async def gemini_categorize(req: GeminiCategorizeRequest):
    prompt = f"""Categorize this expense into exactly one of:
Food, Travel, Shopping, Bills, Health, Entertainment, Education, Other

Description: "{req.description}"

Return ONLY JSON: {{"category": "<category>", "confidence": <0.0-1.0>, "reason": "<brief reason>"}}"""

    text = await call_gemini(prompt)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Could not parse Gemini response")
    return json.loads(match.group())


@app.post("/gemini/scan")
async def gemini_scan_bill(req: GeminiBillRequest):
    prompt = """Analyze this bill/receipt image and extract:
Return ONLY valid JSON:
{
  "amount": <total as number>,
  "description": "<brief description max 60 chars>",
  "category": "<Food|Travel|Shopping|Bills|Health|Entertainment|Education|Other>",
  "merchant": "<merchant name or empty string>",
  "confidence": <0.0-1.0>
}
Return only JSON, no extra text."""

    image_data = {"mime_type": req.mime_type, "data": req.image_base64}
    text = await call_gemini(prompt, image_data)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Could not parse Gemini response")
    return json.loads(match.group())


@app.post("/hybrid/categorize")
async def hybrid_categorize(req: CategorizeRequest):
    """ML first → Gemini fallback if confidence < 45%"""
    if not model_available():
        return await gemini_categorize(GeminiCategorizeRequest(description=req.description))

    from model import predict
    ml_result = predict(req.description)

    if ml_result["use_gemini_fallback"] and GEMINI_API_KEY:
        try:
            gemini_result = await gemini_categorize(GeminiCategorizeRequest(description=req.description))
            return {
                **gemini_result,
                "source": "gemini_fallback",
                "ml_prediction": ml_result["category"],
                "ml_confidence": ml_result["confidence_pct"],
                "confidence_pct": gemini_result.get("confidence", 0) * 100,
                "top_keywords": ml_result["top_keywords"],
                "explanation": f"ML confidence was low ({ml_result['confidence_pct']}%), used Gemini. {gemini_result.get('reason', '')}",
            }
        except Exception:
            pass

    return {**ml_result, "source": "ml_model"}
