import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import './App.css';
import { FaCircle } from "react-icons/fa";
import { FiRefreshCcw } from "react-icons/fi";

function App() {
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [winner, setWinner] = useState(0);
  const [mode, setMode] = useState("human");
  const [loading, setLoading] = useState(false);
  const [previousBoard, setPreviousBoard] = useState([]);
  const [countdown, setCountdown] = useState(3); 
  const [gameStarted, setGameStarted] = useState(false); 
  const hasCountdownRun = useRef(false); 


  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await axios.get('http://localhost:8000/board');
        setBoard(res.data.board);
        setWinner(res.data.winner);
        setMode(res.data.mode || "human");
      } catch (err) {
        console.error("Failed to fetch board:", err);
      }
    };

    fetchBoard();
  }, []);

  useEffect(() => {
    if (winner !== 0) {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    }
  }, [winner]);


  useEffect(() => {
    if (!hasCountdownRun.current && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!hasCountdownRun.current) {
      setGameStarted(true);
      hasCountdownRun.current = true;
    }
  }, [countdown]);


  const handleClick = async (colIndex) => {
    if (winner || loading || !gameStarted) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/move', {
        column: colIndex,
        player: currentPlayer,
      });

      if (res.data.status === 'error') {
        alert(res.data.message);
      } else {
        setBoard(res.data.board);
        setWinner(res.data.winner || 0);
        if (mode === "human") {
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        }
      }
    } catch (err) {
      console.error("Move failed:", err);
    } finally {
      setLoading(false);
      setPreviousBoard(board);
    }
  };


  const handleReset = async () => {
    try {
      const res = await axios.post('http://localhost:8000/reset');
      setBoard(res.data.board);
      setWinner(0);
      setCurrentPlayer(1);
   
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };


  const switchMode = async (newMode) => {
    if (newMode === mode) return;
    try {
      const res = await axios.post('http://localhost:8000/mode', { mode: newMode });
      if (res.data.status === 'ok') {
        setMode(newMode);
        handleReset(); 
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Switch mode failed:", err);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">
        <FaCircle color="red" size={40} />
        PLAY
        <FaCircle color="gold" size={40} />
      </h1>

      <div className={`status ${winner ? 'win-message' : ''}`}>
        {winner ? `🎉 Player ${winner} wins! 🎉` : `Current Player: ${currentPlayer}`}
      </div>

      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => {
              let dropFrom = -60;

              if (previousBoard.length > 0 && cell !== 0) {
                const prevColumn = previousBoard.map(r => r[colIndex]);
                const lastEmptyIndex = prevColumn.lastIndexOf(0);
                const dropDistance = (rowIndex - lastEmptyIndex) * 68;
                if (dropDistance > 0) {
                  dropFrom = -dropDistance;
                }
              }

              return (
                <div
                  key={colIndex}
                  onClick={() => handleClick(colIndex)}
                  className="cell"
                >
                  {cell !== 0 && (
                    <div
                      className={`disc player${cell}`}
                      style={{ "--drop-from": `${dropFrom}px` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mode-buttons" style={{ marginTop: '1rem' }}>
        <button
          className={mode === "human" ? "active-mode" : ""}
          onClick={() => switchMode("human")}
        >
          2 Players
        </button>
        <button
          className={mode === "bot" ? "active-mode" : ""}
          onClick={() => switchMode("bot")}
        >
          Player vs Bot
        </button>
      </div>

      <button
        className="reset-button"
        onClick={handleReset}
        title="Reset Game"
        style={{ marginTop: '1rem' }}
      >
        Reset Game
      </button>

      {!gameStarted && (
        <div className="overlay">
          <div className="countdown-text">
            {countdown > 0 ? `Game starts in ${countdown}...` : 'Go!'}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
