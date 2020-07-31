import React from "react";
import "./App.css";
import Square from "./components/square";
import io from "socket.io-client";

function App() {
  const [rowCol, setRowCol] = React.useState(3);
  const socket = io("https://tic-tac-toe-online-pownthep.herokuapp.com");
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const [gameId, setId] = React.useState("");
  const [game, setGame] = React.useState({
    board: [],
    row: 0,
    col: 0,
  });
  const [joined, setJoined] = React.useState(false);
  const [mounted, setMounted] = React.useState(true);
  const [mark, setMark] = React.useState("");
  const [turn, setTurn] = React.useState("");
  const [player, setPlayer] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [gameOver, setGameOver] = React.useState(false);

  if (urlParams.get("id") && !joined) {
    setJoined(true);
    console.log("joining game: " + urlParams.get("id"));
    socket.emit("join game", urlParams.get("id"));
    setId(urlParams.get("id"));
  }

  const createGame = (e) => {
    console.log("creating game: " + rowCol * rowCol);
    socket.emit("create game", {
      board: [...Array(rowCol * rowCol)],
      col: rowCol,
      row: rowCol,
    });
    setStatus("Waiting player to join");
  };

  socket.on("created game", (id) => {
    console.log("created game id: " + id);
    setId(id);
  });

  socket.on("prepare game", (data) => {
    setStatus("Started");
    setGame(data.game);
    setMark(data.mark);
    setTurn(data.turn);
    setPlayer(data.player);
    console.log(data);
  });

  socket.on("update board", (data) => {
    setGame((prev) => ({
      ...prev,
      board: data.board,
    }));
    setTurn(data.turn);
    if(data.status !== -1) {
      setStatus(data.status);
      setGameOver(true);
    }
    console.log("Updated game", game);
  });

  return (
    <div>
      <section
        style={{
          textAlign: "center",
        }}
      >
        <h1>Tic Tac Toe</h1>
      </section>
      <main
        style={{
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <label htmlFor="row">Row: </label>
          <input
            type="number"
            id="row"
            value={rowCol}
            max="10"
            min="1"
            onChange={(e) => {
              if (e.target.value <= 10) setRowCol(e.target.value);
              else setRowCol(10);
            }}
          />
          <label htmlFor="col">Column: </label>
          <input
            type="number"
            id="col"
            value={rowCol}
            max="10"
            min="1"
            onChange={(e) => {
              if (e.target.value <= 10) setRowCol(e.target.value);
              else setRowCol(10);
            }}
          />
          <button onClick={createGame}>Create game</button>
          <p>Game ID: {gameId} Player: {player}</p>
          <p>
            Join game at:{" "}
            {window.location.protocol +
              "//" +
              window.location.host +
              window.location.pathname +
              "?id=" +
              gameId}
          </p>
          <p>Turn: {turn}</p>
          <p>Game Status: {status}</p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${game.col}, 1fr)`,
            gridTemplateRows: `repeat(${game.row}, 1fr)`,
            margin: "0 auto",
            marginTop: 20,
            height: "60vh",
            width: "60vh",
          }}
        >
          {" "}
          {game.board.map((i, index) => (
            <Square
              key={index}
              pos={index}
              mark={i}
              onClick={
                !i && turn === player && !gameOver
                  ? (p) => {
                      socket.emit("update game", {
                        id: gameId,
                        index: p,
                        mark: mark,
                        player: player,
                      });
                      setTurn(false);
                    }
                  : () => {}
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
