async function loadDashboard() {

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
        "displayName"
      )
      .textContent =
      user.display_name;

  } catch (error) {

    console.error(error);

    window.location.href =
      "index.html";
  }
}


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


loadDashboard();
