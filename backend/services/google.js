// FILE TO HANDLE OAuth RELATED OPERATIONS

const { google } = require("googleapis");
const prisma = require("./prisma");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getUserInfo(auth) {
  const oauth2 = google.oauth2({
    auth,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();
  return data;
}

async function saveTokens(userId, tokens) {
  const { access_token, refresh_token, scope, token_type, expiry_date } =
    tokens;

  const data = await prisma.token.upsert({
    where: { user_id: userId },
    update: {
      access_token,
      refresh_token,
      scope,
      token_type,
      expiry_date: expiry_date ? BigInt(expiry_date) : null,
    },
    create: {
      user_id: userId,
      access_token,
      refresh_token,
      scope,
      token_type,
      expiry_date: expiry_date ? BigInt(expiry_date) : null,
    }
  });

  return data;
}

async function loadTokens(userId) {
  const data = await prisma.token.findUnique({
    where: { user_id: userId }
  });

  if (!data) throw new Error("Token not found");
  if (data.expiry_date) {
    data.expiry_date = Number(data.expiry_date);
  }
  return data;
}

async function getAuthClient(userId) {
  try {
    const tokens = await loadTokens(userId);

    console.log("Using Google OAuth client config:", {
      client_id: oauth2Client._clientId,
      client_secret_present: !!oauth2Client._clientSecret,
      redirect_uri: oauth2Client.redirectUri,
    });

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
        ? new Date(tokens.expiry_date).getTime()
        : null,
    });

    oauth2Client.on("tokens", (newTokens) => {
      if (newTokens.refresh_token) {
        console.log("New refresh token received, saving...");
        saveTokens(userId, { ...tokens, ...newTokens });
      }
    });

    return oauth2Client;
  } catch (error) {
    console.error("Failed to get auth client for user:", userId, error.message);
    return null;
  }
}

module.exports = { oauth2Client, saveTokens, getAuthClient, getUserInfo };
