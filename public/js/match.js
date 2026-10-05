/* =========================
   MATCH LOBBY
========================= */

const matchNameElement =
  document.getElementById("matchName");

const matchCodeElement =
  document.getElementById("matchCode");

const matchStatusElement =
  document.getElementById("matchStatus");

const playerListElement =
  document.getElementById("playerList");

const playerCountElement =
  document.getElementById("playerCount");

const hostControls =
  document.getElementById("hostControls");

const startMatchButton =
  document.getElementById("startMatchButton");

const leaveMatchButton =
  document.getElementById("leaveMatchButton");

const lobbyMessage =
  document.getElementById("lobbyMessage");


/* =========================
   GET MATCH CODE
========================= */

const params =
  new URLSearchParams(
    window.location.search
  );

const matchCode =
  params.get("code");


/* =========================
   LOAD MATCH
========================= */

async function loadMatch() {

  try {

    if (!matchCode) {

      lobbyMessage.textContent =
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

      lobbyMessage.textContent =
        data.error ||
        "Could not load the match.";

      return;
    }


    const match =
      data.match;


    /* =========================
       MATCH STARTED
    ========================= */

    if (match.status === "playing") {

      window.location.href =
        `game.html?code=${encodeURIComponent(
          match.match_code
        )}`;

      return;

    }


    matchNameElement.textContent =
      match.match_name ||
      "Match Lobby";


    matchCodeElement.textContent =
      match.match_code;


    matchStatusElement.textContent =
      match.status === "lobby"
        ? "Waiting for players..."
        : "Match in progress";


    const players =
      data.players || [];


    playerCountElement.textContent =
      `${players.length} / ${match.max_players}`;


    renderPlayers(players);


    const currentUser =
      data.currentUser;


    if (
      currentUser &&
      Number(currentUser.id) ===
        Number(match.host_id)
    ) {

      hostControls.style.display =
        "flex";

    } else {

      hostControls.style.display =
        "none";

    }

  } catch (error) {

    console.error(
      "Load match error:",
      error
    );

    lobbyMessage.textContent =
      "Could not connect to the server.";

  }

}


/* =========================
   RENDER PLAYERS
========================= */

function renderPlayers(players) {

  playerListElement.innerHTML = "";


  if (players.length === 0) {

    playerListElement.innerHTML = `
      <div class="empty-players">
        Waiting for players to join...
      </div>
    `;

    return;
  }


  players.forEach(player => {

    const card =
      document.createElement("div");

    card.className =
      "match-player";


    const avatar =
      document.createElement("div");

    avatar.className =
      "match-player-avatar";


    if (player.profile_picture) {

      const image =
        document.createElement("img");

      image.src =
        player.profile_picture;

      image.alt =
        player.display_name ||
        player.username;

      avatar.appendChild(image);

    } else {

      avatar.textContent =
        (
          player.display_name ||
          player.username ||
          "?"
        )
        .charAt(0)
        .toUpperCase();

    }


    const information =
      document.createElement("div");

    information.className =
      "match-player-info";


    const name =
      document.createElement("strong");

    name.textContent =
      player.display_name ||
      player.username;


    const username =
      document.createElement("span");

    username.textContent =
      `@${player.username}`;


    information.appendChild(name);
    information.appendChild(username);


    if (player.is_host) {

      const host =
        document.createElement("span");

      host.className =
        "match-host-label";

      host.textContent =
        "HOST";

      information.appendChild(host);

    }


    if (
      player.role &&
      player.role !== "user"
    ) {

      const roleBadge =
        document.createElement("span");

      roleBadge.className =
        "match-role-label";

      roleBadge.textContent =
        player.role.toUpperCase();

      information.appendChild(roleBadge);

    }


    card.appendChild(avatar);
    card.appendChild(information);


    playerListElement.appendChild(card);

  });

}


/* =========================
   START MATCH
========================= */

startMatchButton.addEventListener(
  "click",
  async () => {

    try {

      startMatchButton.disabled =
        true;

      startMatchButton.textContent =
        "Starting...";


      const response =
        await fetch(
          `/api/matches/${encodeURIComponent(matchCode)}/start`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        lobbyMessage.textContent =
          data.error ||
          "Could not start the match.";

        startMatchButton.disabled =
          false;

        startMatchButton.textContent =
          "Start Match";

        return;
      }


      window.location.href =
        `game.html?code=${encodeURIComponent(matchCode)}`;

    } catch (error) {

      console.error(
        "Start match error:",
        error
      );

      lobbyMessage.textContent =
        "Could not connect to the server.";

      startMatchButton.disabled =
        false;

      startMatchButton.textContent =
        "Start Match";

    }

  }
);


/* =========================
   LEAVE MATCH
========================= */

leaveMatchButton.addEventListener(
  "click",
  async () => {

    try {

      leaveMatchButton.disabled =
        true;

      leaveMatchButton.textContent =
        "Leaving...";


      const response =
        await fetch(
          `/api/matches/${encodeURIComponent(matchCode)}/leave`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        lobbyMessage.textContent =
          data.error ||
          "Could not leave the match.";

        leaveMatchButton.disabled =
          false;

        leaveMatchButton.textContent =
          "Leave Match";

        return;

      }


      window.location.href =
        "dashboard.html";


    } catch (error) {

      console.error(
        "Leave match error:",
        error
      );


      lobbyMessage.textContent =
        "Could not connect to the server.";


      leaveMatchButton.disabled =
        false;

      leaveMatchButton.textContent =
        "Leave Match";

    }

  }
);


/* =========================
   INITIAL LOAD
========================= */

loadMatch();


/* =========================
   REFRESH LOBBY
========================= */

setInterval(
  loadMatch,
  3000
);
