const express = require("express");
const { getUserInfo, oauth2Client, saveTokens } = require("../services/google");
const supabase = require("../services/supabase");
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

    const { error } = await supabase.from("tokens").upsert(
      {
        user_id: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      },
      { onConflict: "user_id", returning: "minimal" }
    );

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).send("Failed to save tokens");
    }

    const { data: userRecord, error: selectError } = await supabase
      .from("tokens")
      .select("id")
      .eq("user_id", userInfo.email)
      .single();

    if (selectError || !userRecord) {
      console.error("Supabase select error:", selectError);
      return res
        .status(500)
        .send("Failed to retrieve user record after login.");
    }

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
    res.redirect(`${frontendUrl}/auth-success?token=${jwtToken}`);
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("OAuth failed");
  }
});

router.get("/verify", authMiddleware, (req, res) => {
  res.json({ success: true, message: "Token is valid." });
});

module.exports = router;
