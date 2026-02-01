import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, ExternalLink, Loader2, X, ChevronRight } from 'lucide-react';

const QuizHistory = ({ history, loading, apiBase, onRefresh }) => {
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch history on mount for the new tab redirect
    useEffect(() => {
        onRefresh();
    }, []);

    const handleOpenDetails = async (articleId) => {
        setLoadingDetails(true);
        try {
            const response = await axios.get(`${apiBase}/quiz/${articleId}`);
            setSelectedQuiz(response.data);
        } catch (error) {
            console.error('Error fetching quiz details:', error);
            alert('Failed to load quiz details.');
        } finally {
            setLoadingDetails(false);
        }
    };

    const checkCorrect = (option, answer) => {
        if (!option || !answer) return false;
        const opt = option.trim();
        const ans = answer.trim();
        if (opt.toLowerCase() === ans.toLowerCase()) return true;
        const clean = (str) => str.replace(/^[a-d0-9][\.\)\-]\s*/i, '').toLowerCase().trim();
        const cleanOpt = clean(opt);
        const cleanAns = clean(ans);
        if (cleanOpt === cleanAns && cleanOpt !== "") return true;
        const letterAns = ans.match(/^[A-D]$/i);
        if (letterAns) {
            const letter = letterAns[0].toUpperCase();
            if (opt.toUpperCase().startsWith(letter + ".")) return true;
        }
        if (cleanAns.length > 3 && cleanOpt.includes(cleanAns)) return true;
        return false;
    };

    return (
        <div className="quiz-history">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Processing History</h2>
                <button onClick={onRefresh} className="tab-btn" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    Refresh
                </button>
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading history...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>No quizzes yet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Generate your first quiz to see it here!</p>
                </div>
            ) : (
                <div className="card animate-in" style={{ padding: '0', overflow: 'hidden' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Article Title</th>
                                <th>URL</th>
                                <th>Generated On</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id} className="history-row">
                                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                                    <td>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}
                                        >
                                            {item.url}
                                        </a>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                            onClick={() => handleOpenDetails(item.id)}
                                        >
                                            View Quiz
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Details Modal */}
            {selectedQuiz && (
                <div className="modal-overlay animate-in" onClick={() => setSelectedQuiz(null)}>
                    {/* Fixed Close Button that stays on screen */}
                    <button className="fixed-close-btn" onClick={() => setSelectedQuiz(null)}>
                        <X size={24} />
                        <span>Close</span>
                    </button>

                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="quiz-header">
                            <h2 className="quiz-title">{selectedQuiz.title}</h2>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <a href={selectedQuiz.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                                    Original Article <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                                </a>
                            </div>
                        </div>

                        <div className="questions" style={{ maxHeight: 'none', overflowY: 'visible' }}>
                            {selectedQuiz.quiz.map((q, index) => (
                                <div key={index} className="question-card" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className={`difficulty-badge ${q.difficulty}`}>{q.difficulty}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Question {index + 1}</span>
                                    </div>
                                    <h3 style={{ margin: '0.5rem 0 1rem 0' }}>{q.question}</h3>
                                    <div className="options">
                                        {q.options.map((option, oIndex) => {
                                            const isAnswerCorrect = checkCorrect(option, q.answer);
                                            return (
                                                <div
                                                    key={oIndex}
                                                    className={`option-btn ${isAnswerCorrect ? 'correct' : ''}`}
                                                    style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span>{option}</span>
                                                        {isAnswerCorrect && (
                                                            <span className="feedback-label correct" style={{ fontSize: '0.65rem' }}>Correct Answer</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="explanation" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <strong>Explanation:</strong> {q.explanation}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <BookOpen size={18} /> Related Topics
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {selectedQuiz.related_topics.map((topic, i) => (
                                    <span key={i} className="difficulty-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Secondary Close Button at the bottom */}
                        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                            <button className="primary" onClick={() => setSelectedQuiz(null)} style={{ padding: '1rem 3rem', borderRadius: '50px', fontSize: '1.1rem' }}>
                                Close Result
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loadingDetails && (
                <div className="modal-overlay">
                    <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
                </div>
            )}
        </div>
    );
};

export default QuizHistory;
