const express = require("express");
const { getUserInfo, oauth2Client, saveTokens } = require("../services/google");
const prisma = require("../services/prisma");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

router.get("/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
});

router.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Missing code");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userInfo = await getUserInfo(oauth2Client);

    const userRecord = await prisma.token.upsert({
      where: { user_id: userInfo.email },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
      },
      create: {
        user_id: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
      }
    });

    const jwtToken = jwt.sign(
      {
        uuid: userRecord.id,
        email: userInfo.email,
        provider: "google",
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("OAuth failed");
  }
});

router.get("/verify", authMiddleware, (req, res) => {
  res.json({ success: true, message: "Token is valid." });
});

module.exports = router;
