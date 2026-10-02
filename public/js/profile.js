async function loadProfile() {
  try {
    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      window.location.href = "index.html";
      return;
    }

    const user = await response.json();

    document.getElementById("profileName").textContent =
      user.display_name;

    document.getElementById("profileUsername").textContent =
      "@" + user.username;

    const avatar = document.getElementById("avatar");

    if (user.profile_picture) {
      avatar.innerHTML = "";

      const image = document.createElement("img");
      image.src = user.profile_picture;
      image.alt = user.display_name + "'s profile picture";

      avatar.appendChild(image);
    } else {
      avatar.textContent =
        user.display_name.charAt(0).toUpperCase();
    }

    document.getElementById("profileBio").textContent =
      user.bio || "No bio yet.";

    document.getElementById("profileStatus").textContent =
      user.status || "No status set.";

    document.getElementById("profilePronouns").textContent =
      user.pronouns || "Not specified";

    if (user.created_at) {
      document.getElementById("profileJoined").textContent =
        new Date(user.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
    }

    document.getElementById("displayName").value =
      user.display_name || "";

    document.getElementById("bio").value =
      user.bio || "";

    document.getElementById("status").value =
      user.status || "";

    document.getElementById("pronouns").value =
      user.pronouns || "";

    try {
      const friendsResponse = await fetch("/api/friends");

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();

        document.getElementById("profileFriendCount").textContent =
          friendsData.friends.length;
      }
    } catch (error) {
      console.error("Could not load friends:", error);
    }

  } catch (error) {
    console.error("Could not load profile:", error);
  }
}


const profileForm = document.getElementById("profileForm");

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message =
      document.getElementById("profileMessage");

    const displayName =
      document.getElementById("displayName").value.trim();

    const bio =
      document.getElementById("bio").value.trim();

    const status =
      document.getElementById("status").value.trim();

    const pronouns =
      document.getElementById("pronouns").value.trim();

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          displayName,
          bio,
          status,
          pronouns,
          profilePicture: ""
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not update profile."
        );
      }

      message.textContent = "Profile updated!";

      await loadProfile();

    } catch (error) {
      console.error("Profile update error:", error);

      message.textContent = error.message;
    }
  });
}


const passwordForm =
  document.getElementById("passwordForm");

if (passwordForm) {
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message =
      document.getElementById("passwordMessage");

    const currentPassword =
      document.getElementById("currentPassword").value;

    const newPassword =
      document.getElementById("newPassword").value;

    try {
      const response = await fetch(
        "/api/profile/password",
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not change password."
        );
      }

      message.textContent = "Password updated!";

      passwordForm.reset();

    } catch (error) {
      console.error(
        "Password update error:",
        error
      );

      message.textContent = error.message;
    }
  });
}


const logoutButton =
  document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      window.location.href = "index.html";
    }
  });
}


loadProfile();
