"""
Train expense categorization — Voting Ensemble (Python 3.6 compatible)
Run: python train.py
"""
import pickle
import os
import json
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.ensemble import VotingClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
from sklearn.metrics import classification_report, accuracy_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "dataset.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "expense_model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")


def preprocess(text):
    return str(text).lower().strip()


def build_pipeline():
    word_tfidf = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=25000,
        sublinear_tf=True,
        min_df=1,
        analyzer="word",
        token_pattern=r"\b\w+\b",
    )
    char_tfidf = TfidfVectorizer(
        ngram_range=(3, 5),
        max_features=15000,
        sublinear_tf=True,
        min_df=1,
        analyzer="char_wb",
    )
    features = FeatureUnion([("word", word_tfidf), ("char", char_tfidf)])

    svc = CalibratedClassifierCV(
        LinearSVC(C=10.0, max_iter=5000, class_weight="balanced"), cv=3
    )
    lr = LogisticRegression(
        C=10.0, max_iter=2000, solver="lbfgs", class_weight="balanced"
    )
    sgd = CalibratedClassifierCV(
        SGDClassifier(
            loss="modified_huber", alpha=1e-5, max_iter=2000,
            random_state=42, class_weight="balanced"
        ), cv=3
    )
    ensemble = VotingClassifier(
        estimators=[("svc", svc), ("lr", lr), ("sgd", sgd)],
        voting="soft",
        weights=[2, 2, 1],   # SVC and LR weighted higher
    )
    return Pipeline([("features", features), ("clf", ensemble)])


def train():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    df["description"] = df["description"].apply(preprocess)
    # Remove duplicates
    df = df.drop_duplicates(subset=["description"])
    print("Total samples (deduped): {}".format(len(df)))
    print("Categories:\n{}\n".format(df["category"].value_counts().to_string()))

    X = df["description"]
    y = df["category"]

    pipeline = build_pipeline()

    # CV on full data for honest metric
    print("Running 5-fold stratified CV...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=skf, scoring="accuracy")
    print("CV Accuracy: {:.4f} +/- {:.4f}".format(cv_scores.mean(), cv_scores.std()))
    print("CV Scores: {}\n".format([round(s, 4) for s in cv_scores]))

    # Also do a hold-out test for classification report
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)
    print("Hold-out Test Accuracy: {:.4f} ({:.1f}%)\n".format(test_acc, test_acc * 100))
    print(classification_report(y_test, y_pred))

    # Retrain on ALL data for production model
    print("Retraining on full dataset for production...")
    pipeline.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)
    print("Model saved: {}".format(MODEL_PATH))

    # Report CV accuracy as the official metric (more reliable)
    reported_acc = cv_scores.mean()
    metrics = {
        "accuracy": round(reported_acc, 4),
        "accuracy_pct": round(reported_acc * 100, 1),
        "cv_mean": round(float(cv_scores.mean()), 4),
        "cv_std": round(float(cv_scores.std()), 4),
        "holdout_accuracy_pct": round(test_acc * 100, 1),
        "train_samples": len(X),
        "test_samples": len(X_test),
        "model_type": "Voting Ensemble (LinearSVC + LR + SGD) + Word/Char TF-IDF",
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print("\nFinal Metrics: {}".format(metrics))


if __name__ == "__main__":
    train()
