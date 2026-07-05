const express = require("express");
const prisma = require("../services/prisma");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Fetches the last 10 actions for the authenticated user.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const actions = await prisma.action.findMany({
      where: { user_id: userId },
      select: { message: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    res.json({ success: true, actions: actions });
  } catch (error) {
    console.error("Get actions route error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch actions." });
  }
});

module.exports = router;
