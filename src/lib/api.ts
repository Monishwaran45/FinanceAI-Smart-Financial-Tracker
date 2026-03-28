const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Categorization (Hybrid ML + Gemini) ───────────────────────────────────

export interface CategorizeResult {
  category: string;
  confidence: number;
  confidence_pct: number;
  top_keywords: string[];
  explanation: string;
  all_probabilities?: Record<string, number>;
  source?: string;
  ml_confidence?: number;
  use_gemini_fallback?: boolean;
}

export function hybridCategorize(description: string): Promise<CategorizeResult> {
  return post('/hybrid/categorize', { description });
}

// ── Bill Scanning (Gemini Vision) ─────────────────────────────────────────

export interface ScanResult {
  amount: number;
  description: string;
  category: string;
  merchant: string;
  confidence: number;
}

export function scanBill(image_base64: string, mime_type: string): Promise<ScanResult> {
  return post('/gemini/scan', { image_base64, mime_type });
}

// ── Anomaly Detection ─────────────────────────────────────────────────────

export interface AnomalyResult {
  is_anomaly: boolean;
  z_score?: number;
  mean?: number;
  std?: number;
  reason: string;
}

export function detectAnomaly(past_amounts: number[], new_amount: number): Promise<AnomalyResult> {
  return post('/anomaly', { past_amounts, new_amount });
}

// ── Prediction ────────────────────────────────────────────────────────────

export interface PredictionResult {
  prediction: number | null;
  linear_regression: number;
  moving_average: number;
  method: string;
  trend: string;
  trend_pct: number;
  mae: number | null;
  rmse: number | null;
  mape: number | null;
  explanation: string;
}

export function predictNextMonth(monthly_totals: number[]): Promise<PredictionResult> {
  return post('/predict', { monthly_totals });
}

// ── Model Metrics ─────────────────────────────────────────────────────────

export interface ModelMetrics {
  accuracy: number;
  accuracy_pct: number;
  cv_mean: number;
  cv_std: number;
  train_samples: number;
  test_samples: number;
}

export function getModelMetrics(): Promise<ModelMetrics> {
  return get('/metrics');
}
