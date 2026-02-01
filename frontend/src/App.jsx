import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, History, BookOpen, ChevronRight, X, Loader2 } from 'lucide-react';
import QuizGenerator from './components/QuizGenerator';
import QuizHistory from './components/QuizHistory';

import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000';

const LandingPage = () => (
    <div className="landing-container animate-in">
        <div className="landing-content">
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>WikiQuiz AI</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    The ultimate AI-powered Wikipedia knowledge tester.
                    Choose your path and start learning.
                </p>
            </header>

            <div className="landing-actions">
                <a
                    href="/generate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-btn primary"
                >
                    <Search size={28} />
                    <span>Generate Quiz</span>
                </a>
                <a
                    href="/history"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-btn secondary"
                >
                    <History size={28} />
                    <span>Past Quizzes</span>
                </a>
            </div>
        </div>
    </div>
);

function App() {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await axios.get(`${API_BASE}/quizzes`);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <Router>
            <div className="container">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/generate" element={
                        <div className="animate-in">
                            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <h1>WikiQuiz AI</h1>
                            </header>
                            <QuizGenerator apiBase={API_BASE} />
                        </div>
                    } />
                    <Route
                        path="/history"
                        element={
                            <div className="animate-in">
                                <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <h1>WikiQuiz AI - History</h1>
                                </header>
                                <QuizHistory
                                    history={history}
                                    loading={loadingHistory}
                                    apiBase={API_BASE}
                                    onRefresh={fetchHistory}
                                />
                            </div>
                        }
                    />
                </Routes>

                <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Built with FastAPI, React, and Gemini AI.
                </footer>
            </div>
        </Router>
    );
}

export default App;
