const express = require("express");

const app = express();

app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({
    message: "Someone in this Circle API is working!"
  });
});

module.exports = app;
