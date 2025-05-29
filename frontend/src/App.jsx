import { useEffect, useState } from 'react';
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

  useEffect(() => {
    axios.get('http://localhost:8000/board')
      .then(res => {
        setBoard(res.data.board);
        setWinner(res.data.winner);
        setMode(res.data.mode || "human");
      });
  }, []);

  useEffect(() => {
    if (winner !== 0) {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        zIndex: 9999
      });
    }
  }, [winner]);

  const handleClick = (colIndex) => {
    if (winner !== 0 || loading) return;

    setLoading(true);
    axios.post('http://localhost:8000/move', {
      column: colIndex,
      player: currentPlayer
    }).then(res => {
      setBoard(res.data.board);
      setWinner(res.data.winner || 0);

      if (res.data.status === 'error') {
        alert(res.data.message);
      }

      if (mode === "human" && res.data.status === "success") {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleReset = () => {
    axios.post('http://localhost:8000/reset').then(res => {
      setBoard(res.data.board);
      setWinner(0);
      setCurrentPlayer(1);
    });
  };

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    axios.post('http://localhost:8000/mode', { mode: newMode }).then(res => {
      if (res.data.status === 'ok') {
        setMode(newMode);
        handleReset();
      } else {
        alert(res.data.message);
      }
    });
  };

  return (
    <div className="app-container">

      <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
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
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                onClick={() => handleClick(colIndex)}
                className="cell"
              >
                <div className={`disc player${cell}`} />
              </div>
            ))}
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

<button className="reset-button" onClick={handleReset} title="Reset Game">
  <FiRefreshCcw size={24} />
</button>
    </div>



  );
}

export default App;
