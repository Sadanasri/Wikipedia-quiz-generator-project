import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, BookOpen, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

const QuizGenerator = ({ apiBase, onNavigateToHistory }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [error, setError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [showInput, setShowInput] = useState(true);

    // Preview states
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Debounce URL input for preview
    useEffect(() => {
        const fetchPreview = async () => {
            if (!url || !url.includes('wikipedia.org/wiki/')) {
                setPreview(null);
                return;
            }

            setLoadingPreview(true);
            try {
                const response = await axios.get(`${apiBase}/preview-article?url=${encodeURIComponent(url)}`);
                setPreview(response.data);
            } catch (err) {
                console.error('Preview error:', err);
                setPreview(null);
            } finally {
                setLoadingPreview(false);
            }
        };

        const timer = setTimeout(fetchPreview, 800);
        return () => clearTimeout(timer);
    }, [url, apiBase]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        setQuizData(null);
        setSubmitted(false);
        setUserAnswers({});
        setPreview(null); // Clear preview once generating

        try {
            const response = await axios.post(`${apiBase}/generate-quiz?url=${encodeURIComponent(url)}`);
            setQuizData(response.data);
            setShowInput(false); // Hide input once generated
        } catch (err) {
            console.error('Quiz Generation Error Detail:', err);
            const detail = err.response?.data?.detail;
            const status = err.response?.status;

            if (detail) {
                setError(`API Error (${status}): ${detail}`);
            } else if (err.message) {
                setError(`Connection Error: ${err.message}. Check if backend is running at ${apiBase}`);
            } else {
                setError('An unexpected error occurred. Please check the browser console for details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (qIndex, option) => {
        if (submitted) return;
        setUserAnswers({ ...userAnswers, [qIndex]: option });
    };

    const handleTryAgain = () => {
        setUserAnswers({});
        setSubmitted(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const calculateScore = () => {
        let score = 0;
        quizData.quiz.forEach((q, index) => {
            if (checkCorrect(userAnswers[index], q.answer)) score++;
        });
        return score;
    };

    const checkCorrect = (option, answer) => {
        if (!option || !answer) return false;

        const opt = option.trim();
        const ans = answer.trim();

        // 1. Exact string match
        if (opt.toLowerCase() === ans.toLowerCase()) return true;

        // 2. Normalize by removing prefixes
        const clean = (str) => str.replace(/^[a-d0-9][\.\)\-]\s*/i, '').toLowerCase().trim();
        const cleanOpt = clean(opt);
        const cleanAns = clean(ans);

        if (cleanOpt === cleanAns && cleanOpt !== "") return true;

        // 3. AI returned just the letter
        const letterAns = ans.match(/^[A-D]$/i);
        if (letterAns) {
            const letter = letterAns[0].toUpperCase();
            if (opt.toUpperCase().startsWith(letter + ".")) return true;
        }

        if (cleanAns.length > 3 && cleanOpt.includes(cleanAns)) return true;

        return false;
    };

    // Helper to group questions by section
    const groupedQuestions = quizData ? quizData.quiz.reduce((acc, q, idx) => {
        const section = q.section || 'General';
        if (!acc[section]) acc[section] = [];
        acc[section].push({ ...q, originalIndex: idx });
        return acc;
    }, {}) : {};

    return (
        <div className="quiz-generator">
            {!quizData && !loading && !showInput && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <button
                        className="primary animate-in"
                        style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '12px' }}
                        onClick={() => setShowInput(true)}
                    >
                        <Search size={22} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                        Generate Quiz
                    </button>
                </div>
            )}

            {(showInput || loading) && !quizData && (
                <div className="animate-in">
                    <form onSubmit={handleGenerate} className="input-group">
                        <input
                            type="url"
                            placeholder="Paste Wikipedia URL (e.g., https://en.wikipedia.org/wiki/Alan_Turing)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            autoFocus
                        />
                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate Quiz'}
                        </button>
                    </form>

                    {/* Preview Selection */}
                    {loadingPreview && (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <Loader2 className="animate-spin" size={20} style={{ color: 'var(--primary)' }} />
                            <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fetching article preview...</span>
                        </div>
                    )}

                    {preview && !loading && (
                        <div className="preview-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                <CheckCircle2 size={18} color="var(--success)" />
                                <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Ready for Generation</h4>
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>{preview.title}</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {preview.summary}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="card" style={{ borderLeft: '4px solid var(--error)', color: 'var(--error)' }}>
                    {error}
                </div>
            )}

            {quizData && (
                <div className="card animate-in">
                    <div className="quiz-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h2 className="quiz-title">{quizData.title}</h2>
                            <button
                                className="tab-btn"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                                onClick={() => { setQuizData(null); setShowInput(true); setUrl(''); }}
                            >
                                New Quiz
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            <span>{quizData.quiz.length} Questions</span>
                            <span>•</span>
                            <a href={quizData.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                View Article <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                            </a>
                        </div>
                        <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>{quizData.summary}</p>
                    </div>

                    <div className="questions">
                        {Object.entries(groupedQuestions).map(([section, questions]) => (
                            <React.Fragment key={section}>
                                <div className="section-header animate-in">
                                    <span className="section-badge">SECTION</span>
                                    <h3>{section}</h3>
                                </div>
                                {questions.map((q) => (
                                    <div key={q.originalIndex} className="question-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span className={`difficulty-badge ${q.difficulty}`}>{q.difficulty}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Question {q.originalIndex + 1}</span>
                                        </div>
                                        <h3 style={{ margin: '0.5rem 0 1rem 0' }}>{q.question}</h3>

                                        <div className="options">
                                            {q.options.map((option, oIndex) => {
                                                const isAnswerCorrect = checkCorrect(option, q.answer);
                                                const isUserSelection = userAnswers[q.originalIndex] === option;

                                                let className = 'option-btn';
                                                if (isUserSelection) className += ' selected';
                                                if (submitted) {
                                                    if (isAnswerCorrect) className += ' correct';
                                                    else if (isUserSelection) className += ' wrong';
                                                }

                                                return (
                                                    <button
                                                        key={oIndex}
                                                        className={className}
                                                        onClick={() => handleOptionSelect(q.originalIndex, option)}
                                                        disabled={submitted}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span>{option}</span>
                                                                {submitted && isAnswerCorrect && (
                                                                    <span className="feedback-label correct">Correct Answer</span>
                                                                )}
                                                                {submitted && isUserSelection && !isAnswerCorrect && (
                                                                    <span className="feedback-label wrong">Your Choice</span>
                                                                )}
                                                            </div>
                                                            {submitted && isAnswerCorrect && <CheckCircle2 size={16} color="#00ff88" />}
                                                            {submitted && isUserSelection && !isAnswerCorrect && <XCircle size={16} color="var(--error)" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {submitted && (
                                            <div className="explanation animate-in">
                                                <strong>Explanation:</strong> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>

                    {!submitted ? (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                className="primary"
                                style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}
                                onClick={() => {
                                    if (Object.keys(userAnswers).length < quizData.quiz.length) {
                                        if (!confirm('You haven\'t answered all questions. Submit anyway?')) return;
                                    }
                                    setSubmitted(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                Submit All Answers
                            </button>
                        </div>
                    ) : (
                        <div className="card animate-in" style={{ textAlign: 'center', background: 'var(--bg-dark)', border: '2px solid var(--primary)', marginTop: '2rem' }}>
                            <h2 style={{ color: 'var(--primary)' }}>Quiz Results</h2>
                            <p style={{ fontSize: '2rem', margin: '1rem 0', fontWeight: 800 }}>
                                {calculateScore()} / {quizData.quiz.length}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                <button className="tab-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                    Review Answers
                                </button>
                                <button className="tab-btn" style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', border: '1px solid #00ff88' }} onClick={handleTryAgain}>
                                    Try Again
                                </button>
                                <button className="primary" onClick={() => { setQuizData(null); setShowInput(true); setUrl(''); }}>
                                    Try Another Article
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizGenerator;
