# FinanceAI — Smart Financial Tracker

FinanceAI is a premium, production-grade financial tracking application that leverages Artificial Intelligence to automate expense categorization, provide actionable financial insights, analyze spending anomalies, and offer personalized budgeting advice. 

Designed with a modern, mobile-first fintech aesthetic inspired by industry leaders like Apple Wallet and Google Pay, FinanceAI delivers a seamless and highly intuitive user experience.

---

## 🚀 Key Features

### 1. 🧾 Smart Receipt Scanning (AI Vision)
- **Drop & Scan**: Upload or take a picture of a receipt/bill.
- **Gemini Vision AI**: Automatically extracts the amount, merchant description, and assigns the correct category.
- **Manual Entry with ML**: Type a description (e.g., "Uber ride") and the custom Machine Learning model will automatically categorize it in real-time.

### 2. 📊 Advanced Analytics & Insights
- **Interactive Dashboards**: Visualize your spending with beautiful Area charts (monthly trends), Bar charts (category breakdowns), and Donut charts.
- **AI-Powered Insights**: Get automatically generated alerts for high spending concentration, weekend spending patterns, and month-over-month spending spikes.
- **ML Expense Forecasting**: Predicts next month's expenses using historical data.
- **Anomaly Detection**: Identifies unusual spending behavior based on your past transactions.

### 3. 💬 AI Financial Advisor
- **Chat Interface**: Talk to "FinanceAI", an integrated financial expert powered by Google's Gemini.
- **Personalized Advice**: Ask questions about the 50-30-20 rule, reducing food expenses, emergency fund planning, or debt management strategies.
- **Quick Prompts**: One-click pills to instantly ask common financial questions.

### 4. 💰 Savings & Budget Planner
- **Income Tracking**: Input your monthly income to track your net savings.
- **The 50-30-20 Rule**: Automatically calculates recommended budgets for Needs (50%), Wants (30%), and Savings (20%) based on your income.
- **Visual Progress**: See at a glance if you are in a deficit, have low savings, or are hitting your targets.

---

## 🎨 UI/UX Design

The application features a **premium fintech design system**:
- **Palette**: A warm, clean light-mode with brand indigo, emerald successes, and amber warnings.
- **Layout**: Neatly separated white cards with subtle shadows, providing excellent readability.
- **Responsive Architecture**: 
  - *Desktop*: Frosted glass top navigation bar.
  - *Mobile*: Native-feeling bottom tab bar with an elevated central "Add Expense" action button, optimized for thumb reachability and notch displays (`safe-area-inset`).
- **Typography**: Clean, professional `Inter` font hierarchy.

---

## 🛠 Tech Stack

- **Frontend Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Custom customized design system in `tailwind.config.js` and `index.css`)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend & Database**: Supabase (PostgreSQL)
- **AI & Machine Learning**: 
  - Google Generative AI (Gemini 1.5 Flash / Vision) for chatbot and receipt scanning.
  - Custom ML integration (Naive Bayes + TF-IDF) for text auto-categorization and forecasting.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- A Supabase Project
- A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd myfinancial_tracker-main
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be running at `http://localhost:5173/`.

---

## 🗄 Database Schema (Supabase)

To run the application properly, the following tables are expected in your Supabase instance:

- **`expenses`**:
  - `id` (UUID, Primary Key)
  - `amount` (Numeric)
  - `category` (Text)
  - `description` (Text)
  - `date` (Timestamp/Date)
  
- **`user_income`**:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID)
  - `monthly_income` (Numeric)
  - `month` (Integer)
  - `year` (Integer)
  - `updated_at` (Timestamp)

*(Ensure Row Level Security (RLS) is configured appropriately if integrating authentication later).*

---

## 📱 Platforms Supported
- **Web App** (Chrome, Safari, Edge, Firefox)
- **Progressive Web App (PWA) Ready**: Mobile layouts fully optimized for iOS and Android web browsers.

---
*Crafted for the future of personal finance.*
