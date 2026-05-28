import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please check AI Studio Settings > Secrets, or add it in your .env file.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser for incoming task arrays
  app.use(express.json());

  // API endpoint for Focus/Motivational advice based on core task context
  app.post("/api/advice", async (req, res) => {
    try {
      const { tasks } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "Invalid tasks payload. Expected an array of tasks." });
      }

      const client = getGenAI();

      // Setup detailed high-end workspace context for the prompt
      const totalCount = tasks.length;
      const completedCount = tasks.filter(t => t.completed).length;
      const incompleteTasks = tasks.filter(t => !t.completed);
      const highPriorityIncompleteCount = incompleteTasks.filter(t => t.priority === "high").length;
      const overdueCount = incompleteTasks.filter(t => t.deadline && t.deadline < new Date().toISOString().split('T')[0]).length;
      
      const prompt = `
        You are "PriorityFlow AI", an elite, world-class executive operations coach and cognitive performance scientist advising high-performing teams and founders in tier-1 financial and technology hubs.
        
        Analyze the user's workspace tasks below and deliver extremely professional, actionable, and laser-focused advice.
        
        ### Current Workspace Metadata:
        - Total Tasks: ${totalCount}
        - Completed Tasks: ${completedCount} (Fidelity Rate: ${totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%)
        - Remaining Pending Tasks: ${incompleteTasks.length}
        - High-Priority Targets: ${highPriorityIncompleteCount}
        - Overdue Tasks: ${overdueCount}
        
        ### Precise Task List JSON:
        ${JSON.stringify(tasks.map(t => ({
          title: t.title,
          completed: t.completed,
          priority: t.priority,
          category: t.category,
          deadline: t.deadline || "No deadline Specified",
          estimatedMinutes: t.estimatedMinutes || "No estimate",
          pinned: t.pinned,
          subTaskCount: t.subTasks?.length || 0,
          subTasksCompleted: t.subTasks?.filter((st: any) => st.completed).length || 0
        })), null, 2)}

        ### Required Advice Output Guidelines:
        1. **Elite Synthesis (Motivation & State of Play)**:
           - Start with a powerful, refined greeting.
           - Summarize the focus and cognitive weight (total estimated minutes) of their list. Suggest a framework (e.g. Time Blocking, Pomodoro or Eisenhower Matrix) tailored directly to their current task mix.
        2. **Immediate Focus Sequence**:
           - Explicitly dictate the 2-3 specific tasks they should prioritize next based on high priority, pinning, and deadlines. Mention them by name verbatim.
        3. **Friction Reduction Strategy**:
           - If there are subtasks, suggest how to tackle one of them to build immediate momentum.
           - If there are overdue tasks, address them with constructive feedback.
        4. **Cognitive Tip**:
           - Give a short, high-impact Tier-1 cognitive, stress-reduction, or deep-work technique (like attention hygiene, context-switching minimization, or transition spacing).

        *Keep the tone sophisticated, motivating, respectful, and direct. Format with clean, readable Markdown layout, using headers and lists.*
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const adviceText = response.text || "No response text was generated.";
      res.json({ advice: adviceText });
    } catch (error: any) {
      console.error("Gemini API Error in /api/advice:", error);
      res.status(550).json({ 
        error: error.message || "An unexpected error occurred while communicating with the Generative AI engine." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server with Vite middleware running on port ${PORT}`);
  });
}

startServer();
