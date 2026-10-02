/* =========================
   OWNER PANEL
========================= */

const ownerPanelLink =
  document.getElementById(
    "ownerPanelLink"
  );


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {

  try {

    const response =
      await fetch("/api/auth/me");


    if (!response.ok) {

      window.location.href =
        "index.html";

      return;
    }


    const user =
      await response.json();


    /* OWNER PANEL */

    if (
      ownerPanelLink &&
      user.username.toLowerCase() ===
        "miyowa" &&
      user.role === "owner"
    ) {

      ownerPanelLink.style.display =
        "inline-block";

    }


    document.getElementById(
      "displayName"
    ).textContent =
      user.display_name;


    await loadFriends();


  } catch (error) {

    console.error(error);

    window.location.href =
      "index.html";

  }

}


/* =========================
   FRIENDS
========================= */

async function loadFriends() {

  try {

    const response =
      await fetch("/api/friends");


    if (!response.ok) {
      return;
    }


    const data =
      await response.json();


    renderFriendRequests(
      data.requests || []
    );


    renderSentRequests(
      data.sent || []
    );


    renderFriends(
      data.friends || []
    );


    updateFriendCounts(
      data.requests || [],
      data.sent || [],
      data.friends || []
    );


  } catch (error) {

    console.error(
      "Could not load friends:",
      error
    );

  }

}


/* =========================
   COUNTS
========================= */

function updateFriendCounts(
  requests,
  sent,
  friends
) {

  const friendCount =
    document.getElementById(
      "friendCount"
    );


  const requestCount =
    document.getElementById(
      "requestCount"
    );


  const sentCount =
    document.getElementById(
      "sentCount"
    );


  if (friendCount) {

    friendCount.textContent =
      `${friends.length} ${
        friends.length === 1
          ? "Friend"
          : "Friends"
      }`;

  }


  if (requestCount) {

    requestCount.textContent =
      requests.length;

  }


  if (sentCount) {

    sentCount.textContent =
      sent.length;

  }

}


/* =========================
   AVATAR
========================= */

function createAvatar(
  displayName,
  profilePicture
) {

  const avatar =
    document.createElement(
      "div"
    );


  avatar.className =
    "friend-avatar";


  /* PROFILE PICTURE */

  if (profilePicture) {

    const image =
      document.createElement(
        "img"
      );


    image.src =
      profilePicture;


    image.alt =
      displayName +
      "'s profile picture";


    image.onerror =
      () => {

        image.remove();

        createInitials(
          avatar,
          displayName
        );

      };


    avatar.appendChild(
      image
    );


    return avatar;

  }


  /* INITIALS */

  createInitials(
    avatar,
    displayName
  );


  return avatar;

}


/* =========================
   AVATAR INITIALS
========================= */

function createInitials(
  avatar,
  displayName
) {

  const name =
    displayName || "?";


  const words =
    name
      .trim()
      .split(/\s+/);


  let initials =
    "";


  if (words.length >= 2) {

    initials =
      words[0][0] +
      words[1][0];

  } else {

    initials =
      words[0].slice(0, 2);

  }


  avatar.textContent =
    initials.toUpperCase();

}


/* =========================
   FRIEND INFORMATION
========================= */

function createFriendInfo(
  displayName,
  username
) {

  const info =
    document.createElement(
      "div"
    );


  info.className =
    "friend-info";


  const name =
    document.createElement(
      "div"
    );


  name.className =
    "friend-name";


  name.textContent =
    displayName;


  const user =
    document.createElement(
      "div"
    );


  user.className =
    "friend-username";


  user.textContent =
    `@${username}`;


  info.appendChild(
    name
  );


  info.appendChild(
    user
  );


  return info;

}


/* =========================
   EMPTY STATE
========================= */

function createEmptyState(text) {

  const empty =
    document.createElement(
      "div"
    );


  empty.className =
    "friend-empty";


  empty.textContent =
    text;


  return empty;

}


/* =========================
   OPEN PROFILE
========================= */

function openProfile(
  userId
) {

  if (!userId) {
    return;
  }


  window.location.href =
    `view-profile.html?id=${userId}`;

}


/* =========================
   INCOMING REQUESTS
========================= */

function renderFriendRequests(
  requests
) {

  const container =
    document.getElementById(
      "friendRequests"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  if (requests.length === 0) {

    container.appendChild(
      createEmptyState(
        "No new friend requests."
      )
    );


    return;

  }


  requests.forEach(
    (request) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "friend-item";


      item.appendChild(
        createAvatar(
          request.display_name,
          request.profile_picture
        )
      );


      item.appendChild(
        createFriendInfo(
          request.display_name,
          request.username
        )
      );


      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "friend-actions";


      const acceptButton =
        document.createElement(
          "button"
        );


      acceptButton.textContent =
        "Accept";


      acceptButton.className =
        "friend-action accept";


      acceptButton.addEventListener(
        "click",
        async () => {

          await handleFriendRequest(
            request.id,
            "accept"
          );

        }
      );


      const declineButton =
        document.createElement(
          "button"
        );


      declineButton.textContent =
        "Decline";


      declineButton.className =
        "friend-action decline";


      declineButton.addEventListener(
        "click",
        async () => {

          await handleFriendRequest(
            request.id,
            "decline"
          );

        }
      );


      actions.appendChild(
        acceptButton
      );


      actions.appendChild(
        declineButton
      );


      item.appendChild(
        actions
      );


      container.appendChild(
        item
      );

    }
  );

}


/* =========================
   ACCEPT / DECLINE
========================= */

async function handleFriendRequest(
  requestId,
  action
) {

  try {

    const response =
      await fetch(
        `/api/friends/request/${requestId}/${action}`,
        {
          method: "POST"
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.error ||
        "Something went wrong."
      );


      return;

    }


    await loadFriends();


  } catch (error) {

    console.error(error);


    alert(
      "Something went wrong."
    );

  }

}


/* =========================
   SENT REQUESTS
========================= */

function renderSentRequests(
  requests
) {

  const container =
    document.getElementById(
      "sentRequests"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  if (requests.length === 0) {

    container.appendChild(
      createEmptyState(
        "No pending sent requests."
      )
    );


    return;

  }


  requests.forEach(
    (request) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "friend-item";


      item.appendChild(
        createAvatar(
          request.display_name,
          request.profile_picture
        )
      );


      item.appendChild(
        createFriendInfo(
          request.display_name,
          request.username
        )
      );


      const status =
        document.createElement(
          "span"
        );


      status.className =
        "friend-status";


      status.textContent =
        "Pending";


      item.appendChild(
        status
      );


      container.appendChild(
        item
      );

    }
  );

}


/* =========================
   FRIEND LIST
========================= */

function renderFriends(
  friends
) {

  const container =
    document.getElementById(
      "friendsList"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  if (friends.length === 0) {

    container.appendChild(
      createEmptyState(
        "Your circle is empty for now. Add someone above to get started!"
      )
    );


    return;

  }


  friends.forEach(
    (friend) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "friend-card";


      /* CLICKABLE PROFILE */

      if (friend.user_id) {

        card.style.cursor =
          "pointer";


        card.addEventListener(
          "click",
          () => {

            openProfile(
              friend.user_id
            );

          }
        );

      }


      /* PROFILE PICTURE */

      card.appendChild(
        createAvatar(
          friend.display_name,
          friend.profile_picture
        )
      );


      /* NAME + USERNAME */

      card.appendChild(
        createFriendInfo(
          friend.display_name,
          friend.username
        )
      );


      container.appendChild(
        card
      );

    }
  );

}


/* =========================
   SEND FRIEND REQUEST
========================= */

const friendRequestForm =
  document.getElementById(
    "friendRequestForm"
  );


if (friendRequestForm) {

  friendRequestForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const input =
        document.getElementById(
          "friendUsername"
        );


      const message =
        document.getElementById(
          "friendMessage"
        );


      const username =
        input.value.trim();


      if (!username) {

        message.textContent =
          "Please enter a username.";


        return;

      }


      message.textContent =
        "Sending friend request...";


      try {

        const response =
          await fetch(
            "/api/friends/request",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                username:
                  username
              })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          message.textContent =
            data.error ||
            "Something went wrong.";


          return;

        }


        message.textContent =
          "Friend request sent!";


        input.value =
          "";


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
  document.getElementById(
    "logoutButton"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        await fetch(
          "/api/auth/logout",
          {
            method: "POST"
          }
        );


      } catch (error) {

        console.error(error);

      }


      window.location.href =
        "index.html";

    }
  );

}


/* =========================
   START
========================= */

loadDashboard();
