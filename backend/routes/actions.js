const express = require("express");
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Fetches the last 10 actions for the authenticated user.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const { data: actions, error } = await supabase
      .from("actions")
      .select("message, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.json({ success: true, actions: actions });
  } catch (error) {
    console.error("Get actions route error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch actions." });
  }
});

module.exports = router;
