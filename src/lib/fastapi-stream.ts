import type { AgentStreamEvent } from '../types/agent-events';

export interface AgentStreamHandlers {
  onEvent: (event: AgentStreamEvent) => void;
  onError?: (error: Event) => void;
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
