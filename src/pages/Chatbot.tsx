import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, Zap, AlertCircle } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const quickPrompts = [
  'How can I save more?',
  'Budget for ₹30K/month',
  'Where am I overspending?',
  'Emergency fund tips',
  'Reduce food expenses',
  '50-30-20 rule',
];

const SYSTEM_PROMPT = `You are FinanceAI, an expert AI financial assistant embedded in a Smart Financial Tracker app. 
You help users with:
- Personalized savings strategies
- Budget planning (50-30-20 rule and custom plans)
- Expense reduction tips by category (Food, Travel, Shopping, Bills, Health, Entertainment, Education)
- Debt management (avalanche & snowball methods)
- Emergency fund planning
- Investment basics (SIP, mutual funds, index funds, PPF)
- Spending pattern analysis and anomaly detection
- Expense prediction and forecasting

Always give practical, actionable advice. Use Indian Rupee (₹) for currency examples. 
Keep responses concise, friendly, and structured with bullet points or numbered lists when helpful.
If asked about something unrelated to finance, politely redirect to financial topics.`;

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hi! I'm your financial advisor. 👋\n\nI can help with budgeting, savings, investments, and personalized advice.\n\nWhat would you like to know?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!GEMINI_API_KEY) return;
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      chatRef.current = model.startChat({
        history: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: 'Understood! I am FinanceAI, ready to provide expert financial guidance.' }] },
        ],
      });
    } catch (e) {
      console.error('Gemini init error:', e);
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY is not set in your .env file');
      }
      if (!chatRef.current) {
        throw new Error('Gemini chat session not initialized');
      }

      const result = await chatRef.current.sendMessage(text);
      const responseText = result.response.text();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((p) => [...p, botMsg]);
    } catch (e: any) {
      setError(e.message || 'Failed to get response');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="page-enter h-[calc(100vh-3.5rem)] md:h-auto flex flex-col">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">AI Advisor</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Powered by Gemini — ask anything about your finances</p>
        </div>

        {/* API Warning */}
        {!GEMINI_API_KEY && (
          <div className="mb-4 p-3.5 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3 flex-shrink-0">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-xs text-amber-700">API key not configured</p>
              <p className="text-[11px] mt-0.5 text-amber-600">
                Add <code className="bg-amber-100 px-1 rounded text-[10px]">VITE_GEMINI_API_KEY=your_key</code> to
                <code className="bg-amber-100 px-1 rounded text-[10px] ml-1">.env</code>
              </p>
            </div>
          </div>
        )}

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 flex-shrink-0">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={isTyping}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] sm:text-xs rounded-full hover:border-[#444CE7] hover:text-[#444CE7] hover:bg-[#EEF0FF] transition-all flex items-center gap-1 disabled:opacity-50 font-medium"
            >
              <Sparkles size={10} />
              {p}
            </button>
          ))}
        </div>

        {/* Chat Container */}
        <div className="card flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  msg.sender === 'user'
                    ? 'bg-[#444CE7]'
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  {msg.sender === 'user'
                    ? <User size={14} className="text-white" />
                    : <Bot size={14} className="text-gray-500" />}
                </div>
                <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.sender === 'user'
                    ? 'bg-[#444CE7] text-white rounded-tr-md'
                    : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-md'
                }`}>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1.5 ${
                    msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing */}
            {isTyping && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Bot size={14} className="text-gray-500" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <Zap size={11} className="text-[#444CE7] animate-pulse" />
                    <span className="text-gray-400 text-xs mr-1.5">Thinking</span>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="typing-dot w-1.5 h-1.5 bg-[#444CE7] rounded-full opacity-60" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium animate-scale-in">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="border-t border-gray-100 p-3 sm:p-4 flex-shrink-0">
            <div className="flex gap-2.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask about savings, budget, investments..."
                disabled={isTyping}
                className="input-field flex-1 text-sm disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isTyping || !input.trim()}
                className="btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
