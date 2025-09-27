const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role }, // payload
    process.env.JWT_SECRET,
    { expiresIn: "3d" } // token expiry (1 day)
  );
};

module.exports = { generateToken };
