const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const authMiddleware = require("../middlewares/authMiddleware");

// Add rating
router.post("/", authMiddleware, ratingController.addRating);

// Get ratings for a specific user
router.get("/:userId", ratingController.getUserRatings);

module.exports = router;
