// backend/src/models/aiModels.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

class TaskClassifier {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async classifyTask(userPrompt) {
    const classificationPrompt = `
You are a task classifier for a YouTube playlist management app. 
Analyze the user's message and classify it into one of these 3 categories:

1. "make_playlist" - User wants to create a new playlist
2. "remove_playlist" - User wants to delete/remove a playlist  
3. "manage_playlist" - User wants to modify an existing playlist (add songs, remove songs, rename, etc.)

User message: "${userPrompt}"

Respond ONLY with a JSON object in this exact format:
{
  "action": "make_playlist|remove_playlist|manage_playlist",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this classification"
}

Examples:
- "Create a workout playlist" → {"action": "make_playlist", "confidence": 0.95, "reasoning": "User explicitly wants to create a new playlist"}
- "Delete my old playlist" → {"action": "remove_playlist", "confidence": 0.90, "reasoning": "User wants to delete an existing playlist"}
- "Add some songs to my rock playlist" → {"action": "manage_playlist", "confidence": 0.92, "reasoning": "User wants to modify an existing playlist by adding songs"}
`;

    try {
      const result = await this.model.generateContent(classificationPrompt);
      const response = await result.response;
      let text = response.text();
      
      // Extract JSON from response (handles various formats)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      // Parse the JSON response
      const classification = JSON.parse(jsonMatch[0]);
      
      // Validate the response
      if (!this.isValidClassification(classification)) {
        throw new Error('Invalid classification response');
      }
      
      return classification;
      
    } catch (error) {
      console.error('Classification error:', error);
      // Return a fallback response
      return {
        action: "unknown",
        confidence: 0.0,
        reasoning: "Failed to classify the task",
        error: error.message
      };
    }
  }

  isValidClassification(classification) {
    const validActions = ['make_playlist', 'remove_playlist', 'manage_playlist'];
    
    return (
      classification &&
      typeof classification === 'object' &&
      validActions.includes(classification.action) &&
      typeof classification.confidence === 'number' &&
      classification.confidence >= 0 &&
      classification.confidence <= 1 &&
      typeof classification.reasoning === 'string'
    );
  }
}

module.exports = TaskClassifier;