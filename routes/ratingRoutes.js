const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const authMiddleware = require("../middlewares/authMiddleware");

// Add rating
router.post("/", authMiddleware, ratingController.addRating);

// Get loan IDs user has already rated (must be before :userId)
router.get("/rated-loans", authMiddleware, ratingController.getRatedLoanIds);

// Get ratings for a specific user
router.get("/:userId", ratingController.getUserRatings);

module.exports = router;
