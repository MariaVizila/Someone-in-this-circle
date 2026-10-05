const express = require("express");
const session = require("express-session");
const pgSession =
  require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");
const path = require("path");

const {
  pool,
  initializeDatabase
} = require("./database");

const app = express();

app.set("trust proxy", 1);


/* =========================
   LOGIN CHECK
========================= */

function requireLogin(req, res, next) {

  if (!req.session.userId) {

    return res.status(401).json({
      error:
        "You must be logged in."
    });

  }

  next();

}


/* =========================
   OWNER CHECK
========================= */

async function requireOwner(req, res, next) {

  if (!req.session.userId) {

    return res.status(401).json({
      error:
        "You must be logged in."
    });

  }

  try {

    const result =
      await pool.query(
        `
        SELECT
          id,
          username,
          role
        FROM users
        WHERE id = $1
        `,
        [req.session.userId]
      );

    if (result.rows.length === 0) {

      return res.status(401).json({
        error:
          "User not found."
      });

    }

    const user =
      result.rows[0];

    if (
      user.username.toLowerCase() !== "miyowa" ||
      user.role !== "owner"
    ) {

      return res.status(403).json({
        error:
          "Owner access required."
      });

    }

    next();

  } catch (error) {

    console.error(
      "Owner check error:",
      error
    );

    res.status(500).json({
      error:
        "Could not verify owner access."
    });

  }

}


const PORT =
  process.env.PORT || 3000;


app.use(
  express.json()
);


app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true
    }),

    secret:
      process.env.SESSION_SECRET ||
      "change-this-secret-before-production",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge:
        1000 *
        60 *
        60 *
        24 *
        7
    }

  })
);


app.use(
  express.static(
    path.join(
      __dirname,
      "..",
      "public"
    )
  )
);


/* =========================
   REGISTER
========================= */

app.post(
  "/api/auth/register",
  async (req, res) => {

    try {

      const {
        username,
        password,
        displayName
      } = req.body;

      if (
        !username ||
        !password ||
        !displayName
      ) {

        return res.status(400).json({
          error:
            "Please fill in every field."
        });

      }

      if (
        username.length < 3 ||
        username.length > 20
      ) {

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

      if (
        displayName.trim().length < 1
      ) {

        return res.status(400).json({
          error:
            "Display name cannot be empty."
        });

      }

      if (
        displayName.trim().length > 30
      ) {

        return res.status(400).json({
          error:
            "Display name must be 30 characters or fewer."
        });

      }

      const existingUser =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE username = $1
          `,
          [username]
        );

      if (
        existingUser.rows.length > 0
      ) {

        return res.status(409).json({
          error:
            "That username is already taken."
        });

      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await pool.query(
          `
          INSERT INTO users
            (
              username,
              password_hash,
              display_name
            )
          VALUES
            ($1, $2, $3)
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

  }
);


/* =========================
   LOGIN
========================= */

app.post(
  "/api/auth/login",
  async (req, res) => {

    try {

      const {
        username,
        password
      } = req.body;

      if (
        !username ||
        !password
      ) {

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

      if (
        result.rows.length === 0
      ) {

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

  }
);


/* =========================
   CURRENT USER
========================= */

app.get(
  "/api/auth/me",
  async (req, res) => {

    if (!req.session.userId) {

      return res.status(401).json({
        error:
          "Not logged in."
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
            bio,
            status,
            pronouns,
            profile_picture,
            role,
            created_at
          FROM users
          WHERE id = $1
          `,
          [req.session.userId]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(401).json({
          error:
            "User not found."
        });

      }

      const user =
        result.rows[0];

      if (
        user.username.toLowerCase() ===
        "miyowa"
      ) {

        if (
          user.role !== "owner"
        ) {

          await pool.query(
            `
            UPDATE users
            SET role = 'owner'
            WHERE id = $1
            `,
            [user.id]
          );

          user.role =
            "owner";

        }

      }

      res.json(user);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Something went wrong."
      });

    }

  }
);


/* =========================
   OWNER USER SEARCH
========================= */

app.get(
  "/api/owner/users",
  requireOwner,
  async (req, res) => {

    const username =
      String(
        req.query.username || ""
      ).trim();

    if (!username) {

      return res.status(400).json({
        error:
          "Username is required."
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
            bio,
            status,
            pronouns,
            profile_picture,
            role,
            created_at
          FROM users
          WHERE LOWER(username) =
            LOWER($1)
          LIMIT 1
          `,
          [username]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "User not found."
        });

      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(
        "Owner user search error:",
        error
      );

      res.status(500).json({
        error:
          "Could not search for user."
      });

    }

  }
);


/* =========================
   OWNER CHANGE USER ROLE
========================= */

app.patch(
  "/api/owner/users/:id/role",
  requireOwner,
  async (req, res) => {

    const userId =
      Number(req.params.id);

    const role =
      String(
        req.body.role || ""
      )
        .toLowerCase()
        .trim();

    if (
      !Number.isInteger(userId)
    ) {

      return res.status(400).json({
        error:
          "Invalid user ID."
      });

    }

    const allowedRoles = [
      "user",
      "mod",
      "admin"
    ];

    if (
      !allowedRoles.includes(role)
    ) {

      return res.status(400).json({
        error:
          "Invalid role."
      });

    }

    try {

      const target =
        await pool.query(
          `
          SELECT
            id,
            username,
            role
          FROM users
          WHERE id = $1
          `,
          [userId]
        );

      if (
        target.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "User not found."
        });

      }

      const targetUser =
        target.rows[0];

      if (
        targetUser.username.toLowerCase() ===
        "miyowa"
      ) {

        return res.status(403).json({
          error:
            "The owner account cannot be changed."
        });

      }

      const updated =
        await pool.query(
          `
          UPDATE users
          SET role = $1
          WHERE id = $2
          RETURNING
            id,
            username,
            display_name,
            bio,
            status,
            pronouns,
            profile_picture,
            role,
            created_at
          `,
          [
            role,
            userId
          ]
        );

      res.json(
        updated.rows[0]
      );

    } catch (error) {

      console.error(
        "Owner role update error:",
        error
      );

      res.status(500).json({
        error:
          "Could not update user role."
      });

    }

  }
);


/* =========================
   UPDATE PROFILE
========================= */

app.patch(
  "/api/profile",
  async (req, res) => {

    if (!req.session.userId) {

      return res.status(401).json({
        error:
          "Not logged in."
      });

    }

    const {
      displayName,
      bio,
      status,
      pronouns,
      profilePicture
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

    if (
      displayName.trim().length > 30
    ) {

      return res.status(400).json({
        error:
          "Display name must be 30 characters or fewer."
      });

    }

    const cleanBio =
      typeof bio === "string"
        ? bio.trim()
        : "";

    if (
      cleanBio.length > 250
    ) {

      return res.status(400).json({
        error:
          "Bio must be 250 characters or fewer."
      });

    }

    const cleanStatus =
      typeof status === "string"
        ? status.trim()
        : "";

    if (
      cleanStatus.length > 60
    ) {

      return res.status(400).json({
        error:
          "Status must be 60 characters or fewer."
      });

    }

    const cleanPronouns =
      typeof pronouns === "string"
        ? pronouns.trim()
        : "";

    if (
      cleanPronouns.length > 30
    ) {

      return res.status(400).json({
        error:
          "Pronouns must be 30 characters or fewer."
      });

    }

    const cleanProfilePicture =
      typeof profilePicture === "string"
        ? profilePicture.trim()
        : "";

    if (
      cleanProfilePicture.length > 500
    ) {

      return res.status(400).json({
        error:
          "Profile picture URL must be 500 characters or fewer."
      });

    }

    try {

      await pool.query(
        `
        UPDATE users
        SET
          display_name = $1,
          bio = $2,
          status = $3,
          pronouns = $4,
          profile_picture = $5
        WHERE id = $6
        `,
        [
          displayName.trim(),
          cleanBio,
          cleanStatus,
          cleanPronouns,
          cleanProfilePicture,
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


/* =========================
   PUBLIC USER PROFILE
========================= */

app.get(
  "/api/users/:id",
  async (req, res) => {

    try {

      const userId =
        Number(req.params.id);

      if (
        !Number.isInteger(userId)
      ) {

        return res.status(400).json({
          error:
            "Invalid user ID."
        });

      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            username,
            display_name,
            bio,
            status,
            pronouns,
            profile_picture,
            role,
            created_at
          FROM users
          WHERE id = $1
          `,
          [userId]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "User not found."
        });

      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(
        "Public profile error:",
        error
      );

      res.status(500).json({
        error:
          "Could not load profile."
      });

    }

  }
);


/* =========================
   CHANGE PASSWORD
========================= */

app.patch(
  "/api/profile/password",
  async (req, res) => {

    if (!req.session.userId) {

      return res.status(401).json({
        error:
          "Not logged in."
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

    if (
      newPassword.length < 6
    ) {

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

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "User not found."
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


/* =========================
   LOGOUT
========================= */

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


/* =========================
   FRIEND REQUEST
========================= */

app.post(
  "/api/friends/request",
  async (req, res) => {

    try {

      if (!req.session.userId) {

        return res.status(401).json({
          error:
            "You must be logged in."
        });

      }

      const {
        username
      } = req.body;

      if (!username) {

        return res.status(400).json({
          error:
            "Username is required."
        });

      }

      const target =
        await pool.query(
          `
          SELECT
            id,
            username,
            display_name
          FROM users
          WHERE username = $1
          `,
          [username.trim()]
        );

      if (
        target.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "User not found."
        });

      }

      const receiver =
        target.rows[0];

      if (
        receiver.id ===
        req.session.userId
      ) {

        return res.status(400).json({
          error:
            "You cannot send a friend request to yourself."
        });

      }

      const existing =
        await pool.query(
          `
          SELECT
            id,
            status
          FROM friendships
          WHERE
            (
              requester_id = $1
              AND receiver_id = $2
            )
            OR
            (
              requester_id = $2
              AND receiver_id = $1
            )
          `,
          [
            req.session.userId,
            receiver.id
          ]
        );

      if (
        existing.rows.length > 0
      ) {

        return res.status(400).json({
          error:
            "A friend request or friendship already exists."
        });

      }

      await pool.query(
        `
        INSERT INTO friendships
          (
            requester_id,
            receiver_id,
            status
          )
        VALUES
          ($1, $2, 'pending')
        `,
        [
          req.session.userId,
          receiver.id
        ]
      );

      res.json({
        message:
          "Friend request sent!"
      });

    } catch (error) {

      console.error(
        "Friend request error:",
        error
      );

      res.status(500).json({
        error:
          "Something went wrong."
      });

    }

  }
);


/* =========================
   GET FRIENDS
========================= */

app.get(
  "/api/friends",
  async (req, res) => {

    try {

      if (!req.session.userId) {

        return res.status(401).json({
          error:
            "You must be logged in."
        });

      }

      const userId =
        req.session.userId;

      const requests =
        await pool.query(
          `
          SELECT
            friendships.id,
            users.id AS user_id,
            users.username,
            users.display_name,
            users.profile_picture,
            users.role,
            friendships.created_at
          FROM friendships
          JOIN users
            ON users.id =
              friendships.requester_id
          WHERE
            friendships.receiver_id = $1
            AND friendships.status = 'pending'
          ORDER BY
            friendships.created_at DESC
          `,
          [userId]
        );

      const friends =
        await pool.query(
          `
          SELECT
            friendships.id,
            users.id AS user_id,
            users.username,
            users.display_name,
            users.profile_picture,
            users.role
          FROM friendships
          JOIN users
            ON users.id =
              CASE
                WHEN friendships.requester_id = $1
                THEN friendships.receiver_id
                ELSE friendships.requester_id
              END
          WHERE
            (
              friendships.requester_id = $1
              OR friendships.receiver_id = $1
            )
            AND friendships.status = 'accepted'
          ORDER BY
            users.display_name ASC
          `,
          [userId]
        );

      const sent =
        await pool.query(
          `
          SELECT
            friendships.id,
            users.id AS user_id,
            users.username,
            users.display_name,
            users.profile_picture,
            users.role,
            friendships.created_at
          FROM friendships
          JOIN users
            ON users.id =
              friendships.receiver_id
          WHERE
            friendships.requester_id = $1
            AND friendships.status = 'pending'
          ORDER BY
            friendships.created_at DESC
          `,
          [userId]
        );

      res.json({
        requests:
          requests.rows,

        friends:
          friends.rows,

        sent:
          sent.rows
      });

    } catch (error) {

      console.error(
        "Friends error:",
        error
      );

      res.status(500).json({
        error:
          "Something went wrong."
      });

    }

  }
);


/* =========================
   ACCEPT FRIEND REQUEST
========================= */

app.post(
  "/api/friends/request/:id/accept",
  async (req, res) => {

    try {

      if (!req.session.userId) {

        return res.status(401).json({
          error:
            "You must be logged in."
        });

      }

      const requestId =
        Number(req.params.id);

      if (
        !Number.isInteger(requestId)
      ) {

        return res.status(400).json({
          error:
            "Invalid friend request."
        });

      }

      const result =
        await pool.query(
          `
          UPDATE friendships
          SET status = 'accepted'
          WHERE
            id = $1
            AND receiver_id = $2
            AND status = 'pending'
          RETURNING id
          `,
          [
            requestId,
            req.session.userId
          ]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Friend request not found."
        });

      }

      res.json({
        message:
          "Friend request accepted!"
      });

    } catch (error) {

      console.error(
        "Accept friend request error:",
        error
      );

      res.status(500).json({
        error:
          "Something went wrong."
      });

    }

  }
);


/* =========================
   DECLINE FRIEND REQUEST
========================= */

app.post(
  "/api/friends/request/:id/decline",
  async (req, res) => {

    try {

      if (!req.session.userId) {

        return res.status(401).json({
          error:
            "You must be logged in."
        });

      }

      const requestId =
        Number(req.params.id);

      if (
        !Number.isInteger(requestId)
      ) {

        return res.status(400).json({
          error:
            "Invalid friend request."
        });

      }

      const result =
        await pool.query(
          `
          DELETE FROM friendships
          WHERE
            id = $1
            AND receiver_id = $2
            AND status = 'pending'
          RETURNING id
          `,
          [
            requestId,
            req.session.userId
          ]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Friend request not found."
        });

      }

      res.json({
        message:
          "Friend request declined."
      });

    } catch (error) {

      console.error(
        "Decline friend request error:",
        error
      );

      res.status(500).json({
        error:
          "Something went wrong."
      });

    }

  }
);


/* =========================
   CREATE MATCH
========================= */

app.post(
  "/api/matches",
  requireLogin,
  async (req, res) => {

    try {

      const {
        matchName,
        timeLimit,
        turnTime,
        maxPlayers,
        friendsOnly,
        lateJoining,
        matchAccess,
        allowRematch,
        matchChat,
        revealResults
      } = req.body;


      const cleanMatchName =
        typeof matchName === "string"
          ? matchName.trim()
          : "";


      const gameTime =
        Number(timeLimit);


      const gameTurnTime =
        Number(turnTime);


      const playerLimit =
        Number(maxPlayers);


      const isFriendsOnly =
        Boolean(friendsOnly);


      const canLateJoin =
        Boolean(lateJoining);


      const canRematch =
        Boolean(allowRematch);


      const hasChat =
        Boolean(matchChat);


      const shouldRevealResults =
        Boolean(revealResults);


      const access =
        String(
          matchAccess || "friends"
        )
          .toLowerCase()
          .trim();


      if (
        cleanMatchName.length > 50
      ) {

        return res.status(400).json({
          error:
            "Match name must be 50 characters or fewer."
        });

      }


      if (
        !Number.isInteger(gameTime) ||
        gameTime < 3 ||
        gameTime > 30
      ) {

        return res.status(400).json({
          error:
            "Game time must be between 3 and 30 minutes."
        });

      }


      if (
        !Number.isInteger(gameTurnTime) ||
        ![
          15,
          30,
          45,
          60,
          90
        ].includes(gameTurnTime)
      ) {

        return res.status(400).json({
          error:
            "Invalid turn time."
        });

      }


      if (
        !Number.isInteger(playerLimit) ||
        ![
          3,
          4,
          5,
          6,
          8,
          10
        ].includes(playerLimit)
      ) {

        return res.status(400).json({
          error:
            "Invalid player limit."
        });

      }


      if (
        access !== "friends" &&
        access !== "code"
      ) {

        return res.status(400).json({
          error:
            "Invalid match access."
        });

      }


      function generateMatchCode() {

        const characters =
          "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        let code = "";

        for (
          let i = 0;
          i < 6;
          i++
        ) {

          const index =
            Math.floor(
              Math.random() *
              characters.length
            );

          code +=
            characters[index];

        }

        return code;

      }


      let matchCode;
      let codeExists = true;


      while (codeExists) {

        matchCode =
          generateMatchCode();


        const existing =
          await pool.query(
            `
            SELECT id
            FROM matches
            WHERE match_code = $1
            LIMIT 1
            `,
            [matchCode]
          );


        codeExists =
          existing.rows.length > 0;

      }


      const matchResult =
        await pool.query(
          `
          INSERT INTO matches (
            match_code,
            host_id,
            match_name,
            time_limit,
            turn_time,
            max_players,
            friends_only,
            late_joining,
            match_access,
            allow_rematch,
            match_chat,
            reveal_results,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            'lobby'
          )
          RETURNING
            id,
            match_code,
            host_id,
            match_name,
            time_limit,
            turn_time,
            max_players,
            friends_only,
            late_joining,
            match_access,
            allow_rematch,
            match_chat,
            reveal_results,
            status,
            created_at
          `,
          [
            matchCode,
            req.session.userId,
            cleanMatchName,
            gameTime,
            gameTurnTime,
            playerLimit,
            isFriendsOnly,
            canLateJoin,
            access,
            canRematch,
            hasChat,
            shouldRevealResults
          ]
        );


      const match =
        matchResult.rows[0];


      await pool.query(
        `
        INSERT INTO match_players (
          match_id,
          user_id,
          score,
          is_host
        )
        VALUES (
          $1,
          $2,
          0,
          TRUE
        )
        `,
        [
          match.id,
          req.session.userId
        ]
      );


      res.status(201).json({
        success: true,
        match
      });


    } catch (error) {

      console.error(
        "Create match error:",
        error
      );

      res.status(500).json({
        error:
          "Could not create the match."
      });

    }

  }
);


/* =========================
   JOIN MATCH
========================= */

app.post(
  "/api/matches/:code/join",
  requireLogin,
  async (req, res) => {

    try {

      const matchCode =
        String(
          req.params.code || ""
        )
          .trim()
          .toUpperCase();


      if (!matchCode) {

        return res.status(400).json({
          error:
            "Match code is required."
        });

      }


      const matchResult =
        await pool.query(
          `
          SELECT
            id,
            match_code,
            host_id,
            match_name,
            max_players,
            friends_only,
            late_joining,
            match_access,
            status
          FROM matches
          WHERE match_code = $1
          LIMIT 1
          `,
          [matchCode]
        );


      if (
        matchResult.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Match not found."
        });

      }


      const match =
        matchResult.rows[0];


      if (
        match.status !== "lobby"
      ) {

        return res.status(400).json({
          error:
            "This match has already started."
        });

      }


      const existingPlayer =
        await pool.query(
          `
          SELECT id
          FROM match_players
          WHERE match_id = $1
            AND user_id = $2
          LIMIT 1
          `,
          [
            match.id,
            req.session.userId
          ]
        );


      if (
        existingPlayer.rows.length > 0
      ) {

        return res.json({
          success: true,
          alreadyJoined: true,
          match
        });

      }


      const playerCountResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::INTEGER AS count
          FROM match_players
          WHERE match_id = $1
          `,
          [match.id]
        );


      const playerCount =
        playerCountResult.rows[0].count;


      if (
        playerCount >=
        match.max_players
      ) {

        return res.status(400).json({
          error:
            "This match is full."
        });

      }


      if (
        match.match_access === "friends" ||
        match.friends_only === true
      ) {

        const friendshipResult =
          await pool.query(
            `
            SELECT id
            FROM friendships
            WHERE status = 'accepted'
              AND (
                (
                  requester_id = $1
                  AND receiver_id = $2
                )
                OR
                (
                  requester_id = $2
                  AND receiver_id = $1
                )
              )
            LIMIT 1
            `,
            [
              req.session.userId,
              match.host_id
            ]
          );


        if (
          friendshipResult.rows.length === 0 &&
          Number(req.session.userId) !==
            Number(match.host_id)
        ) {

          return res.status(403).json({
            error:
              "Only friends of the host can join this match."
          });

        }

      }


      await pool.query(
        `
        INSERT INTO match_players (
          match_id,
          user_id,
          score,
          is_host
        )
        VALUES (
          $1,
          $2,
          0,
          FALSE
        )
        `,
        [
          match.id,
          req.session.userId
        ]
      );


      res.status(201).json({
        success: true,
        alreadyJoined: false,
        match
      });


    } catch (error) {

      console.error(
        "Join match error:",
        error
      );

      res.status(500).json({
        error:
          "Could not join the match."
      });

    }

  }
);


/* =========================
   LEAVE MATCH
========================= */

app.post(
  "/api/matches/:code/leave",
  requireLogin,
  async (req, res) => {

    try {

      const matchCode =
        String(
          req.params.code || ""
        )
          .trim()
          .toUpperCase();


      if (!matchCode) {

        return res.status(400).json({
          error:
            "Match code is required."
        });

      }


      const matchResult =
        await pool.query(
          `
          SELECT
            id,
            host_id,
            status
          FROM matches
          WHERE match_code = $1
          LIMIT 1
          `,
          [matchCode]
        );


      if (
        matchResult.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Match not found."
        });

      }


      const match =
        matchResult.rows[0];


      if (
        Number(match.host_id) ===
        Number(req.session.userId)
      ) {

        return res.status(400).json({
          error:
            "The host cannot leave the match."
        });

      }


      await pool.query(
        `
        DELETE FROM match_players
        WHERE match_id = $1
          AND user_id = $2
        `,
        [
          match.id,
          req.session.userId
        ]
      );


      res.json({
        success: true
      });


    } catch (error) {

      console.error(
        "Leave match error:",
        error
      );

      res.status(500).json({
        error:
          "Could not leave the match."
      });

    }

  }
);


/* =========================
   SUBMIT PROMPT
========================= */

app.post(
  "/api/matches/:code/prompt",
  requireLogin,
  async (req, res) => {

    try {

      const matchCode =
        String(
          req.params.code || ""
        )
          .trim()
          .toUpperCase();


      const promptText =
        typeof req.body.prompt === "string"
          ? req.body.prompt.trim()
          : "";


      const targetId =
        Number(req.body.targetId);


      if (!matchCode) {

        return res.status(400).json({
          error:
            "Match code is required."
        });

      }


      if (!promptText) {

        return res.status(400).json({
          error:
            "A prompt is required."
        });

      }


      if (
        promptText.length > 250
      ) {

        return res.status(400).json({
          error:
            "Prompt must be 250 characters or fewer."
        });

      }


      if (
        !Number.isInteger(targetId)
      ) {

        return res.status(400).json({
          error:
            "A valid target player is required."
        });

      }


      const matchResult =
        await pool.query(
          `
          SELECT
            id,
            host_id,
            status,
            current_player_id
          FROM matches
          WHERE match_code = $1
          LIMIT 1
          `,
          [matchCode]
        );


      if (
        matchResult.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Match not found."
        });

      }


      const match =
        matchResult.rows[0];


      if (
        match.status !== "playing"
      ) {

        return res.status(400).json({
          error:
            "This match is not currently playing."
        });

      }


      if (
        Number(match.current_player_id) !==
        Number(req.session.userId)
      ) {

        return res.status(403).json({
          error:
            "It is not your turn."
        });

      }


      if (
        Number(targetId) ===
        Number(req.session.userId)
      ) {

        return res.status(400).json({
          error:
            "You cannot choose yourself as the target."
        });

      }


      const targetResult =
        await pool.query(
          `
          SELECT user_id
          FROM match_players
          WHERE match_id = $1
            AND user_id = $2
          LIMIT 1
          `,
          [
            match.id,
            targetId
          ]
        );


      if (
        targetResult.rows.length === 0
      ) {

        return res.status(400).json({
          error:
            "That player is not in this match."
        });

      }


      const activePrompt =
        await pool.query(
          `
          SELECT id
          FROM match_prompts
          WHERE match_id = $1
            AND status = 'guessing'
          LIMIT 1
          `,
          [match.id]
        );


      if (
        activePrompt.rows.length > 0
      ) {

        return res.status(400).json({
          error:
            "There is already a prompt waiting for guesses."
        });

      }


      const promptResult =
        await pool.query(
          `
          INSERT INTO match_prompts (
            match_id,
            author_id,
            target_id,
            prompt_text,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'guessing'
          )
          RETURNING
            id,
            match_id,
            author_id,
            target_id,
            prompt_text,
            status,
            created_at
          `,
          [
            match.id,
            req.session.userId,
            targetId,
            promptText
          ]
        );


      res.status(201).json({
        success: true,
        prompt:
          promptResult.rows[0]
      });


    } catch (error) {

      console.error(
        "Submit prompt error:",
        error
      );

      res.status(500).json({
        error:
          "Could not submit the prompt."
      });

    }

  }
);


/* =========================
   SUBMIT GUESS
========================= */

app.post(
  "/api/matches/:code/guess",
  requireLogin,
  async (req, res) => {

    try {

      const code =
        String(
          req.params.code || ""
        )
          .trim()
          .toUpperCase();

      const guessedUserId =
        Number(req.body.guessedUserId);


      if (
        !Number.isInteger(guessedUserId)
      ) {

        return res.status(400).json({
          error:
            "You must choose a player."
        });

      }


      const matchResult =
        await pool.query(
          `
          SELECT *
          FROM matches
          WHERE match_code = $1
          `,
          [code]
        );


      if (
        matchResult.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Match not found."
        });

      }


      const match =
        matchResult.rows[0];


      if (
        match.status !== "playing"
      ) {

        return res.status(400).json({
          error:
            "This match is not currently playing."
        });

      }


      const playerResult =
        await pool.query(
          `
          SELECT *
          FROM match_players
          WHERE match_id = $1
            AND user_id = $2
          `,
          [
            match.id,
            req.session.userId
          ]
        );


      if (
        playerResult.rows.length === 0
      ) {

        return res.status(403).json({
          error:
            "You are not in this match."
        });

      }


      const promptResult =
        await pool.query(
          `
          SELECT *
          FROM match_prompts
          WHERE match_id = $1
            AND status = 'guessing'
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [match.id]
        );


      if (
        promptResult.rows.length === 0
      ) {

        return res.status(400).json({
          error:
            "There is no active prompt."
        });

      }


      const prompt =
        promptResult.rows[0];


      if (
        Number(prompt.author_id) ===
        Number(req.session.userId)
      ) {

        return res.status(400).json({
          error:
            "You cannot guess your own prompt."
        });

      }


      const guessedPlayerResult =
        await pool.query(
          `
          SELECT *
          FROM match_players
          WHERE match_id = $1
            AND user_id = $2
          `,
          [
            match.id,
            guessedUserId
          ]
        );


      if (
        guessedPlayerResult.rows.length === 0
      ) {

        return res.status(400).json({
          error:
            "That player is not in the match."
        });

      }


      const existingGuessResult =
        await pool.query(
          `
          SELECT *
          FROM prompt_guesses
          WHERE prompt_id = $1
            AND user_id = $2
          `,
          [
            prompt.id,
            req.session.userId
          ]
        );


      if (
        existingGuessResult.rows.length > 0
      ) {

        return res.status(400).json({
          error:
            "You already guessed this prompt."
        });

      }


      const isCorrect =
        Number(guessedUserId) ===
        Number(prompt.target_id);


      await pool.query(
        `
        INSERT INTO prompt_guesses (
          prompt_id,
          user_id,
          guessed_user_id,
          is_correct
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          prompt.id,
          req.session.userId,
          guessedUserId,
          isCorrect
        ]
      );


      if (isCorrect) {

        await pool.query(
          `
          UPDATE match_players
          SET score = score + 1
          WHERE match_id = $1
            AND user_id = $2
          `,
          [
            match.id,
            req.session.userId
          ]
        );

      }


      const eligiblePlayersResult =
        await pool.query(
          `
          SELECT COUNT(*)::integer AS count
          FROM match_players
          WHERE match_id = $1
            AND user_id != $2
          `,
          [
            match.id,
            prompt.author_id
          ]
        );


      const guessesResult =
        await pool.query(
          `
          SELECT COUNT(*)::integer AS count
          FROM prompt_guesses
          WHERE prompt_id = $1
          `,
          [prompt.id]
        );


      const eligiblePlayers =
        Number(
          eligiblePlayersResult.rows[0].count
        );


      const totalGuesses =
        Number(
          guessesResult.rows[0].count
        );


      let promptFinished = false;


      if (
        totalGuesses >=
        eligiblePlayers
      ) {

        promptFinished = true;


        await pool.query(
          `
          UPDATE match_prompts
          SET
            status = 'answered',
            answered_at = CURRENT_TIMESTAMP
          WHERE id = $1
          `,
          [prompt.id]
        );


        const playersResult =
          await pool.query(
            `
            SELECT user_id
            FROM match_players
            WHERE match_id = $1
            ORDER BY joined_at ASC
            `,
            [match.id]
          );


        const players =
          playersResult.rows;


        if (players.length > 0) {

          const currentIndex =
            players.findIndex(
              player =>
                Number(player.user_id) ===
                Number(match.current_player_id)
            );


          const nextIndex =
            currentIndex === -1
              ? 0
              : (
                  currentIndex + 1
                ) % players.length;


          const nextPlayer =
            players[nextIndex];


          await pool.query(
            `
            UPDATE matches
            SET
              current_player_id = $1,
              turn_started_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [
              nextPlayer.user_id,
              match.id
            ]
          );

        }

      }


      return res.json({
        success: true,
        correct: isCorrect,
        promptFinished
      });


    } catch (error) {

      console.error(
        "Submit guess error:",
        error
      );

      return res.status(500).json({
        error:
          "Could not submit your guess."
      });

    }

  }
);


/* =========================
   GET ACTIVE PROMPT
========================= */

app.get(
  "/api/matches/:code/prompt",
  requireLogin,
  async (req, res) => {

    try {

      const matchCode =
        String(
          req.params.code || ""
        )
          .trim()
          .toUpperCase();


      if (!matchCode) {

        return res.status(400).json({
          error:
            "Match code is required."
        });

      }


      const matchResult =
        await pool.query(
          `
          SELECT
            id,
            status,
            current_player_id
          FROM matches
          WHERE match_code = $1
          LIMIT 1
          `,
          [matchCode]
        );


      if (
        matchResult.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Match not found."
        });

      }


      const match =
        matchResult.rows[0];


      if (
        match.status !== "playing"
      ) {

        return res.json({
          prompt: null
        });

      }


      const playerResult =
        await pool.query(
          `
          SELECT id
          FROM match_players
          WHERE match_id = $1
            AND user_id = $2
          LIMIT 1
          `,
          [
            match.id,
            req.session.userId
          ]
        );


      if (
        playerResult.rows.length === 0
      ) {

        return res.status(403).json({
          error:
            "You are not in this match."
        });

      }


      const promptResult =
        await pool.query(
          `
          SELECT
            id,
            author_id,
            prompt_text,
            status,
            created_at
          FROM match_prompts
          WHERE match_id = $1
            AND status = 'guessing'
          ORDER BY
            created_at DESC
          LIMIT 1
          `,
          [match.id]
        );


      if (
        promptResult.rows.length === 0
      ) {

        return res.json({
          prompt: null
        });

      }


      const prompt =
        promptResult.rows[0];


      res.json({
        prompt: {
          id:
            prompt.id,

          author_id:
            prompt.author_id,

          prompt_text:
            prompt.prompt_text,

          status:
            prompt.status,

          created_at:
            prompt.created_at
        }
      });


    } catch (error) {

      console.error(
        "Get active prompt error:",
        error
      );

      res.status(500).json({
        error:
          "Server error."
      });

    }

  }
);


/* =========================
   START MATCH
========================= */

app.post(
  "/api/matches/:code/start",
  requireLogin,
  async (req, res) => {

    try {

      const matchCode =
        String(
          req.params.code || ""
        )
          .trim()
          .toUpperCase();


      if (!matchCode) {

        return res.status(400).json({
          error:
            "Match code is required."
        });

      }


      const matchResult =
        await pool.query(
          `
          SELECT
            id,
            match_code,
            host_id,
            max_players,
            status
          FROM matches
          WHERE match_code = $1
          LIMIT 1
          `,
          [matchCode]
        );


      if (
        matchResult.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Match not found."
        });

      }


      const match =
        matchResult.rows[0];


      if (
        Number(match.host_id) !==
        Number(req.session.userId)
      ) {

        return res.status(403).json({
          error:
            "Only the host can start the match."
        });

      }


      if (
        match.status !== "lobby"
      ) {

        return res.status(400).json({
          error:
            "This match has already started."
        });

      }


      const playersResult =
        await pool.query(
          `
          SELECT
            user_id
          FROM match_players
          WHERE match_id = $1
          ORDER BY joined_at ASC
          `,
          [match.id]
        );


      const players =
        playersResult.rows;


      if (
        players.length < 3
      ) {

        return res.status(400).json({
          error:
            "At least 3 players are required to start the match."
        });

      }


      const firstPlayer =
        players[0];


      const startedResult =
        await pool.query(
          `
          UPDATE matches
          SET
            status = 'playing',
            current_player_id = $1,
            started_at = CURRENT_TIMESTAMP,
            turn_started_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING
            id,
            match_code,
            status,
            current_player_id,
            started_at,
            turn_started_at
          `,
          [
            firstPlayer.user_id,
            match.id
          ]
        );


      res.json({
        success: true,
        match:
          startedResult.rows[0]
      });


    } catch (error) {

      console.error(
        "Start match error:",
        error
      );

      res.status(500).json({
        error:
          "Could not start the match."
      });

    }

  }
);


/* =========================
   GET MATCH
========================= */

app.get(
  "/api/matches/:code",
  requireLogin,
  async (req, res) => {

    try {

      const matchCode =
        String(
          req.params.code || ""
        )
          .trim()
          .toUpperCase();


      if (!matchCode) {

        return res.status(400).json({
          error:
            "Match code is required."
        });

      }


      const matchResult =
        await pool.query(
          `
          SELECT
            id,
            match_code,
            host_id,
            match_name,
            time_limit,
            turn_time,
            max_players,
            friends_only,
            late_joining,
            match_access,
            allow_rematch,
            match_chat,
            reveal_results,
            status,
            current_player_id,
            created_at,
            started_at,
            turn_started_at,
            ended_at
          FROM matches
          WHERE match_code = $1
          LIMIT 1
          `,
          [matchCode]
        );


      if (
        matchResult.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Match not found."
        });

      }


      const match =
        matchResult.rows[0];


      const playersResult =
        await pool.query(
          `
          SELECT
            mp.id,
            mp.user_id,
            mp.score,
            mp.is_host,
            mp.joined_at,

            u.username,
            u.display_name,
            u.profile_picture,
            u.role

          FROM match_players mp

          INNER JOIN users u
            ON u.id = mp.user_id

          WHERE mp.match_id = $1

          ORDER BY
            mp.is_host DESC,
            mp.joined_at ASC
          `,
          [match.id]
        );


      res.json({
        success: true,

        match,

        players:
          playersResult.rows,

        currentUser: {
          id:
            req.session.userId
        }

      });

    } catch (error) {

      console.error(
        "Get match error:",
        error
      );

      res.status(500).json({
        error:
          "Could not load the match."
      });

    }

  }
);


/* =========================
   TEST API
========================= */

app.get(
  "/api/test",
  (req, res) => {

    res.json({
      message:
        "Someone in this Circle API is working!"
    });

  }
);


/* =========================
   DATABASE INITIALIZATION
========================= */

initializeDatabase()
  .then(() => {

    console.log(
      "Database initialized."
    );

    /*
      Vercel handles the server.
      Do not call app.listen() here.
    */

  })
  .catch(error => {

    console.error(
      "Database initialization error:",
      error
    );

  });


module.exports = app;
