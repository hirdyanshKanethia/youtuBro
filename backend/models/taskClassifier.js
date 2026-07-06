// FIRST MODEL TO PROCESS ON THE USER PROMPT AND CLASSIFY IT AS EITHER OF THE AVAILABLE OPERATIONS

const { GoogleGenAI } = require("@google/genai");

class TaskClassifier {
  constructor(geminiApiKey) {
    this.ai = new GoogleGenAI({ apiKey: geminiApiKey });
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    // this.apiKey = geminiApiKey; // Reusing param for OpenRouter key
    // this.modelName = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite-preview-02-05:free";
  }

  async classifyTask(userPrompt) {
    const classificationPrompt = `
You are a task classifier for a YouTube assistant app.
Analyze the user's message and classify it into one of these 4 categories:

1. "make_playlist" - User wants to create a new playlist.
2. "remove_playlist" - User wants to delete/remove a playlist.
3. "manage_playlist" - User wants to modify an existing playlist.
4. "play_video" - User wants to watch or listen to something now.

User message: "${userPrompt}"

Respond ONLY with a JSON object in this exact format:
{
  "action": "make_playlist|remove_playlist|manage_playlist|play_video",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this classification."
}
`;

    try {
      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: classificationPrompt,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      // `response.text` is a property (not a function)
      const text = result.text;

      /*
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: "user", content: classificationPrompt }]
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      const text = data.choices[0].message.content;
      */

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response from LLM");

      const classification = JSON.parse(jsonMatch[0]);
      if (!this.isValidClassification(classification))
        throw new Error("Invalid classification response from model");

      return classification;
    } catch (error) {
      console.error("Classification error:", error);
      return {
        action: "unknown",
        confidence: 0.0,
        reasoning: "Failed to classify the task.",
        error: error.message,
      };
    }
  }

  isValidClassification(classification) {
    const validActions = [
      "make_playlist",
      "remove_playlist",
      "manage_playlist",
      "play_video",
    ];

    return (
      classification &&
      typeof classification === "object" &&
      validActions.includes(classification.action) &&
      typeof classification.confidence === "number" &&
      classification.confidence >= 0 &&
      classification.confidence <= 1 &&
      typeof classification.reasoning === "string"
    );
  }
}

module.exports = TaskClassifier;
