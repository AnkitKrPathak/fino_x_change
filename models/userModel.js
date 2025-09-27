const db = require("../config/db");

// Insert new user
const createUser = async (name, email, hashedPassword, role = "user") => {
  const [result] = await db.execute(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role]
  );
  return result.insertId;
};

// Find user by email
const findUserByEmail = async (email) => {
  const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0]; // return single user
};

module.exports = { createUser, findUserByEmail };
