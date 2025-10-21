const db = require("../config/db");

// Add a new rating (also updates user average ratings)
const addRating = async (ratedUserId, raterUserId, role, rating, comment) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      "INSERT INTO user_ratings (rated_user_id, rater_user_id, role, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [ratedUserId, raterUserId, role, rating, comment]
    );

    const [rows] = await connection.execute(
      "SELECT AVG(rating) AS avg_rating FROM user_ratings WHERE rated_user_id = ? AND role = ?",
      [ratedUserId, role]
    );
    const avgRating = rows[0].avg_rating || 0;

    if (role === "borrower") {
      await connection.execute(
        "UPDATE users SET borrower_rating = ? WHERE id = ?",
        [avgRating, ratedUserId]
      );
    } else if (role === "lender") {
      await connection.execute(
        "UPDATE users SET lender_rating = ? WHERE id = ?",
        [avgRating, ratedUserId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get average rating for user (separately for borrower & lender roles)
const getUserRatings = async (userId) => {
  const [rows] = await db.execute(`
    SELECT role, ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS total_reviews
    FROM user_ratings
    WHERE rated_user_id = ?
    GROUP BY role
  `, [userId]);

  return rows;
};

// Get detailed rating feedbacks
const getUserFeedback = async (userId) => {
  const [rows] = await db.execute(`
    SELECT ur.*, u.name AS rater_name, u.email AS rater_email
    FROM user_ratings ur
    JOIN users u ON ur.rater_user_id = u.id
    WHERE ur.rated_user_id = ?
    ORDER BY ur.created_at DESC
  `, [userId]);
  return rows;
};

module.exports = { addRating, getUserRatings, getUserFeedback };
