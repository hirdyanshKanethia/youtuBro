// const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

class TaskClassifier {
  constructor(geminiApiKey) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
      // Use the Google AI client's generateContent method.
      const result = await this.model.generateContent(classificationPrompt);
      const response = await result.response;
      let text = response.text();

      // Manually find and parse the JSON from the text response.
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const classification = JSON.parse(jsonMatch[0]);
      if (!this.isValidClassification(classification)) {
        throw new Error("Invalid classification response from model");
      }

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
