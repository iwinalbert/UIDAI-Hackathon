
const API_KEY = "AIzaSyBPbaI3mhZdnz7JEUFwaFYDy8sfYamWpkY";
const MODEL_NAME = "gemini-2.0-flash";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

interface GeminiResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

export const generateMarketReport = async (sessionPayload: any): Promise<string> => {
    try {
        const prompt = `
        You are an expert data analyst for the UIDAI velocity charts.
        you are an advanced Quant specialist skilled in interpreting complex data and extracting meaningful insignts.
        You are provided with a session configuration in JSON format.

        Analyze the following session configuration and provide a market report.
        
        SESSION DATA:
        ${JSON.stringify(sessionPayload, null, 2)}
        
        INSTRUCTIONS:
        1. Identify the current focus (State, District, Dataset).
        2. Analyze the active indicators (what are they measuring?).
        3. If specific "Fusion" datasets are active, interpret the correlation they might be looking for.
        4. Provide a technical "Insight" on what the chart reveals about the fusion of data and the technical observation and implementation . 
        5. Provide a Resoning for the insight based on the data presented with the relevant news data provided. 
        6. Provide a theoretical "Observation" of what this chart setup is designed to detect (e.g., "Migration patterns due to school admissions").
        7. Keep it professional, insightful, and concise.
        `;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data: GeminiResponse = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Failed to generate report. Please check your network or API key.";
    }
};

export const generateGist = async (fullReport: string): Promise<string> => {
    try {
        const prompt = `
        Summarize the following market report into a single "Gist" or "Headline" (max 2 sentences).
        Make it punchy , actionable , technical and insightful.
        REPORT:
        ${fullReport}
        `;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data: GeminiResponse = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No gist generated.";

    } catch (error) {
        return "Insight generation failed.";
    }
};
