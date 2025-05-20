from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROWS, COLS = 6, 7
game_board = [[0] * COLS for _ in range(ROWS)]
current_winner = 0  # 0 = no winner

class Move(BaseModel):
    column: int
    player: int

@app.get("/board")
def get_board():
    return {"board": game_board, "winner": current_winner}

@app.post("/move")
def make_move(move: Move):
    global current_winner

    if current_winner != 0:
        return {"status": "game-over", "winner": current_winner, "board": game_board}

    for row in reversed(range(ROWS)):
        if game_board[row][move.column] == 0:
            game_board[row][move.column] = move.player
            if check_winner(row, move.column, move.player):
                current_winner = move.player
                return {"status": "win", "winner": move.player, "board": game_board}
            return {"status": "success", "board": game_board}
    return {"status": "error", "message": "Column full"}

def check_winner(row, col, player):
    def count(dx, dy):
        r, c = row + dy, col + dx
        count = 0
        while 0 <= r < ROWS and 0 <= c < COLS and game_board[r][c] == player:
            count += 1
            r += dy
            c += dx
        return count

    directions = [ (1,0), (0,1), (1,1), (1,-1) ]
    for dx, dy in directions:
        if 1 + count(dx, dy) + count(-dx, -dy) >= 4:
            return True
    return False

@app.post("/reset")
def reset_game():
    global game_board, current_winner
    game_board = [[0] * COLS for _ in range(ROWS)]
    current_winner = 0
    return {"status": "reset", "board": game_board}
