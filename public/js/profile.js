async function loadProfile() {

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


    /* BASIC PROFILE */

    document
      .getElementById(
        "profileName"
      )
      .textContent =
      user.display_name;

    document
      .getElementById(
        "profileUsername"
      )
      .textContent =
      "@" + user.username;

    document
      .getElementById(
        "avatar"
      )
      .textContent =
      user.display_name
        .charAt(0)
        .toUpperCase();


    /* PROFILE INFORMATION */

    document
      .getElementById(
        "profileBio"
      )
      .textContent =
      user.bio ||
      "No bio yet.";

    document
      .getElementById(
        "profileStatus"
      )
      .textContent =
      user.status ||
      "No status set.";

    document
      .getElementById(
        "profilePronouns"
      )
      .textContent =
      user.pronouns ||
      "Not specified";


    /* JOINED DATE */

    const joinedDate =
      document.getElementById(
        "profileJoined"
      );

    if (user.created_at) {

      joinedDate.textContent =
        new Date(
          user.created_at
        ).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric"
          }
        );

    } else {

      joinedDate.textContent =
        "Unknown";
    }


    /* EDIT PROFILE FORM */

    document
      .getElementById(
        "displayName"
      )
      .value =
      user.display_name || "";

    document
      .getElementById(
        "bio"
      )
      .value =
      user.bio || "";

    document
      .getElementById(
        "status"
      )
      .value =
      user.status || "";

    document
      .getElementById(
        "pronouns"
      )
      .value =
      user.pronouns || "";


    /* FRIEND COUNT */

    try {

      const friendsResponse =
        await fetch(
          "/api/friends"
        );

      if (friendsResponse.ok) {

        const friends =
          await friendsResponse.json();

        document
          .getElementById(
            "profileFriendCount"
          )
          .textContent =
          friends.length;

      }

    } catch (error) {

      console.error(
        "Could not load friends:",
        error
      );

    }

  } catch (error) {

    console.error(error);

    window.location.href =
      "index.html";
  }
}


/* PROFILE */

const profileForm =
  document.getElementById(
    "profileForm"
  );


if (profileForm) {

  profileForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const displayName =
        document
          .getElementById(
            "displayName"
          )
          .value
          .trim();

      const bio =
        document
          .getElementById(
            "bio"
          )
          .value
          .trim();

      const status =
        document
          .getElementById(
            "status"
          )
          .value
          .trim();

      const pronouns =
        document
          .getElementById(
            "pronouns"
          )
          .value
          .trim();


      const message =
        document
          .getElementById(
            "profileMessage"
          );


      try {

        const response =
          await fetch(
            "/api/profile",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  displayName,
                  bio,
                  status,
                  pronouns
                })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.error
          );
        }


        message.textContent =
          "Profile updated!";


        await loadProfile();


      } catch (error) {

        message.textContent =
          error.message;
      }

    }
  );
}


/* PASSWORD */

const passwordForm =
  document.getElementById(
    "passwordForm"
  );


if (passwordForm) {

  passwordForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const currentPassword =
        document
          .getElementById(
            "currentPassword"
          )
          .value;

      const newPassword =
        document
          .getElementById(
            "newPassword"
          )
          .value;


      const message =
        document
          .getElementById(
            "passwordMessage"
          );


      try {

        const response =
          await fetch(
            "/api/profile/password",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  currentPassword,
                  newPassword
                })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.error
          );
        }


        message.textContent =
          "Password updated!";

        passwordForm.reset();


      } catch (error) {

        message.textContent =
          error.message;
      }

    }
  );
}


/* LOGOUT */

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      await fetch(
        "/api/auth/logout",
        {
          method: "POST"
        }
      );

      window.location.href =
        "index.html";
    }
  );
}


loadProfile();
