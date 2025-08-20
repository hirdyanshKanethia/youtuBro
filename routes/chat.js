// backend/src/routes/chat.js

const express = require("express");
const { v4: uuidv4 } = require('uuid');
const TaskClassifier = require("../models/taskClassifier");
const ActionHandlers = require("../models/actionHandlers");
// 1. Import the new PlaylistBuilder
const PlaylistBuilder = require("../services/playlistBuilder");

const router = express.Router();

// --- Instantiate Models and Services ---
const classifier = new TaskClassifier(process.env.GEMINI_API_KEY);
const actionHandlers = new ActionHandlers(process.env.GEMINI_API_KEY);
// 2. Instantiate the builder with necessary API keys
const playlistBuilder = new PlaylistBuilder(
    process.env.GEMINI_API_KEY, 
    process.env.YOUTUBE_API_KEY // Assumes you have a YouTube key in your .env
);

router.post("/", async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // Step 1: Classify the task
        const classification = await classifier.classifyTask(prompt);
        
        if (classification.action === "unknown") {
            return res.json({
                success: false,
                message: "I couldn't understand what you want to do. Please try rephrasing your request.",
                classification: classification
            });
        }

        // Step 2: Extract parameters based on action
        let handlerResult;
        switch (classification.action) {
            case "make_playlist":
                handlerResult = await actionHandlers.handleMakePlaylist(prompt);
                break;
            case "remove_playlist":
                // Placeholder for future implementation
                handlerResult = { ready_to_execute: false, message: "Remove playlist is not yet implemented." };
                break;
            case "manage_playlist":
                 // Placeholder for future implementation
                handlerResult = { ready_to_execute: false, message: "Manage playlist is not yet implemented." };
                break;
            default:
                return res.json({
                    success: false,
                    message: "Unsupported action type.",
                    classification: classification
                });
        }

        // Step 3: Check if we have enough information to execute
        if (handlerResult.ready_to_execute) {
            // 3. Pass the entire handlerResult to the executeAction function
            const executionResult = await executeAction(classification.action, handlerResult);
            return res.json(executionResult);
        } else {
            // Need more information
            return res.json({
                success: false,
                needs_more_info: true,
                message: handlerResult.message || "I need more details to complete this request.",
                classification: classification,
                missing_parameters: handlerResult.missing || [],
                current_parameters: handlerResult.parameters
            });
        }
        
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ 
            error: "Failed to process request",
            message: error.message 
        });
    }
});

// 4. Replace the placeholder with a real action dispatcher
async function executeAction(action, handlerResult) {
    console.log(`Executing action: ${action}`);

    switch (action) {
        case 'make_playlist':
            // The PlaylistBuilder expects the full handlerResult object
            return await playlistBuilder.execute(handlerResult);
        
        case 'remove_playlist':
            // TODO: Implement remove playlist logic
            console.log('With parameters:', handlerResult.parameters);
            return { success: false, message: `Action [${action}] is not yet implemented.` };

        case 'manage_playlist':
            // TODO: Implement manage playlist logic
            console.log('With parameters:', handlerResult.parameters);
            return { success: false, message: `Action [${action}] is not yet implemented.` };
            
        default:
            console.warn(`No executor found for action: ${action}`);
            return { success: false, message: `Execution failed: Unknown action type "${action}".` };
    }
}

module.exports = router;