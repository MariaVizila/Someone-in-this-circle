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


    /* AVATAR */

    const avatar =
      document.getElementById(
        "avatar"
      );

    if (user.profile_picture) {

      avatar.innerHTML = "";

      const image =
        document.createElement(
          "img"
        );

      image.src =
        user.profile_picture;

      image.alt =
        user.display_name +
        "'s profile picture";

      avatar.appendChild(
        image
      );

    } else {

      avatar.textContent =
        user.display_name
          .charAt(0)
          .toUpperCase();
    }


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

        const friendsData =
          await friendsResponse.json();

        document
          .getElementById(
            "profileFriendCount"
          )
          .textContent =
          friendsData.friends.length;
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


/* PROFILE FORM */

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


      const profilePictureInput =
        document.getElementById(
          "profilePicture"
        );


      const message =
        document
          .getElementById(
            "profileMessage"
          );


      /* CHECK SELECTED IMAGE */

      let selectedImage = null;


      if (
        profilePictureInput &&
        profilePictureInput.files.length > 0
      ) {

        selectedImage =
          profilePictureInput.files[0];


        const allowedTypes = [
          "image/png",
          "image/jpeg",
          "image/webp"
        ];


        if (
          !allowedTypes.includes(
            selectedImage.type
          )
        ) {

          message.textContent =
            "Please select a PNG, JPG, or WebP image.";

          return;
        }


        /* 5 MB LIMIT */

        if (
          selectedImage.size >
          5 * 1024 * 1024
        ) {

          message.textContent =
            "Your profile picture must be 5 MB or smaller.";

          return;
        }


        /* PREVIEW IMAGE */

        const reader =
          new FileReader();


        reader.onload =
          function () {

            const avatar =
              document.getElementById(
                "avatar"
              );


            avatar.innerHTML =
              "";


            const image =
              document.createElement(
                "img"
              );


            image.src =
              reader.result;


            image.alt =
              displayName +
              "'s profile picture";


            avatar.appendChild(
              image
            );

          };


        reader.readAsDataURL(
          selectedImage
        );

      }


      /*
        TEMPORARY STEP

        The image is only previewed right now.
        Permanent image uploading will be
        connected in the next step.
      */


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
          selectedImage
            ? "Profile updated! Image preview applied."
            : "Profile updated!";


        await loadProfile();


        /*
          The preview will disappear after
          loadProfile() because the image has
          not been permanently uploaded yet.

          That is expected for this step.
        */

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
```
