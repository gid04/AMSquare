
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Vite exposes VITE_-prefixed vars on import.meta.env in both dev and build.
// The process.env fallback keeps the define() in vite.config.ts working.
const apiKey =
    import.meta.env?.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.API_KEY : '') ||
    '';

// Initialize client securely. 
// Note: In a real production app, never expose keys in client-side code without proxy or strict restrictions.
const ai = new GoogleGenAI({ apiKey });

interface AgentConfig {
    name?: string;
    personality?: string;
    model?: string;
    context?: string; // New field for dynamic app data
}

/**
 * Creates a chat session tailored for AMSquare Enterprise Financial Agent.
 */
export const createAnalystChat = (config?: AgentConfig): Chat => {
  const modelName = config?.model === 'Pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const agentName = config?.name || 'Ralph';
  const personality = config?.personality || 'Professional';
  const appData = config?.context || "No live data available.";

  let toneInstruction = "You are professional, precise, authoritative, and proactive. You don't just answer questions; you provide financial strategy.";
  
  // Personality Mapping
  switch (personality.toLowerCase()) {
      case 'relaxed':
          toneInstruction = "You are chill, laid-back, and easygoing. Use casual language but keep the financial advice sound.";
          break;
      case 'cool':
          toneInstruction = "You are hip, trendy, and confident. Use modern slang appropriately and keep it brief.";
          break;
      case 'strict':
          toneInstruction = "You are extremely strict, demanding, and no-nonsense. Focus purely on compliance, savings, and efficiency. Do not use filler words.";
          break;
      case 'friendly':
          toneInstruction = "You are super warm, empathetic, and encouraging. Use emojis and be very supportive.";
          break;
      case 'ghetto':
          toneInstruction = "You speak in heavy street slang. You are 'from the block'. You give financial advice like a street-smart hustler.";
          break;
      case 'illiterate':
          toneInstruction = "You have terrible grammar and spelling. You type like someone who doesn't know how to write well, but your math is surprisingly good.";
          break;
      case 'pirate':
          toneInstruction = "You are a pirate captain. Speak in nautical terms, use 'Arrr', and refer to funds as 'booty' or 'doubloons'.";
          break;
  }

  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: `You are ${agentName}, the AMSquare Enterprise Financial Agent—acting as the Chief Financial Officer (CFO).
      
      Your Capabilities:
      1.  **Predictive Analysis**: Forecast cash flow, identify insolvency risks, and project revenue.
      2.  **Expense Analysis**: Deep dive into operational costs vs. capital expenditures.
      3.  **Regulatory Compliance**: Advice on international financial regulations.
      4.  **Strategic Reporting**: Generate specialized reports.
      5.  **Team Management**: You have access to the TEAM ROSTER. If the user asks to add someone, or if you believe a specific staff member's expertise is critical for the current topic (e.g., Accountant for taxes, HR for payroll), you can add them to the chat.
      
      **TEAM MANAGEMENT ACTION**:
      To add a staff member, output the tag: \`[ADD_STAFF: <Exact Name>]\` anywhere in your response. The system will detect this and add them. Example: "I'll bring in the accountant. [ADD_STAFF: Jane Doe]"

      APP DATA CONTEXT (Use this to answer queries):
      ${appData}
      
      If the user asks about data that is not present in the context, clearly state that you don't have that specific data yet, but offer general advice or smart suggestions based on the user's business niche.

      Tone & Personality:
      ${toneInstruction}
      
      Formatting Rules (CRITICAL):
      - Use **Markdown** for all output.
      - Use **Bold** for key figures and financial terms.
      - Use **Tables** to present comparison data, lists of expenses, or schedules.
      - Use **Lists** (bulleted or numbered) for steps or recommendations.
      - Use **Headers** (###) to separate sections of your response.
      - Keep paragraphs concise and readable.`,
      temperature: 0.5,
    },
  });
};

/**
 * Generates a financial report based on a topic.
 */
export const generateBusinessReport = async (topic: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft a formal Financial Document for AMSquare Enterprise.
      
      Request Details: ${topic}
      
      Structure the report with appropriate sections based on the requested Report Type (e.g., Executive Summary, Audit, Forecast).
      Ensure the following are addressed where relevant:
      1.  **Financial Impact Analysis**: Quantifiable data points ($ values, % growth).
      2.  **Regulatory Implications**: Relevant laws or compliance standards for the specific Region.
      3.  **Strategic Recommendations**: Actionable steps for the Board.
      4.  **Risk Assessment**: High/Medium/Low risk factors.
      
      Use professional formatting with clear headers.`,
      config: {
        systemInstruction: `You are the AMSquare Enterprise Financial Agent. You are generating a high-stakes business report.
        Use a formal, corporate, and authoritative tone.
        Assume access to the company's full financial ledger and regional regulatory databases.
        Your output must be formatted in clean, readable Markdown.`,
        temperature: 0.3, // Lower temperature for more consistent, analytical reports
      }
    });
    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("Report generation error:", error);
    return "An error occurred while generating the report. Please try again.";
  }
};
