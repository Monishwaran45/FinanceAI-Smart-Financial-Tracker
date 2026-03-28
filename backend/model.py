"""
ML inference — Voting Ensemble with explainability (Python 3.6 compatible)
"""
import pickle
import os
from typing import List
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "expense_model.pkl")


def load_model():
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def predict(description: str) -> dict:
    model = load_model()
    text = description.lower().strip()

    # Get probabilities from voting ensemble
    proba = model.predict_proba([text])[0]
    classes = model.classes_
    predicted_class = str(classes[np.argmax(proba)])
    confidence = float(np.max(proba))

    # Explainability: extract top keywords from word TF-IDF transformer
    try:
        feature_union = model.named_steps["features"]
        word_tfidf = feature_union.transformer_list[0][1]  # "word" transformer
        feature_names = word_tfidf.get_feature_names()
        X_word = word_tfidf.transform([text])
        scores = X_word.toarray()[0]
        top_indices = np.argsort(scores)[::-1][:5]
        top_keywords = [str(feature_names[i]) for i in top_indices if scores[i] > 0]
    except Exception:
        top_keywords = [w for w in text.split() if len(w) > 2][:5]

    category_probs = {str(cls): round(float(p), 4) for cls, p in zip(classes, proba)}

    return {
        "category": predicted_class,
        "confidence": round(confidence, 4),
        "confidence_pct": round(confidence * 100, 1),
        "top_keywords": top_keywords,
        "explanation": "Categorized as {} because keywords matched: {}".format(
            predicted_class, ", ".join(top_keywords) if top_keywords else description
        ),
        "all_probabilities": category_probs,
        "model": "Voting Ensemble (LinearSVC + LR + SGD)",
        "use_gemini_fallback": confidence < 0.40,
    }


def predict_anomaly(amounts: List[float], new_amount: float) -> dict:
    if len(amounts) < 3:
        return {"is_anomaly": False, "reason": "Not enough data"}

    arr = np.array(amounts)
    mean = float(np.mean(arr))
    std = float(np.std(arr))

    if std == 0:
        return {"is_anomaly": False, "z_score": 0.0, "mean": mean, "std": std, "reason": "Normal spending"}

    z_score = abs((new_amount - mean) / std)
    is_anomaly = bool(z_score > 2.0)

    return {
        "is_anomaly": is_anomaly,
        "z_score": round(z_score, 2),
        "mean": round(mean, 2),
        "std": round(std, 2),
        "reason": "Amount Rs.{} is {:.1f} std deviations from your average Rs.{:.0f}".format(
            new_amount, z_score, mean
        ) if is_anomaly else "Normal spending",
    }


def predict_next_month(monthly_totals: List[float]) -> dict:
    if len(monthly_totals) < 2:
        return {"prediction": None, "method": "insufficient data"}

    arr = np.array(monthly_totals)
    n = len(arr)

    x = np.arange(n)
    coeffs = np.polyfit(x, arr, 1)
    lr_pred = float(np.polyval(coeffs, n))

    window = min(3, n)
    ma_pred = float(np.mean(arr[-window:]))

    prediction = round(max(0.0, 0.6 * lr_pred + 0.4 * ma_pred), 2)

    mae = rmse = mape = None
    if n >= 3:
        train = arr[:-1]
        actual = float(arr[-1])
        x_train = np.arange(len(train))
        c = np.polyfit(x_train, train, 1)
        pred_last = float(np.polyval(c, len(train)))
        mae = round(abs(pred_last - actual), 2)
        rmse = round(float(np.sqrt((pred_last - actual) ** 2)), 2)
        mape = round(abs((pred_last - actual) / actual) * 100, 1) if actual != 0 else 0.0

    trend = "increasing" if coeffs[0] > 0 else "decreasing"
    trend_pct = round(abs(float(coeffs[0])) / (float(np.mean(arr)) + 1e-9) * 100, 1)

    return {
        "prediction": prediction,
        "linear_regression": round(lr_pred, 2),
        "moving_average": round(ma_pred, 2),
        "method": "Linear Regression + Moving Average (Hybrid)",
        "trend": trend,
        "trend_pct": trend_pct,
        "mae": mae,
        "rmse": rmse,
        "mape": mape,
        "explanation": "Prediction Rs.{:.0f} based on {} trend ({}%/month). MAE: Rs.{}".format(
            prediction, trend, trend_pct, mae
        ) if mae else "Prediction Rs.{:.0f} based on {} trend.".format(prediction, trend),
    }
