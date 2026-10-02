async function loadViewedProfile() {

  try {

    /* GET USER ID FROM URL */

    const params =
      new URLSearchParams(
        window.location.search
      );

    const userId =
      params.get("id");


    if (!userId) {

      document.getElementById(
        "profileName"
      ).textContent =
        "Profile not found";

      return;
    }


    /* GET PROFILE */

    const response =
      await fetch(
        "/api/users/" + userId
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Could not load profile."
      );
    }


    /* BASIC PROFILE */

    document.getElementById(
      "profileName"
    ).textContent =
      data.display_name;

    document.getElementById(
      "profileUsername"
    ).textContent =
      "@" + data.username;


    /* AVATAR */

    const avatar =
      document.getElementById(
        "avatar"
      );


    if (data.profile_picture) {

      avatar.innerHTML = "";

      const image =
        document.createElement(
          "img"
        );

      image.src =
        data.profile_picture;

      image.alt =
        data.display_name +
        "'s profile picture";

      avatar.appendChild(
        image
      );

    } else {

      avatar.textContent =
        data.display_name
          .charAt(0)
          .toUpperCase();
    }


    /* BIO */

    document.getElementById(
      "profileBio"
    ).textContent =
      data.bio ||
      "No bio yet.";


    /* STATUS */

    document.getElementById(
      "profileStatus"
    ).textContent =
      data.status ||
      "No status set.";


    /* PRONOUNS */

    document.getElementById(
      "profilePronouns"
    ).textContent =
      data.pronouns ||
      "Not specified";


    /* JOINED DATE */

    if (data.created_at) {

      document.getElementById(
        "profileJoined"
      ).textContent =
        new Date(
          data.created_at
        ).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric"
          }
        );

    } else {

      document.getElementById(
        "profileJoined"
      ).textContent =
        "Unknown";
    }


  } catch (error) {

    console.error(
      "Could not load viewed profile:",
      error
    );

    document.getElementById(
      "profileName"
    ).textContent =
      "Could not load profile.";

  }

}


loadViewedProfile();
