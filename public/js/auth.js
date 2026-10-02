const loginForm =
  document.getElementById("loginForm");

const registerForm =
  document.getElementById("registerForm");


async function sendRequest(
  url,
  options
) {

  const response =
    await fetch(url, {

      headers: {
        "Content-Type":
          "application/json"
      },

      ...options
    });

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Something went wrong."
    );
  }

  return data;
}


/* LOGIN */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const username =
        document
          .getElementById("username")
          .value
          .trim();

      const password =
        document
          .getElementById("password")
          .value;

      const message =
        document
          .getElementById("message");

      message.textContent =
        "Signing in...";

      try {

        await sendRequest(
          "/api/auth/login",
          {
            method: "POST",

            body:
              JSON.stringify({
                username,
                password
              })
          }
        );

        window.location.href =
          "dashboard.html";

      } catch (error) {

        message.textContent =
          error.message;
      }

    }
  );
}


/* REGISTER */

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const username =
        document
          .getElementById("username")
          .value
          .trim();

      const displayName =
        document
          .getElementById("displayName")
          .value
          .trim();

      const password =
        document
          .getElementById("password")
          .value;

      const message =
        document
          .getElementById("message");

      message.textContent =
        "Creating account...";

      try {

        await sendRequest(
          "/api/auth/register",
          {
            method: "POST",

            body:
              JSON.stringify({
                username,
                displayName,
                password
              })
          }
        );

        window.location.href =
          "dashboard.html";

      } catch (error) {

        message.textContent =
          error.message;
      }

    }
  );
}
