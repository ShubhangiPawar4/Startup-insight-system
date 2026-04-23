import { ChatOpenAI } from "@langchain/openai";

export function makeLLM(temperature = 0.7) {
  return new ChatOpenAI({
    model: "gpt-5-mini",
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    },
  });
}
