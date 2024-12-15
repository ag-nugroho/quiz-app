import { useState, useEffect, useCallback } from 'react';
import './App.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (username.trim()) {
      onLogin(username);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Masuk ke Dalam QUIZ</h2>
        <div className="login-content">
          <input 
            type="text"
            placeholder="Masukkan Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <button 
            onClick={handleLogin} 
            className="login-button"
          >
            Masuk
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 menit
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://opentdb.com/api.php?amount=10&type=multiple'
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const processedQuestions = data.results.map(q => ({
          ...q,
          allAnswers: [
            ...q.incorrect_answers, 
            q.correct_answer
          ].sort(() => Math.random() - 0.5)
        }));
        setQuestions(processedQuestions);
        
        localStorage.setItem('quizQuestions', JSON.stringify(processedQuestions));
      } else {
        throw new Error('No questions found');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !quizFinished) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (timeRemaining === 0) {
      finishQuiz();
    }
  }, [quizStarted, timeRemaining, quizFinished]);

  const handleAnswer = (selectedAnswer) => {
    if (!questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    
    if (selectedAnswer === currentQuestion.correct_answer) {
      setScore(prev => ({
        ...prev,
        correct: prev.correct + 1,
        total: prev.total + 1
      }));
    } else {
      setScore(prev => ({
        ...prev,
        incorrect: prev.incorrect + 1,
        total: prev.total + 1
      }));
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    localStorage.removeItem('quizQuestions');
  };

  const startQuiz = () => {
    fetchQuestions();
    setQuizStarted(true);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (quizFinished) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2 className="quiz-title">Hasil Quiz</h2>
          <div className="result-content">
            <div className="result-stats">
              <div className="result-correct">
                <span className="checkmark">✓</span>
                <span>Benar: {score.correct}</span>
              </div>
              <div className="result-incorrect">
                <span className="xmark">✗</span>
                <span>Salah: {score.incorrect}</span>
              </div>
              <div className='result-total'>
                <span>Total Soal: {score.total}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setQuizFinished(false);
                setQuizStarted(false);
                setCurrentQuestionIndex(0);
                setScore({ correct: 0, incorrect: 0, total: 0 });
                setTimeRemaining(600);
              }}
              className="restart-button"
            >
              Main Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2 className="quiz-title">Error</h2>
          <p className="error-message">{error}</p>
          <button 
            onClick={startQuiz} 
            className="restart-button"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2 className="quiz-title">Memuat Pertanyaan...</h2>
        </div>
      </div>
    );
  }

  if (!quizStarted || questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2 className="quiz-title">Siap Memulai Quiz?</h2>
          <button 
            onClick={startQuiz} 
            className="start-button"
          >
            Mulai Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <h2 className="quiz-title">Error</h2>
          <p className="error-message">Tidak ada pertanyaan tersedia</p>
          <button 
            onClick={startQuiz} 
            className="restart-button"
          >
            Muat Ulang Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-header">
          <h2 className="quiz-title">Quiz</h2>
          <div className="timer">
            <span className="clock"></span>
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>
        <div className="quiz-content">
          <div 
            className="question" 
            dangerouslySetInnerHTML={{
              __html: currentQuestion.question
            }} 
          />

          <div className="answer-grid">
            {currentQuestion.allAnswers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(answer)}
                className="answer-button"
              >
                <span dangerouslySetInnerHTML={{ __html: answer }} />
              </button>
            ))}
          </div>

          <div className="question-counter">
            Soal {currentQuestionIndex + 1} dari {questions.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App
