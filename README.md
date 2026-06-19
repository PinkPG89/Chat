# AIOps Chat UI

Vue/Vite 기반 AIOps Agent 콘솔 UI입니다. 사용자가 장애 질문을 입력하면 Agent API에 run을 생성하고, SSE로 내려오는 reasoning trace와 final answer delta를 렌더링합니다.

## Architecture

```text
Browser
  -> Vite dev server
  -> /api proxy
  -> Agent FastAPI

Browser
  <- EventSource /api/runs/{run_id}/events
  <- typed AgentStreamEvent
```

The UI does not call LiteLLM or MCP directly. It only talks to the Agent API.

## Directory Structure

```text
Chat/
  start.sh
  vite.config.ts              # /api proxy to Agent on localhost:8010
  src/
    App.vue                   # chat layout, trace panel, SSE state handling
    lib/fastapi-stream.ts     # POST /api/runs and EventSource helper
    types/agent-events.ts     # AgentStreamEvent and trace view normalization
    dev/fixtures/
      mock-agent-run.ts       # legacy mock data, no longer used by App.vue
```

## Run

```bash
cd /data/Ai-Workspace/Chat
./start.sh
```

Default port:

```text
55173
```

URLs:

```text
Local:     http://localhost:55173/
Tailscale: http://100.82.71.91:55173/
```

Use a different port:

```bash
./start.sh 55174
```

## API Dependency

The UI expects Agent API on:

```text
http://localhost:8010
```

Vite proxies these paths:

```text
POST /api/runs
GET  /api/runs/{run_id}/events
```

Start Agent first:

```bash
cd /data/Ai-Workspace/Agent
./start.sh actual
```

For full actual-mode testing, start MCP first:

```bash
cd /data/Ai-Workspace/MCP
./start.sh all
```

## Verification

Build:

```bash
npm run build
```

Manual test prompt:

```text
Immich가 모바일에서 접속이 안 돼. Tailscale은 되는 것 같아.
```

Expected trace:

```text
planning
tool_call: network
tool_result: network
tool_call: docker
tool_result: docker
answer_delta
run_complete
```

## Notes

- `src/dev/fixtures/mock-agent-run.ts` is legacy sample data from the first UI prototype.
- Current `App.vue` starts empty and only renders data from real Agent API events.
- Mobile access should use the Tailscale URL when normal LAN IP is unreachable.
