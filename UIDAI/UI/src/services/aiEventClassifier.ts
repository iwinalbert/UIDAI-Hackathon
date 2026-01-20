/**
 * AI Event Classifier using OpenRouter
 * Uses X-InSTA prompting to classify news events
 */

import type { NewsArticle } from './newsService';

const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID = 'xiaomi/mimo-v2-flash:free';

export type EventType = 'election' | 'technology' | 'policy' | 'camp' | 'other';
export type EventSeverity = 'high' | 'medium' | 'low';

export interface ClassifiedEvent {
    id: string;
    date: string;
    type: EventType;
    severity: EventSeverity;
    title: string;
    summary: string;
    source: string;
    originalArticle: NewsArticle;
}

/**
 * X-InSTA Prompt Structure for Event Classification
 * [X] Context, [I] Instruction, [n] Nuance, [S] Structure, [T] Tone, [A] Audience
 */
function buildXInSTAPrompt(article: NewsArticle, state: string, district: string): string {
    return `
[X] CONTEXT:
You are analyzing news about India's Aadhaar identity ecosystem in ${state}, ${district || 'all districts'}.
The goal is to classify events that may impact biometric enrollment or update velocity.

[I] INSTRUCTION:
Classify the following news article into one of these categories and assess its impact severity:
- "election": State/local elections, political campaigns affecting Aadhaar operations
- "technology": Aadhaar tech upgrades, new biometric machines, system changes
- "policy": Government directives, seeding mandates, new regulations
- "camp": Enrollment camp announcements, special drives
- "other": Unrelated or minimal impact

[n] NUANCE:
Consider:
- Elections often cause temporary slowdowns in government services
- Technology changes may cause initial disruption then acceleration
- Policy mandates typically cause velocity spikes
- Camp announcements indicate planned acceleration

[S] STRUCTURE:
Respond ONLY with valid JSON in this exact format:
{
  "type": "election|technology|policy|camp|other",
  "severity": "high|medium|low",
  "summary": "One sentence explaining the impact on Aadhaar velocity"
}

[T] TONE: Analytical, quantitative, factual.

[A] AUDIENCE: Administrative planners optimizing Aadhaar machine deployment.

---
NEWS ARTICLE:
Title: ${article.title}
Date: ${article.pubDate}
Source: ${article.source_name}
Content: ${article.description || article.content || 'No content available'}
---

Respond with JSON only:`;
}

/**
 * Classifies a news article using OpenRouter AI
 */
export async function classifyNewsEvent(
    article: NewsArticle,
    state: string,
    district: string
): Promise<ClassifiedEvent | null> {
    const prompt = buildXInSTAPrompt(article, state, district);

    try {
        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://uidai-velocity-analyzer.local',
                'X-Title': 'UIDAI Velocity Analyzer'
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No response content from AI');
        }

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            id: article.article_id,
            date: article.pubDate,
            type: parsed.type as EventType,
            severity: parsed.severity as EventSeverity,
            title: article.title,
            summary: parsed.summary,
            source: article.source_name,
            originalArticle: article
        };
    } catch (error) {
        console.error('Failed to classify event:', error);
        return null;
    }
}

/**
 * Batch classifies multiple news articles
 */
export async function classifyNewsEvents(
    articles: NewsArticle[],
    state: string,
    district: string
): Promise<ClassifiedEvent[]> {
    const results: ClassifiedEvent[] = [];

    for (const article of articles) {
        const classified = await classifyNewsEvent(article, state, district);
        if (classified && classified.type !== 'other') {
            results.push(classified);
        }
        // Rate limiting: wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
}
