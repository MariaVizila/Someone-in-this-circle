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

const promptText =
  document.getElementById(
    "promptText"
  );

const guessPlayers =
  document.getElementById(
    "guessPlayers"
  );

const guessMessage =
  document.getElementById(
    "guessMessage"
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
   GAME STATE
========================= */

let currentMatch = null;
let currentPlayers = [];
let currentUser = null;
let activePrompt = null;


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


    const user =
      data.currentUser;


    currentMatch =
      match;

    currentPlayers =
      players;

    currentUser =
      user;


    /* =========================
       MATCH NAME
    ========================= */

    gameMatchName.textContent =
      match.match_name ||
      "Someone in this Circle";


    /* =========================
       TIMER
    ========================= */

    updateGameTimer(match);


    /* =========================
       MATCH ENDED
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


    /* =========================
       MATCH NOT STARTED
    ========================= */

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
       CHECK ACTIVE PROMPT
    ========================= */

    const promptResponse =
      await fetch(
        `/api/matches/${encodeURIComponent(matchCode)}/prompt`
      );


    let promptData = null;


    if (promptResponse.ok) {

      promptData =
        await promptResponse.json();

    }


    activePrompt =
      promptData &&
      promptData.prompt
        ? promptData.prompt
        : null;


    /* =========================
       ACTIVE PROMPT EXISTS
    ========================= */

    if (activePrompt) {

      const isPromptAuthor =
        currentUser &&
        Number(currentUser.id) ===
          Number(activePrompt.author_id);


      if (isPromptAuthor) {

        showPromptWaiting();

      } else {

        showGuessArea(
          activePrompt,
          players
        );

      }


      renderScoreboard(players);

      return;

    }


    /* =========================
       YOUR TURN
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

    }


    /* =========================
       SOMEONE ELSE'S TURN
    ========================= */

    else {

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
   GAME TIMER
========================= */

function updateGameTimer(match) {

  if (!match.started_at) {

    gameTimer.textContent =
      "--:--";

    return;

  }


  const startedAt =
    new Date(match.started_at).getTime();


  const duration =
    Number(match.time_limit) *
    60 *
    1000;


  const endTime =
    startedAt + duration;


  const remaining =
    Math.max(
      0,
      endTime - Date.now()
    );


  const totalSeconds =
    Math.floor(
      remaining / 1000
    );


  const minutes =
    Math.floor(
      totalSeconds / 60
    );


  const seconds =
    totalSeconds % 60;


  gameTimer.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


  if (remaining <= 0) {

    gameTimer.textContent =
      "00:00";

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
   SHOW PROMPT WAITING
========================= */

function showPromptWaiting() {

  turnStatus.innerHTML = `
    <h2>
      Waiting for guesses
    </h2>

    <p>
      Other players are guessing your statement.
    </p>
  `;


  activePlayerArea.style.display =
    "none";


  waitingArea.style.display =
    "block";


  guessArea.style.display =
    "none";

}


/* =========================
   SHOW GUESS AREA
========================= */

function showGuessArea(
  prompt,
  players
) {

  turnStatus.innerHTML = `
    <h2>
      Make Your Guess
    </h2>

    <p>
      Someone in this circle...
    </p>
  `;


  activePlayerArea.style.display =
    "none";


  waitingArea.style.display =
    "none";


  guessArea.style.display =
    "block";


  promptText.textContent =
    `Someone in this circle ${prompt.prompt_text}`;


  guessMessage.textContent =
    "";


  renderGuessPlayers(
    players
  );

}


/* =========================
   RENDER GUESS PLAYERS
========================= */

function renderGuessPlayers(players) {

  guessPlayers.innerHTML = "";


  players.forEach(player => {

    const button =
      document.createElement("button");


    button.type =
      "button";


    button.className =
      "secondary-button";


    button.textContent =
      player.display_name ||
      player.username;


    button.addEventListener(
      "click",
      () => {

        submitGuess(
          player.user_id
        );

      }
    );


    guessPlayers.appendChild(
      button
    );

  });

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


    try {

      submitPromptButton.disabled =
        true;


      submitPromptButton.textContent =
        "Submitting...";


      const response =
        await fetch(
          `/api/matches/${encodeURIComponent(matchCode)}/prompt`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              prompt,
              targetId:
                Number(targetId)
            })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        gameMessage.textContent =
          data.error ||
          "Could not submit your prompt.";

        return;

      }


      promptInput.value =
        "";

      targetPlayer.value =
        "";


      gameMessage.textContent =
        "Prompt submitted!";


      await loadGame();


    } catch (error) {

      console.error(
        "Submit prompt error:",
        error
      );


      gameMessage.textContent =
        "Could not connect to the server.";

    } finally {

      submitPromptButton.disabled =
        false;

      submitPromptButton.textContent =
        "Submit";

    }

  }
);


/* =========================
   SUBMIT GUESS
========================= */

async function submitGuess(
  guessedUserId
) {

  if (!activePrompt) {

    return;

  }


  try {

    const buttons =
      guessPlayers.querySelectorAll(
        "button"
      );


    buttons.forEach(button => {

      button.disabled =
        true;

    });


    guessMessage.textContent =
      "Submitting guess...";


    const response =
      await fetch(
        `/api/matches/${encodeURIComponent(matchCode)}/guess`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            guessedUserId:
              Number(guessedUserId)
          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      guessMessage.textContent =
        data.error ||
        "Could not submit your guess.";

      buttons.forEach(button => {

        button.disabled =
          false;

      });

      return;

    }


    if (data.correct) {

      guessMessage.textContent =
        "CORRECT!";

    } else {

      guessMessage.textContent =
        "INCORRECT";

    }


    await loadGame();


  } catch (error) {

    console.error(
      "Submit guess error:",
      error
    );


    guessMessage.textContent =
      "Could not connect to the server.";

  }

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


      row.appendChild(
        position
      );


      row.appendChild(
        name
      );


      row.appendChild(
        score
      );


      scoreboard.appendChild(
        row
      );

    }
  );

}


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


/* =========================
   TIMER REFRESH
========================= */

setInterval(
  () => {

    if (currentMatch) {

      updateGameTimer(
        currentMatch
      );

    }

  },
  1000
);
