const { initializeDatabase } = require("../server/database");
const app = require("../server/server");

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }

  return app(req, res);
};
