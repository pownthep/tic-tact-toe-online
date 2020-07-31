var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

var gameId = {};
var counter = 0;

io.on("connection", (socket) => {
  socket.on("create game", (game) => {
    gameId[counter] = {
      player1: socket,
      game: game,
      turn: Math.round(Math.random()) == 0 ? "player1" : "player2",
      rowData: {},
      colData: {},
      diag1: { count: 0, sum: 0 },
      diag2: { count: 0, sum: 0 },
      count: 0,
      over: false,
    };
    socket.emit("created game", counter);
    counter++;
  });
  socket.on("join game", (id) => {
    if (gameId[id] && !gameId[id].over) {
      gameId[id] = {
        ...gameId[id],
        player2: socket,
      };

      gameId[id].player1.emit("prepare game", {
        game: gameId[id].game,
        mark: "⭕",
        turn: gameId[id].turn,
        player: "player1",
      });
      gameId[id].player2.emit("prepare game", {
        game: gameId[id].game,
        mark: "✖️",
        turn: gameId[id].turn,
        player: "player2",
      });
    } else console.log("Game doesn't exist");
  });

  socket.on("update game", (data) => {
    if (
      !gameId[data.id].game.board[data.index] &&
      gameId[data.id].turn === data.player
    ) {
      gameId[data.id].game.board[data.index] = data.mark;
      gameId[data.id].turn = data.player === "player1" ? "player2" : "player1";
    }
    var number = data.mark === "⭕" ? 0 : 1;
    var status = checkWinner(data.id, data.index, number);
    if (status !== -1) gameId[data.id].over = true;

    gameId[data.id].player1.emit("update board", {
      board: gameId[data.id].game.board,
      turn: gameId[data.id].turn,
      status: status,
    });
    gameId[data.id].player2.emit("update board", {
      board: gameId[data.id].game.board,
      turn: gameId[data.id].turn,
      status: status,
    });
  });
});

http.listen(process.env.PORT || 8080, () => {
  console.log(`listening on ${process.env.PORT || 8080}`);
});

function checkWinner(id, pos, number) {
  var row = parseInt(gameId[id].game.row);
  var col = parseInt(gameId[id].game.col);
  var r = Math.floor(pos / col);
  var c = r * col === 0 ? pos : pos % (r * col);

  // Track and check each row
  if (gameId[id].rowData[r]) {
    gameId[id].rowData[r].count += 1;
    gameId[id].rowData[r].sum += number;
    if (gameId[id].rowData[r].count === row) {
      if (gameId[id].rowData[r].sum === 0) return "Winner: player1";
      if (gameId[id].rowData[r].sum === row) return "Winner: player2";
    }
  } else {
    gameId[id].rowData[r] = {
      count: 1,
      sum: number,
    };
  }

  // Track and check each column
  if (gameId[id].colData[c]) {
    gameId[id].colData[c].count += 1;
    gameId[id].colData[c].sum += number;
    if (gameId[id].colData[c].count === col) {
      if (gameId[id].colData[c].sum === 0) return "Winner: player1";
      if (gameId[id].colData[c].sum === col) return "Winner: player2";
    }
  } else {
    gameId[id].colData[c] = {
      count: 1,
      sum: number,
    };
  }

  //Track and check diag1
  if (r === c) {
    gameId[id].diag1.count += 1;
    gameId[id].diag1.sum += number;
    if (gameId[id].diag1.count - col === 0) {
      if (gameId[id].diag1.sum === 0) return "Winner: player1";
      if (gameId[id].diag1.sum === col) return "Winner: player2";
    }
  }

  //Track and check diag2
  if (r + c === row - 1) {
    gameId[id].diag2.count += 1;
    gameId[id].diag2.sum += number;
    if (gameId[id].diag2.count === col) {
      if (gameId[id].diag2.sum === 0) return "Winner: player1";
      if (gameId[id].diag2.sum === col) return "Winner: player2";
    }
  }

  //Check Draw
  gameId[id].count += 1;
  if (gameId[id].count === row * col) {
    gameId[id].over = true;
    return "Draw";
  }

  return -1;
}
