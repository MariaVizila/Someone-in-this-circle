const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const {
  pool,
  initializeDatabase
} = require("./database");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "change-this-secret-before-production",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(
  express.static(
    path.join(__dirname, "..", "public")
  )
);


/* REGISTER */

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      username,
      password,
      displayName
    } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).json({
        error: "Please fill in every field."
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        error:
          "Username must be between 3 and 20 characters."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error:
          "Password must be at least 6 characters."
      });
    }

    if (displayName.trim().length < 1) {
      return res.status(400).json({
        error: "Display name cannot be empty."
      });
    }

    if (displayName.trim().length > 30) {
      return res.status(400).json({
        error:
          "Display name must be 30 characters or fewer."
      });
    }

    const existingUser =
      await pool.query(
        "SELECT id FROM users WHERE username = $1",
        [username]
      );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error:
          "That username is already taken."
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const result =
      await pool.query(
        `
        INSERT INTO users
        (username, password_hash, display_name)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [
          username,
          passwordHash,
          displayName.trim()
        ]
      );

    req.session.userId =
      result.rows[0].id;

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Something went wrong while creating your account."
    });
  }
});


/* LOGIN */

app.post("/api/auth/login", async (req, res) => {
  try {

    const {
      username,
      password
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error:
          "Enter your username and password."
      });
    }

    const result =
      await pool.query(
        `
        SELECT *
        FROM users
        WHERE username = $1
        `,
        [username]
      );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error:
          "Incorrect username or password."
      });
    }

    const user =
      result.rows[0];

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        error:
          "Incorrect username or password."
      });
    }

    req.session.userId =
      user.id;

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Something went wrong while logging in."
    });
  }
});


/* CURRENT USER */

app.get("/api/auth/me", async (req, res) => {

  if (!req.session.userId) {
    return res.status(401).json({
      error: "Not logged in."
    });
  }

  try {

    const result =
      await pool.query(
        `
        SELECT
          id,
          username,
          display_name,
          created_at
        FROM users
        WHERE id = $1
        `,
        [req.session.userId]
      );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "User not found."
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Something went wrong."
    });
  }
});


/* UPDATE PROFILE */

app.patch("/api/profile", async (req, res) => {

  if (!req.session.userId) {
    return res.status(401).json({
      error: "Not logged in."
    });
  }

  const {
    displayName
  } = req.body;

  if (
    !displayName ||
    displayName.trim().length < 1
  ) {
    return res.status(400).json({
      error:
        "Display name cannot be empty."
    });
  }

  if (displayName.trim().length > 30) {
    return res.status(400).json({
      error:
        "Display name must be 30 characters or fewer."
    });
  }

  try {

    await pool.query(
      `
      UPDATE users
      SET display_name = $1
      WHERE id = $2
      `,
      [
        displayName.trim(),
        req.session.userId
      ]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Something went wrong."
    });
  }
});


/* CHANGE PASSWORD */

app.patch(
  "/api/profile/password",
  async (req, res) => {

    if (!req.session.userId) {
      return res.status(401).json({
        error: "Not logged in."
      });
    }

    const {
      currentPassword,
      newPassword
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        error:
          "Enter both passwords."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error:
          "New password must be at least 6 characters."
      });
    }

    try {

      const result =
        await pool.query(
          `
          SELECT password_hash
          FROM users
          WHERE id = $1
          `,
          [req.session.userId]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "User not found."
        });
      }

      const matches =
        await bcrypt.compare(
          currentPassword,
          result.rows[0].password_hash
        );

      if (!matches) {
        return res.status(401).json({
          error:
            "Current password is incorrect."
        });
      }

      const newHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      await pool.query(
        `
        UPDATE users
        SET password_hash = $1
        WHERE id = $2
        `,
        [
          newHash,
          req.session.userId
        ]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Something went wrong."
      });
    }
  }
);


/* LOGOUT */

app.post(
  "/api/auth/logout",
  (req, res) => {

    req.session.destroy(() => {

      res.json({
        success: true
      });

    });
  }
);


/* START */

initializeDatabase()
  .then(() => {

    app.listen(PORT, () => {

      console.log(
        `Someone in this Circle is running on port ${PORT}`
      );

    });

  })
  .catch((error) => {

    console.error(
      "Database initialization failed:",
      error
    );

  });


module.exports = app;
