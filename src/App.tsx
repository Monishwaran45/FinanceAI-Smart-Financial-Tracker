import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import ScanExpense from './pages/ScanExpense';
import Analysis from './pages/Analysis';
import Chatbot from './pages/Chatbot';
import Savings from './pages/Savings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FAFBFC]">
        <Navigation />
        <main className="pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scan" element={<ScanExpense />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/savings" element={<Savings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
