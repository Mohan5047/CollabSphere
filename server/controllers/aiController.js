/**
 * CollabSphere AI Assistant Controller
 * Provides project guidance, task suggestions, learning recommendations, and team assistance.
 */

// Fallback rule-based helper when no external AI API key is configured
const getFallbackResponse = (message) => {
    const lower = message.toLowerCase();

    let guidance = "";
    if (lower.includes("task") || lower.includes("divide") || lower.includes("break down")) {
        guidance = "Here is how to divide a CollabSphere project into actionable tasks:\n" +
            "1. Define MVP Milestones: Core features, user auth, and primary business logic.\n" +
            "2. Break down into smaller tasks: Backend API routes, database schema, and frontend UI components.\n" +
            "3. Assign priorities: Mark critical blockers as HIGH, core features as MEDIUM, and polish as LOW.\n" +
            "4. Assign team members: Use the CollabSphere Tasks tab to assign each task to specific team members.";
    } else if (lower.includes("learn") || lower.includes("course") || lower.includes("track")) {
        guidance = "For structured learning on CollabSphere:\n" +
            "1. Browse available Learning Tracks under `/api/learning-tracks`.\n" +
            "2. Enroll in courses relevant to your project's tech stack.\n" +
            "3. Complete module lessons and attempt quizzes to test your understanding.\n" +
            "4. Earn certificates upon 100% course and quiz completion to showcase on your profile.";
    } else if (lower.includes("team") || lower.includes("member") || lower.includes("collaborat")) {
        guidance = "Tips for collaborating effectively on CollabSphere:\n" +
            "1. Project leads can create teams and add members.\n" +
            "2. Use the File Sharing tab to share project documentation and assets.\n" +
            "3. Use real-time chat for direct communication and quick updates.\n" +
            "4. Check the Activity Timeline to stay informed about recent updates from your team.";
    } else {
        guidance = `I am your CollabSphere Assistant! I can help you divide projects into tasks, give tech stack suggestions, recommend learning tracks, and guide your team collaboration. What would you like help with regarding your project?`;
    }

    return `${guidance}\n\n*(Note: CollabSphere AI Assistant is currently in local development mode. To enable live Generative AI responses, add GEMINI_API_KEY=your_key in your server .env file.)*`;
};

const aiChat = async (req, res) => {
    try {
        const { message } = req.body || {};

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

        // If no API key, return structured fallback response
        if (!apiKey) {
            const fallbackReply = getFallbackResponse(message.trim());
            return res.status(200).json({
                success: true,
                message: fallbackReply
            });
        }

        // External API Call using Google Gemini
        const systemPrompt = "You are CollabSphere Assistant, an intelligent AI helper built into the CollabSphere student project and learning platform. You help students and team leads with project planning, breaking down tasks, recommending learning tracks, and team collaboration. Keep answers concise, actionable, and formatted in clear markdown.";

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: `${systemPrompt}\n\nUser Question: ${message.trim()}` }
                            ]
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error("AI API Error:", errorData);
            // Graceful fallback to rule-based response
            return res.status(200).json({
                success: true,
                message: getFallbackResponse(message.trim())
            });
        }

        const data = await response.json();
        const aiMessage =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            getFallbackResponse(message.trim());

        res.status(200).json({
            success: true,
            message: aiMessage
        });

    } catch (error) {
        console.error("AI CHAT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

module.exports = {
    aiChat
};
