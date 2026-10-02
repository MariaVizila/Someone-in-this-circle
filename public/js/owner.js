/* =========================
   OWNER PANEL
========================= */

let selectedUser = null;


/* =========================
   ELEMENTS
========================= */

const usernameSearch =
  document.getElementById(
    "usernameSearch"
  );

const searchUserButton =
  document.getElementById(
    "searchUserButton"
  );

const ownerMessage =
  document.getElementById(
    "ownerMessage"
  );

const userResult =
  document.getElementById(
    "userResult"
  );

const ownerAvatar =
  document.getElementById(
    "ownerAvatar"
  );

const ownerDisplayName =
  document.getElementById(
    "ownerDisplayName"
  );

const ownerUsername =
  document.getElementById(
    "ownerUsername"
  );

const ownerBio =
  document.getElementById(
    "ownerBio"
  );

const ownerStatus =
  document.getElementById(
    "ownerStatus"
  );

const ownerPronouns =
  document.getElementById(
    "ownerPronouns"
  );

const ownerCurrentRole =
  document.getElementById(
    "ownerCurrentRole"
  );

const roleSelect =
  document.getElementById(
    "roleSelect"
  );

const saveRoleButton =
  document.getElementById(
    "saveRoleButton"
  );

const backButton =
  document.getElementById(
    "backButton"
  );


/* =========================
   CHECK OWNER ACCESS
========================= */

async function checkOwnerAccess() {

  try {

    const response =
      await fetch(
        "/api/auth/me"
      );


    if (!response.ok) {

      window.location.href =
        "index.html";

      return;

    }


    const user =
      await response.json();


    if (
      user.username.toLowerCase() !==
        "miyowa" ||
      user.role !== "owner"
    ) {

      alert(
        "Owner access required."
      );

      window.location.href =
        "dashboard.html";

      return;

    }


  } catch (error) {

    console.error(
      "Owner access error:",
      error
    );

    window.location.href =
      "index.html";

  }

}


/* =========================
   SEARCH USER
========================= */

async function searchUser() {

  const username =
    usernameSearch.value.trim();


  if (!username) {

    ownerMessage.textContent =
      "Please enter a username.";

    userResult.style.display =
      "none";

    return;

  }


  ownerMessage.textContent =
    "Searching...";


  try {

    const response =
      await fetch(
        `/api/owner/users?username=${encodeURIComponent(username)}`
      );


    const data =
      await response.json();


    if (!response.ok) {

      ownerMessage.textContent =
        data.error ||
        "User not found.";

      userResult.style.display =
        "none";

      selectedUser = null;

      return;

    }


    selectedUser = data;


    displayUser(data);


    ownerMessage.textContent =
      "";

  } catch (error) {

    console.error(
      "User search error:",
      error
    );

    ownerMessage.textContent =
      "Could not search for user.";

    userResult.style.display =
      "none";

    selectedUser = null;

  }

}


/* =========================
   DISPLAY USER
========================= */

function displayUser(user) {

  userResult.style.display =
    "block";


  ownerDisplayName.textContent =
    user.display_name;


  ownerUsername.textContent =
    "@" + user.username;


  ownerBio.textContent =
    user.bio || "—";


  ownerStatus.textContent =
    user.status || "—";


  ownerPronouns.textContent =
    user.pronouns || "—";


  ownerCurrentRole.textContent =
    formatRole(user.role);


  roleSelect.value =
    user.role;


  /* PROFILE PICTURE */

  ownerAvatar.innerHTML =
    "";


  if (user.profile_picture) {

    const image =
      document.createElement(
        "img"
      );

    image.src =
      user.profile_picture;

    image.alt =
      user.display_name +
      "'s profile picture";


    image.onerror = () => {

      ownerAvatar.innerHTML =
        "";

      createInitial(
        user.display_name
      );

    };


    ownerAvatar.appendChild(
      image
    );

  } else {

    createInitial(
      user.display_name
    );

  }

}


/* =========================
   CREATE INITIAL
========================= */

function createInitial(
  displayName
) {

  ownerAvatar.textContent =
    displayName
      .charAt(0)
      .toUpperCase();

}


/* =========================
   FORMAT ROLE
========================= */

function formatRole(role) {

  if (role === "owner") {
    return "Owner 👑";
  }

  if (role === "admin") {
    return "Administrator 🔴";
  }

  if (role === "mod") {
    return "Moderator 🔵";
  }

  return "User";

}


/* =========================
   SAVE ROLE
========================= */

async function saveRole() {

  if (!selectedUser) {

    ownerMessage.textContent =
      "Search for a user first.";

    return;

  }


  const newRole =
    roleSelect.value;


  saveRoleButton.disabled =
    true;

  saveRoleButton.textContent =
    "Saving...";


  try {

    const response =
      await fetch(
        `/api/owner/users/${selectedUser.id}/role`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            role: newRole
          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      ownerMessage.textContent =
        data.error ||
        "Could not update rank.";

      return;

    }


    selectedUser =
      data;


    ownerCurrentRole.textContent =
      formatRole(data.role);


    roleSelect.value =
      data.role;


    ownerMessage.textContent =
      "Rank updated successfully.";

  } catch (error) {

    console.error(
      "Role update error:",
      error
    );

    ownerMessage.textContent =
      "Could not update rank.";

  } finally {

    saveRoleButton.disabled =
      false;

    saveRoleButton.textContent =
      "Save Changes";

  }

}


/* =========================
   EVENT LISTENERS
========================= */

searchUserButton.addEventListener(
  "click",
  searchUser
);


usernameSearch.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Enter"
    ) {

      searchUser();

    }

  }
);


saveRoleButton.addEventListener(
  "click",
  saveRole
);


backButton.addEventListener(
  "click",
  () => {

    window.location.href =
      "dashboard.html";

  }
);


/* =========================
   START
========================= */

checkOwnerAccess();
