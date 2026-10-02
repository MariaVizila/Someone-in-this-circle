async function loadDashboard() {
  try {
    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      window.location.href = "index.html";
      return;
    }

    const user = await response.json();

    document.getElementById("displayName").textContent =
      user.display_name;

    await loadFriends();
  } catch (error) {
    console.error(error);
    window.location.href = "index.html";
  }
}


/* =========================
   FRIENDS
========================= */

async function loadFriends() {
  try {
    const response = await fetch("/api/friends");

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    renderFriendRequests(data.requests || []);
    renderSentRequests(data.sent || []);
    renderFriends(data.friends || []);
  } catch (error) {
    console.error("Could not load friends:", error);
  }
}


/* =========================
   INCOMING REQUESTS
========================= */

function renderFriendRequests(requests) {
  const container =
    document.getElementById("friendRequests");

  if (!container) return;

  container.innerHTML = "";

  if (requests.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No pending friend requests.";
    container.appendChild(message);
    return;
  }

  requests.forEach((request) => {
    const item = document.createElement("div");
    item.className = "friend-item";

    const name = document.createElement("span");
    name.textContent =
      `${request.display_name} (@${request.username})`;

    const actions = document.createElement("div");

    const acceptButton = document.createElement("button");
    acceptButton.textContent = "Accept";
    acceptButton.className = "friend-action accept";

    acceptButton.addEventListener("click", async () => {
      await handleFriendRequest(
        request.id,
        "accept"
      );
    });

    const declineButton = document.createElement("button");
    declineButton.textContent = "Decline";
    declineButton.className = "friend-action decline";

    declineButton.addEventListener("click", async () => {
      await handleFriendRequest(
        request.id,
        "decline"
      );
    });

    actions.appendChild(acceptButton);
    actions.appendChild(declineButton);

    item.appendChild(name);
    item.appendChild(actions);

    container.appendChild(item);
  });
}


/* =========================
   ACCEPT / DECLINE
========================= */

async function handleFriendRequest(requestId, action) {
  try {
    const response = await fetch(
      `/api/friends/request/${requestId}/${action}`,
      {
        method: "POST"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Something went wrong.");
      return;
    }

    await loadFriends();
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
}


/* =========================
   SENT REQUESTS
========================= */

function renderSentRequests(requests) {
  const container =
    document.getElementById("sentRequests");

  if (!container) return;

  container.innerHTML = "";

  if (requests.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No sent friend requests.";
    container.appendChild(message);
    return;
  }

  requests.forEach((request) => {
    const item = document.createElement("div");
    item.className = "friend-item";

    const name = document.createElement("span");
    name.textContent =
      `${request.display_name} (@${request.username})`;

    const status = document.createElement("span");
    status.textContent = "Pending";
    status.className = "friend-status";

    item.appendChild(name);
    item.appendChild(status);

    container.appendChild(item);
  });
}


/* =========================
   FRIEND LIST
========================= */

function renderFriends(friends) {
  const container =
    document.getElementById("friendsList");

  if (!container) return;

  container.innerHTML = "";

  if (friends.length === 0) {
    const message = document.createElement("p");
    message.textContent = "You don't have any friends yet.";
    container.appendChild(message);
    return;
  }

  friends.forEach((friend) => {
    const item = document.createElement("div");
    item.className = "friend-item";

    const name = document.createElement("span");
    name.textContent =
      `${friend.display_name} (@${friend.username})`;

    const status = document.createElement("span");
    status.textContent = "Friends";
    status.className = "friend-status";

    item.appendChild(name);
    item.appendChild(status);

    container.appendChild(item);
  });
}


/* =========================
   SEND FRIEND REQUEST
========================= */

const friendRequestForm =
  document.getElementById("friendRequestForm");

if (friendRequestForm) {
  friendRequestForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const input =
        document.getElementById("friendUsername");

      const message =
        document.getElementById("friendMessage");

      const username = input.value.trim();

      if (!username) {
        message.textContent =
          "Please enter a username.";
        return;
      }

      message.textContent =
        "Sending friend request...";

      try {
        const response = await fetch(
          "/api/friends/request",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              username: username
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          message.textContent =
            data.error || "Something went wrong.";
          return;
        }

        message.textContent =
          "Friend request sent!";

        input.value = "";

        await loadFriends();
      } catch (error) {
        console.error(error);

        message.textContent =
          "Something went wrong. Please try again.";
      }
    }
  );
}


/* =========================
   LOG OUT
========================= */

const logoutButton =
  document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST"
        });
      } catch (error) {
        console.error(error);
      }

      window.location.href = "index.html";
    }
  );
}


/* =========================
   START
========================= */

loadDashboard();
