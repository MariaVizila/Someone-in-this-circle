/* =========================
   SIC GAME
========================= */

const params =
  new URLSearchParams(
    window.location.search
  );

const matchCode =
  params.get("code");


/* =========================
   ELEMENTS
========================= */

const gameMatchName =
  document.getElementById(
    "gameMatchName"
  );

const gameTimer =
  document.getElementById(
    "gameTimer"
  );

const turnStatus =
  document.getElementById(
    "turnStatus"
  );

const activePlayerArea =
  document.getElementById(
    "activePlayerArea"
  );

const waitingArea =
  document.getElementById(
    "waitingArea"
  );

const guessArea =
  document.getElementById(
    "guessArea"
  );

const promptInput =
  document.getElementById(
    "promptInput"
  );

const targetPlayer =
  document.getElementById(
    "targetPlayer"
  );

const submitPromptButton =
  document.getElementById(
    "submitPromptButton"
  );

const scoreboard =
  document.getElementById(
    "scoreboard"
  );

const gameMessage =
  document.getElementById(
    "gameMessage"
  );


/* =========================
   LOAD GAME
========================= */

async function loadGame() {

  try {

    if (!matchCode) {

      gameMessage.textContent =
        "No match code was provided.";

      return;

    }


    const response =
      await fetch(
        `/api/matches/${encodeURIComponent(matchCode)}`
      );


    const data =
      await response.json();


    if (!response.ok) {

      gameMessage.textContent =
        data.error ||
        "Could not load the game.";

      return;

    }


    const match =
      data.match;


    const players =
      data.players || [];


    const currentUser =
      data.currentUser;


    /* =========================
       MATCH NAME
    ========================= */

    gameMatchName.textContent =
      match.match_name ||
      "Someone in this Circle";


    /* =========================
       CHECK MATCH STATUS
    ========================= */

    if (match.status === "ended") {

      turnStatus.innerHTML = `
        <h2>
          Match Complete
        </h2>

        <p>
          The match has ended.
        </p>
      `;

      activePlayerArea.style.display =
        "none";

      waitingArea.style.display =
        "none";

      guessArea.style.display =
        "none";

      renderScoreboard(players);

      return;

    }


    if (match.status !== "playing") {

      turnStatus.innerHTML = `
        <h2>
          Waiting for the match
        </h2>

        <p>
          The match has not started yet.
        </p>
      `;

      activePlayerArea.style.display =
        "none";

      waitingArea.style.display =
        "block";

      guessArea.style.display =
        "none";

      renderScoreboard(players);

      return;

    }


    /* =========================
       FIND CURRENT PLAYER
    ========================= */

    const currentPlayer =
      players.find(
        player =>
          Number(player.user_id) ===
          Number(match.current_player_id)
      );


    if (!currentPlayer) {

      gameMessage.textContent =
        "Could not determine the current player.";

      return;

    }


    const isMyTurn =
      currentUser &&
      Number(currentUser.id) ===
        Number(match.current_player_id);


    /* =========================
       TURN DISPLAY
    ========================= */

    if (isMyTurn) {

      turnStatus.innerHTML = `
        <h2>
          Your Turn
        </h2>

        <p>
          Choose a player and write your statement.
        </p>
      `;

      activePlayerArea.style.display =
        "block";

      waitingArea.style.display =
        "none";

      guessArea.style.display =
        "none";


      populateTargetPlayers(
        players,
        currentUser.id
      );

    } else {

      turnStatus.innerHTML = `
        <h2>
          ${escapeHtml(
            currentPlayer.display_name ||
            currentPlayer.username
          )}'s Turn
        </h2>

        <p>
          Wait for your turn.
        </p>
      `;

      activePlayerArea.style.display =
        "none";

      waitingArea.style.display =
        "block";

      guessArea.style.display =
        "none";

    }


    renderScoreboard(players);


  } catch (error) {

    console.error(
      "Load game error:",
      error
    );

    gameMessage.textContent =
      "Could not connect to the server.";

  }

}


/* =========================
   TARGET PLAYERS
========================= */

function populateTargetPlayers(
  players,
  currentUserId
) {

  targetPlayer.innerHTML = `
    <option value="">
      Select a player
    </option>
  `;


  players.forEach(player => {

    if (
      Number(player.user_id) ===
      Number(currentUserId)
    ) {
      return;
    }


    const option =
      document.createElement("option");

    option.value =
      player.user_id;

    option.textContent =
      player.display_name ||
      player.username;

    targetPlayer.appendChild(
      option
    );

  });

}


/* =========================
   SCOREBOARD
========================= */

function renderScoreboard(players) {

  scoreboard.innerHTML = "";


  const sortedPlayers =
    [...players].sort(
      (a, b) =>
        Number(b.score) -
        Number(a.score)
    );


  sortedPlayers.forEach(
    (player, index) => {

      const row =
        document.createElement("div");

      row.className =
        "scoreboard-player";


      const position =
        document.createElement("span");

      position.textContent =
        `#${index + 1}`;


      const name =
        document.createElement("strong");

      name.textContent =
        player.display_name ||
        player.username;


      const score =
        document.createElement("span");

      score.textContent =
        `${player.score} pts`;


      row.appendChild(position);
      row.appendChild(name);
      row.appendChild(score);


      scoreboard.appendChild(row);

    }
  );

}


/* =========================
   SUBMIT PROMPT
========================= */

submitPromptButton.addEventListener(
  "click",
  async () => {

    const prompt =
      promptInput.value.trim();

    const targetId =
      targetPlayer.value;


    gameMessage.textContent =
      "";


    if (!prompt) {

      gameMessage.textContent =
        "Write a statement first.";

      return;

    }


    if (!targetId) {

      gameMessage.textContent =
        "Choose a player first.";

      return;

    }


    gameMessage.textContent =
      "Prompt system isn't connected yet.";

  }
);


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

  const div =
    document.createElement("div");

  div.textContent =
    value;

  return div.innerHTML;

}


/* =========================
   INITIAL LOAD
========================= */

loadGame();


/* =========================
   GAME REFRESH
========================= */

setInterval(
  loadGame,
  3000
);
