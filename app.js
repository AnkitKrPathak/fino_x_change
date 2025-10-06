const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const loanRoutes = require("./routes/loanRoutes");


const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);

module.exports = app;
