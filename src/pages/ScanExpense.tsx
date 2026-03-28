import { useState, useRef } from 'react';
import { createExpense } from '../lib/db';
import { hybridCategorize, scanBill } from '../lib/api';
import {
  ScanLine, CheckCircle, AlertCircle, Sparkles,
  Upload, ImageIcon, X, Loader2, Zap, Info, Camera
} from 'lucide-react';

type Category = 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Health' | 'Entertainment' | 'Education' | 'Other';

const categoryConfig: Record<Category, { emoji: string; color: string; activeBg: string }> = {
  Food:          { emoji: '🍔', color: 'text-orange-600', activeBg: 'bg-orange-50 border-orange-300 text-orange-700' },
  Travel:        { emoji: '🚗', color: 'text-blue-600',   activeBg: 'bg-blue-50 border-blue-300 text-blue-700' },
  Shopping:      { emoji: '🛍️', color: 'text-pink-600',   activeBg: 'bg-pink-50 border-pink-300 text-pink-700' },
  Bills:         { emoji: '📄', color: 'text-gray-600',   activeBg: 'bg-gray-100 border-gray-300 text-gray-700' },
  Health:        { emoji: '💊', color: 'text-green-600',   activeBg: 'bg-green-50 border-green-300 text-green-700' },
  Entertainment: { emoji: '🎬', color: 'text-purple-600', activeBg: 'bg-purple-50 border-purple-300 text-purple-700' },
  Education:     { emoji: '📚', color: 'text-indigo-600', activeBg: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
  Other:         { emoji: '💰', color: 'text-amber-600',  activeBg: 'bg-amber-50 border-amber-300 text-amber-700' },
};
const categories: Category[] = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScanExpense() {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food' as Category,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiInfo, setAiInfo] = useState<{ explanation: string; source: string; confidence: number; keywords: string[] } | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setScanResult(null);
    setAiInfo(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleImageSelect(file);
  };

  const handleDescriptionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const desc = e.target.value;
    setFormData((p) => ({ ...p, description: desc }));
    setAiInfo(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (desc.length < 4) return;

    debounceRef.current = setTimeout(async () => {
      setIsCategorizing(true);
      try {
        const result = await hybridCategorize(desc);
        setFormData((p) => ({ ...p, category: result.category as Category }));
        setAiInfo({
          explanation: result.explanation,
          source: result.source || 'ml_model',
          confidence: result.confidence_pct,
          keywords: result.top_keywords || [],
        });
      } catch {
        // backend not running — silent fallback
      } finally {
        setIsCategorizing(false);
      }
    }, 500);
  };

  const handleScanWithGemini = async () => {
    if (!imageFile) { setMessage({ type: 'error', text: 'Please upload a bill image first.' }); return; }
    setIsScanning(true);
    setScanResult(null);
    try {
      const base64 = await fileToBase64(imageFile);
      const result = await scanBill(base64, imageFile.type);
      const cat = (categories.includes(result.category as Category) ? result.category : 'Other') as Category;
      const desc = result.merchant ? `${result.description} — ${result.merchant}` : result.description;
      setFormData((p) => ({ ...p, amount: result.amount > 0 ? String(result.amount) : p.amount, category: cat, description: desc }));
      setScanResult(`${categoryConfig[cat].emoji} ${cat} • ₹${result.amount} • ${Math.round(result.confidence * 100)}% confidence`);
      setMessage({ type: 'success', text: 'Bill scanned successfully!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ type: 'error', text: `Scan failed: ${e.message}` });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' }); return;
    }
    try {
      await createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description,
      });
      setMessage({ type: 'success', text: 'Expense added successfully!' });
      resetForm();
    } catch {
      setMessage({ type: 'error', text: 'Failed to add expense. Please try again.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({ amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' });
    setImageFile(null); setImagePreview(null); setScanResult(null); setAiInfo(null);
  };

  const sourceLabel: Record<string, string> = {
    ml_model: 'Naive Bayes ML',
    gemini_fallback: 'Gemini AI (fallback)',
  };

  return (
    <div className="page-enter">
      <div className="max-w-lg mx-auto px-5 sm:px-6 py-6 sm:py-10">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Add Expense</h1>
          <p className="text-gray-500 text-sm">Scan a bill or type a description — AI handles the rest</p>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-slide-up ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* ── Bill Scanner Card ──────────────────── */}
        <div className="card p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Camera size={16} className="text-[#444CE7]" />
            Scan Bill
          </h2>

          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all mb-4 ${
              imagePreview
                ? 'border-[#444CE7]/30 bg-[#EEF0FF]/30'
                : 'border-gray-200 hover:border-[#444CE7]/40 hover:bg-gray-50 cursor-pointer'
            }`}
          >
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Bill" className="w-full max-h-48 object-contain rounded-xl p-2" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setScanResult(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={13} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF0FF] flex items-center justify-center mb-3">
                  <ImageIcon size={22} className="text-[#444CE7]" />
                </div>
                <p className="text-gray-700 font-medium text-sm mb-1">Drop bill image or tap to upload</p>
                <p className="text-gray-400 text-xs">AI Vision extracts amount, merchant & category</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} className="hidden" />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex-1 py-2.5 text-xs"
            >
              <Upload size={14} />
              {imageFile ? 'Change' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!imageFile) {
                  fileInputRef.current?.click();
                } else {
                  handleScanWithGemini();
                }
              }}
              disabled={isScanning}
              className="btn-primary flex-1 py-2.5 text-xs"
            >
              {isScanning ? <><Loader2 size={14} className="animate-spin" />Scanning...</> : <><ScanLine size={14} />{imageFile ? 'Scan with AI' : 'Upload & Scan'}</>}
            </button>
          </div>

          {scanResult && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-[#EEF0FF] border border-[#C7D7FE] rounded-xl animate-scale-in">
              <Sparkles size={13} className="text-[#444CE7]" />
              <span className="text-[#444CE7] text-xs font-medium">{scanResult}</span>
            </div>
          )}
        </div>

        {/* ── Divider ────────────────────────────── */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-[#FAFBFC] text-gray-400 text-xs font-medium">or enter manually</span>
          </div>
        </div>

        {/* ── Manual Entry Form ──────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
              Description
              {isCategorizing && <Loader2 size={11} className="animate-spin text-[#444CE7]" />}
              {!isCategorizing && (
                <span className="text-[#444CE7] flex items-center gap-1 font-medium">
                  <Zap size={10} />ML auto-categorizes
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="e.g. Pizza from Swiggy, Uber ride, Amazon order..."
              className="input-field"
            />
          </div>

          {/* AI Explainability */}
          {aiInfo && (
            <div className="card p-4 space-y-2.5 animate-scale-in border-[#C7D7FE]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={13} className="text-[#444CE7]" />
                  <span className="text-[#444CE7] text-xs font-semibold">AI Explainability</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{sourceLabel[aiInfo.source] || aiInfo.source}</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">{aiInfo.explanation}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#444CE7] rounded-full transition-all duration-500"
                    style={{ width: `${aiInfo.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap font-medium">{aiInfo.confidence}%</span>
              </div>
              {aiInfo.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {aiInfo.keywords.map((kw) => (
                    <span key={kw} className="badge badge-brand text-[10px]">{kw}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Amount</label>
            <div className="flex items-center border-[1.5px] border-gray-200 rounded-xl overflow-hidden focus-within:border-[#444CE7] focus-within:shadow-[0_0_0_3px_rgba(68,76,231,0.12)] transition-all">
              <span className="pl-4 pr-1 text-gray-500 font-semibold text-base select-none bg-white">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                step="0.01"
                placeholder="0.00"
                required
                className="flex-1 py-3 pr-4 pl-1 bg-white text-gray-900 text-base outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Category Grid */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2.5">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const cfg = categoryConfig[cat];
                const isSelected = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, category: cat }))}
                    className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                      isSelected
                        ? cfg.activeBg
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cfg.emoji} {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
              required
              className="input-field"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 text-base">
            <CheckCircle size={18} />
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}
