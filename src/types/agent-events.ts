export type AgentEventType =
  | 'planning'
  | 'graph_node_start'
  | 'tool_call'
  | 'tool_result'
  | 'graph_node_end'
  | 'finalizing'
  | 'answer_delta'
  | 'run_complete'
  | 'error';

export type AgentEventStatus = 'queued' | 'running' | 'complete' | 'error';

export interface AgentToolPayload {
  name: string;
  call_id?: string;
  args?: unknown;
  result?: unknown;
  elapsed_ms?: number;
}

export interface AgentStreamEvent {
  id: string;
  run_id: string;
  type: AgentEventType;
  status: AgentEventStatus;
  timestamp: string;
  title: string;
  summary: string;
  graph_node?: string;
  pydantic_model?: string;
  tool?: AgentToolPayload;
  delta?: string;
  metadata?: Record<string, unknown>;
}

export interface TraceToolView {
  name: string;
  input: string;
  output?: string;
  elapsedMs?: number;
}

export interface TraceEventView {
  id: string;
  kind: Exclude<AgentEventType, 'answer_delta' | 'run_complete' | 'error'>;
  title: string;
  summary: string;
  timestamp: string;
  status: Exclude<AgentEventStatus, 'error'>;
  graphNode?: string;
  pydanticModel?: string;
  tool?: TraceToolView;
  metadata: Record<string, unknown>;
}

function prettyJson(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value ?? {}, null, 2);
}

export function normalizeAgentEvent(event: AgentStreamEvent): TraceEventView | null {
  if (event.type === 'answer_delta' || event.type === 'run_complete' || event.type === 'error') {
    return null;
  }

  return {
    id: event.id,
    kind: event.type,
    title: event.title,
    summary: event.summary,
    timestamp: new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(event.timestamp)),
    status: event.status === 'error' ? 'queued' : event.status,
    graphNode: event.graph_node,
    pydanticModel: event.pydantic_model,
    tool: event.tool
      ? {
          name: event.tool.name,
          input: prettyJson(event.tool.args),
          output: event.tool.result === undefined ? undefined : prettyJson(event.tool.result),
          elapsedMs: event.tool.elapsed_ms,
        }
      : undefined,
    metadata: {
      run_id: event.run_id,
      event_id: event.id,
      event_type: event.type,
      graph_node: event.graph_node,
      pydantic_model: event.pydantic_model,
      ...event.metadata,
    },
  };
}
