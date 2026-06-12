import type { AgentStreamEvent } from '../types/agent-events';

export interface CreateAgentRunRequest {
  query: string;
  context?: string;
  run_id?: string;
}

export interface CreateAgentRunResponse {
  run_id: string;
}

export interface AgentStreamHandlers {
  onEvent: (event: AgentStreamEvent) => void;
  onError?: (error: Event) => void;
}

export async function createFastApiAgentRun(request: CreateAgentRunRequest) {
  const response = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to create run (${response.status})`);
  }

  return (await response.json()) as CreateAgentRunResponse;
}

export function connectFastApiAgentStream(runId: string, handlers: AgentStreamHandlers) {
  const source = new EventSource(`/api/runs/${runId}/events`);

  source.addEventListener('agent_event', (message) => {
    handlers.onEvent(JSON.parse((message as MessageEvent<string>).data) as AgentStreamEvent);
  });

  source.addEventListener('error', (error) => {
    handlers.onError?.(error);
  });

  return () => source.close();
}
