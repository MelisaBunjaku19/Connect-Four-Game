from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

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
current_winner = 0
game_mode = "human" 


class Move(BaseModel):
    column: int
    player: int

class Mode(BaseModel):
    mode: str


@app.get("/board")
def get_board():
    return {
        "board": game_board,
        "winner": current_winner,
        "mode": game_mode
    }


@app.post("/move")
def make_move(move: Move):
    global current_winner

    if current_winner != 0:
        return {"status": "game-over", "winner": current_winner, "board": game_board}

    result = apply_move(move.column, move.player)
    if result["status"] != "success":
        return result


    if game_mode == "bot" and current_winner == 0:
        bot_col = choose_bot_move()
        if bot_col is not None:
            bot_result = apply_move(bot_col, 2 if move.player == 1 else 1)
            if bot_result["status"] == "win":
                return bot_result

    return {"status": "success", "board": game_board, "winner": current_winner}


@app.post("/reset")
def reset_game():
    global game_board, current_winner
    game_board = [[0] * COLS for _ in range(ROWS)]
    current_winner = 0
    return {"status": "reset", "board": game_board}


@app.post("/mode")
def set_mode(mode: Mode):
    global game_mode
    if mode.mode not in {"human", "bot"}:
        return {"status": "error", "message": "Invalid mode"}
    game_mode = mode.mode
    return {"status": "ok", "mode": game_mode}


# Core logic
def apply_move(column: int, player: int):
    global current_winner
    for row in reversed(range(ROWS)):
        if game_board[row][column] == 0:
            game_board[row][column] = player
            if check_winner(row, column, player):
                current_winner = player
                return {"status": "win", "winner": player, "board": game_board}
            return {"status": "success", "board": game_board}
    return {"status": "error", "message": "Column full"}



def choose_bot_move():
    opponent = 1
    bot = 2
    valid_cols = [col for col in range(COLS) if game_board[0][col] == 0]

 
    for col in valid_cols:
        if would_win(col, bot):
            return col

  
    for col in valid_cols:
        if would_win(col, opponent):
            return col

  
    return random.choice(valid_cols) if valid_cols else None



def would_win(col: int, player: int) -> bool:
    for row in reversed(range(ROWS)):
        if game_board[row][col] == 0:
            game_board[row][col] = player
            win = check_winner(row, col, player)
            game_board[row][col] = 0  
            return win
    return False



def check_winner(row, col, player):
    return any(count_connected(row, col, dx, dy, player) >= 4
               for dx, dy in [(1, 0), (0, 1), (1, 1), (1, -1)])



def count_connected(row, col, dx, dy, player):
    count = 1
    count += count_direction(row, col, dx, dy, player)
    count += count_direction(row, col, -dx, -dy, player)
    return count


def count_direction(row, col, dx, dy, player):
    r, c = row + dy, col + dx
    count = 0
    while 0 <= r < ROWS and 0 <= c < COLS and game_board[r][c] == player:
        count += 1
        r += dy
        c += dx
    return count
