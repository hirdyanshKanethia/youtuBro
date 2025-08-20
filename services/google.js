const { google } = require("googleapis");
const supabase = require("./supabase");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getUserInfo(auth) {
  const oauth2 = google.oauth2({
    auth,
    version: "v2"
  });

  const { data } = await oauth2.userinfo.get();
  return data;
}

async function saveTokens(userId, tokens) {
  const { access_token, refresh_token, scope, token_type, expiry_date } = tokens

  const { data, error } = await supabase
    .from("tokens")
    .upsert({
      user_id: userId, // e.g. Supabase auth user ID
      access_token,
      refresh_token,
      scope,
      token_type,
      expiry_date
    }, { onConflict: "user_id" }) // update if exists

  if (error) {
    console.error("Error saving tokens:")
    throw error
  }

  return data
}

async function loadTokens(userId) {
  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

async function getAuthClient(userId) {
  const tokens = await loadTokens(userId);

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date
      ? new Date(tokens.expiry_date).getTime()
      : null
  });

  // Refresh if expired
  if (!tokens.expiry_date || Date.now() > new Date(tokens.expiry_date).getTime()) {
    const newTokens = await oauth2Client.refreshAccessToken();
    await storeTokens(userId, newTokens.credentials);
    oauth2Client.setCredentials(newTokens.credentials);
  }

  return oauth2Client;
}

module.exports = { oauth2Client, saveTokens, getAuthClient, getUserInfo };
