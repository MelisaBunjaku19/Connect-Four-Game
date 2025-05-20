import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [winner, setWinner] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:8000/board')
      .then(res => {
        setBoard(res.data.board);
        setWinner(res.data.winner);
      });
  }, []);

  const handleClick = (colIndex) => {
    if (winner !== 0) return;

    axios.post('http://localhost:8000/move', {
      column: colIndex,
      player: currentPlayer
    }).then(res => {
      if (res.data.status === 'success' || res.data.status === 'win') {
        setBoard(res.data.board);
        if (res.data.status === 'win') {
          setWinner(res.data.winner);
        } else {
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        }
      } else if (res.data.status === 'error') {
        alert(res.data.message);
      }
    });
  };

  const handleReset = () => {
    axios.post('http://localhost:8000/reset').then(res => {
      setBoard(res.data.board);
      setWinner(0);
      setCurrentPlayer(1);
    });
  };

  return (
    <div className="app-container">
      <h1 className="title">Connect Four</h1>
      <div className="status">
        {winner ? `🎉 Player ${winner} wins!` : `Current Player: ${currentPlayer}`}
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
      <button className="reset-button" onClick={handleReset}>
        Reset Game
      </button>
    </div>
  );
}

export default App;
