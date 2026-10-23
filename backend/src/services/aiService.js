const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Parses JSON output from the model, handling markdown fences or leading/trailing text
 */
const extractJson = (content) => {
  if (!content || typeof content !== 'string') return null;

  // Check if enclosed in markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const targetStr = codeBlockMatch ? codeBlockMatch[1] : content;

  // Find first { and last }
  const startIdx = targetStr.indexOf('{');
  const endIdx = targetStr.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const jsonCandidate = targetStr.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonCandidate);
    } catch {
      // Fall through
    }
  }

  return null;
};

/**
 * Builds the system prompt for the OpenRouter model with task context
 */
const buildSystemPrompt = (currentTasks = []) => {
  const taskListSummary = currentTasks.length > 0
    ? currentTasks
        .map((t, i) => `#${i + 1}: "${t.title}" [Status: ${t.completed ? 'Completed' : 'Pending'}] (ID: ${t._id})`)
        .join('\n')
    : '(No tasks currently in database)';

  return `You are a helpful, precise AI assistant for a TODO task management application.
Your goal is to understand the user's intent and output a strict JSON action object to manage tasks.

CURRENT TASKS IN DATABASE:
${taskListSummary}

AVAILABLE ACTIONS:
1. "listTasks": User wants to view/filter tasks.
   parameters: { "status": "all" | "active" | "completed", "search": "optional keyword" }
2. "createTask": User wants to create or add a new task.
   parameters: { "title": "concise task title", "description": "optional task description" }
3. "completeTask": User wants to mark a task as done, completed, finished, or reopen/mark pending.
   parameters: { "target": "task index (e.g. 1), ID, or title", "completed": true | false }
4. "updateTask": User wants to change, edit, or rename a task title or description.
   parameters: { "target": "task index (e.g. 1), ID, or title", "title": "new title", "description": "optional new description" }
5. "deleteTask": User wants to remove or delete a task.
   parameters: { "target": "task index (e.g. 1), ID, or title" }
6. "reply": User asks a question, wants productivity advice, greetings, or "What tasks should I complete today?".
   parameters: {}

OUTPUT FORMAT:
You MUST respond ONLY with a single JSON object. No other text outside the JSON.
{
  "action": "listTasks" | "createTask" | "completeTask" | "updateTask" | "deleteTask" | "reply",
  "parameters": { ... },
  "message": "A friendly, concise conversational response to the user explaining the result or recommendation."
}

CRITICAL RULES:
- When user asks to view, list, or show tasks (e.g. "Show me all done tasks", "Show completed tasks", "List my pending tasks", "Show all my tasks"):
  You MUST set action="listTasks" with parameters.status="completed" (for done/completed tasks), parameters.status="pending" (for pending/active tasks), or parameters.status="all" (for all tasks). Never use action="reply" for task listing requests.
- If user says "Mark task 1 as done" or "Mark Learn React as completed", set action="completeTask" with parameters.target and parameters.completed=true.
- If user wants to delete a task, set action="deleteTask" with parameters.target.
- Do NOT fabricate or invent task lists: Express backend will execute the database query and return the actual records.
- Keep the "message" polite, helpful, and natural.`;
};

/**
 * Sends chat prompt to OpenRouter and returns the structured action
 */
const callAiAssistant = async ({ message, conversationHistory = [], currentTasks = [] }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Server configuration error: OPENROUTER_API_KEY is not configured in backend .env.');
  }

  const model = process.env.OPENROUTER_MODEL || 'minimax/minimax-m3.1-flash:free';

  // Construct message array
  const systemMessage = {
    role: 'system',
    content: buildSystemPrompt(currentTasks),
  };

  // Include recent conversation history (max 8 messages for context efficiency)
  const recentHistory = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-8).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: String(msg.content || '').slice(0, 500),
      }))
    : [];

  const userMessage = {
    role: 'user',
    content: String(message).slice(0, 1000),
  };

  const payload = {
    model,
    messages: [systemMessage, ...recentHistory, userMessage],
    temperature: 0.1, // Low temperature for high precision and consistent JSON
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'TODO AI Chat Assistant',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = '';
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error?.message || errorText;
      } catch {
        parsedError = errorText;
      }

      console.error(`[OpenRouter Error] HTTP ${response.status}:`, parsedError);

      if (response.status === 429) {
        throw new Error('AI service rate limit reached. Please wait a moment and try again.');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed with the AI service. Please verify server API key.');
      } else {
        throw new Error(`AI service returned error HTTP ${response.status}.`);
      }
    }

    const data = await response.json();
    const assistantContent = data.choices?.[0]?.message?.content?.trim();

    if (!assistantContent) {
      throw new Error('The AI model returned an empty response.');
    }

    const structuredAction = extractJson(assistantContent);

    if (structuredAction && structuredAction.action) {
      return structuredAction;
    }

    // Fallback: If model responded in natural text instead of JSON
    return {
      action: 'reply',
      parameters: {},
      message: assistantContent,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('AI service request timed out after 20 seconds. Please try again.');
    }
    throw error;
  }
};

module.exports = {
  callAiAssistant,
  extractJson,
};
