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
        "displayName"
      )
      .value =
      user.display_name;

    document
      .getElementById(
        "avatar"
      )
      .textContent =
      user.display_name
        .charAt(0)
        .toUpperCase();

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
                  displayName
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

        loadProfile();

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
