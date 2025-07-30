import { NextRequest } from 'next/server';
import { CopilotRuntime, GroqAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import { Groq } from 'groq-sdk'; // ✅ Not from @langchain

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const runtime = new CopilotRuntime();
const serviceAdapter = new GroqAdapter({ groq });

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: '/api/copilotkit',
});

export const POST = async (req: NextRequest) => {
  return handleRequest(req);
};
