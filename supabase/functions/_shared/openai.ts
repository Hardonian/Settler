/**
 * Shared OpenAI helper for autonomous agents
 * Provides AI reasoning capabilities to agents
 */

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  model: string = "gpt-4o-mini"
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set, skipping AI reasoning");
    return "";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${error}`);
      return "";
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    return "";
  }
}

/**
 * Generate AI insights from structured data
 */
export async function generateInsights(
  context: string,
  data: Record<string, unknown>,
  task: string
): Promise<string> {
  const prompt = `Given the following ${context}:

${JSON.stringify(data, null, 2)}

${task}

Provide concise, actionable insights. Be specific and data-driven.`;

  return await callOpenAI(
    prompt,
    "You are an expert analyst providing strategic insights. Be concise, specific, and actionable."
  );
}

/**
 * Prioritize items using AI
 */
export async function prioritizeWithAI(
  items: Array<{ title: string; metrics: Record<string, unknown> }>,
  context: string
): Promise<Array<{ title: string; priority: number; rationale: string }>> {
  const prompt = `Given these ${context}:

${JSON.stringify(items, null, 2)}

Prioritize them based on business impact, urgency, and strategic value. Return a JSON array with priority (1=highest), title, and rationale for each.`;

  const response = await callOpenAI(
    prompt,
    "You are a strategic prioritization expert. Return only valid JSON array."
  );

  try {
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generate content using AI
 */
export async function generateContent(
  contentType: string,
  data: Record<string, unknown>,
  requirements: string
): Promise<string> {
  const prompt = `Create ${contentType} based on this data:

${JSON.stringify(data, null, 2)}

Requirements: ${requirements}

Generate high-quality, engaging content.`;

  return await callOpenAI(
    prompt,
    `You are an expert content creator specializing in ${contentType}. Create engaging, accurate content.`
  );
}
