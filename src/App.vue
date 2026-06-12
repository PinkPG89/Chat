<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Code2,
  FileSearch,
  GitBranch,
  Layers3,
  Loader2,
  PanelRightOpen,
  Play,
  Search,
  Send,
  Sparkles,
  Terminal,
  User,
} from '@lucide/vue';
import { createFastApiAgentRun, connectFastApiAgentStream } from './lib/fastapi-stream';
import { normalizeAgentEvent, type AgentStreamEvent, type TraceEventView } from './types/agent-events';

interface ChatTurn {
  id: string;
  query: string;
  answer: string;
  runId?: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  error?: string;
}

const defaultPrompt = '배포 이후 결제 API latency가 급증하고 500 오류가 늘었어. 원인 찾아줘.';

const input = ref(defaultPrompt);
const contextInput = ref('');
const traceExpanded = ref(true);
const detailsOpen = ref<Record<string, boolean>>({});
const liveCursor = ref<HTMLElement | null>(null);
const messagesEnd = ref<HTMLElement | null>(null);
const traceEvents = ref<TraceEventView[]>([]);
const rawEvents = ref<AgentStreamEvent[]>([]);
const currentTurn = ref<ChatTurn | null>(null);
const turns = ref<ChatTurn[]>([]);
const streamStop = ref<(() => void) | null>(null);

const isRunning = computed(() => currentTurn.value?.status === 'running');
const completedCount = computed(() => traceEvents.value.filter((event) => event.status === 'complete').length);
const currentRunId = computed(() => currentTurn.value?.runId ?? 'no active run');
const streamStateLabel = computed(() => {
  if (currentTurn.value?.status === 'running') return 'Streaming';
  if (currentTurn.value?.status === 'complete') return 'Complete';
  if (currentTurn.value?.status === 'error') return 'Error';
  return 'Ready';
});

function eventIcon(kind: TraceEventView['kind']) {
  const icons = {
    planning: Layers3,
    graph_node_start: Play,
    tool_call: Search,
    tool_result: FileSearch,
    graph_node_end: GitBranch,
    finalizing: Sparkles,
  };

  return icons[kind];
}

function toggleDetails(id: string) {
  detailsOpen.value[id] = !detailsOpen.value[id];
}

function jsonMetadata(event: TraceEventView) {
  return JSON.stringify(event.metadata, null, 2);
}

function resetRunState() {
  streamStop.value?.();
  streamStop.value = null;
  traceEvents.value = [];
  rawEvents.value = [];
  detailsOpen.value = {};
}

function createClientId() {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `turn_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function applyAgentEvent(event: AgentStreamEvent) {
  rawEvents.value.push(event);

  if (event.type === 'answer_delta') {
    if (currentTurn.value) {
      currentTurn.value.answer += event.delta ?? event.summary;
    }
    return;
  }

  if (event.type === 'error') {
    if (currentTurn.value) {
      currentTurn.value.status = 'error';
      currentTurn.value.error = event.summary;
    }
    return;
  }

  if (event.type === 'run_complete') {
    if (currentTurn.value) {
      currentTurn.value.status = 'complete';
    }
    streamStop.value?.();
    streamStop.value = null;
    return;
  }

  const normalized = normalizeAgentEvent(event);
  if (normalized) {
    traceEvents.value.push(normalized);
    if (traceEvents.value.length === 1 || normalized.tool) {
      detailsOpen.value[normalized.id] = Boolean(normalized.tool);
    }
  }
}

async function submitRun() {
  const query = input.value.trim();
  if (!query || isRunning.value) return;

  resetRunState();

  const turn: ChatTurn = {
    id: createClientId(),
    query,
    answer: '',
    status: 'running',
  };
  currentTurn.value = turn;
  turns.value.push(turn);
  try {
    const run = await createFastApiAgentRun({
      query,
      context: contextInput.value.trim() || undefined,
    });
    turn.runId = run.run_id;
    streamStop.value = connectFastApiAgentStream(run.run_id, {
      onEvent: applyAgentEvent,
      onError: () => {
        if (turn.status === 'running') {
          turn.status = 'error';
          turn.error = 'SSE connection failed. Agent API가 실행 중인지 확인하세요.';
        }
      },
    });
    input.value = '';
  } catch (error) {
    turn.status = 'error';
    turn.error = error instanceof Error ? error.message : 'Failed to create agent run.';
  }
}

function submitOnEnter(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    void submitRun();
  }
}

watch(
  () => traceEvents.value.map((event) => `${event.id}:${event.status}`).join('|'),
  async () => {
    await nextTick();
    liveCursor.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
);

watch(
  () => currentTurn.value?.answer,
  async () => {
    await nextTick();
    messagesEnd.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
);

onBeforeUnmount(() => {
  streamStop.value?.();
});
</script>

<template>
  <main class="min-h-screen bg-[#08111f] px-4 py-5 text-console-text sm:px-6 lg:px-8">
    <div class="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl grid-rows-[auto_1fr_auto] gap-4">
      <header class="flex flex-col gap-3 border-b border-console-line/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg border border-console-line bg-console-raised shadow-glow">
            <Terminal class="h-4 w-4 text-console-cyan" />
          </div>
          <div>
            <h1 class="text-sm font-semibold text-white">AIOps Agent Console</h1>
            <p class="text-xs text-console-muted">Supervisor trace, delegated tools, and streaming answer</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="inline-flex items-center gap-2 rounded-md border border-console-line bg-console-panel px-2.5 py-1.5 text-console-muted">
            <span
              class="h-2 w-2 rounded-full"
              :class="isRunning ? 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.75)]' : 'bg-console-green shadow-[0_0_12px_rgba(134,239,172,0.65)]'"
            />
            {{ streamStateLabel }}
          </span>
          <span class="rounded-md border border-console-line bg-console-panel px-2.5 py-1.5 text-console-muted">
            {{ currentRunId }}
          </span>
        </div>
      </header>

      <section class="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div class="flex min-h-0 flex-col rounded-lg border border-console-line bg-console-panel/72">
          <div class="border-b border-console-line px-4 py-3">
            <div class="flex items-center gap-2 text-sm font-semibold text-white">
              <Bot class="h-4 w-4 text-console-cyan" />
              Chat
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div v-if="turns.length === 0" class="flex h-full items-center justify-center">
              <div class="max-w-lg text-center">
                <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-console-cyan/30 bg-console-cyan/10">
                  <Sparkles class="h-5 w-5 text-console-cyan" />
                </div>
                <p class="text-sm font-semibold text-white">장애 상황을 입력하면 Supervisor가 도메인 에이전트를 호출합니다.</p>
                <p class="mt-2 text-sm leading-6 text-console-muted">
                  CD, Log, Metric, APM 같은 서브 에이전트 호출 상태가 오른쪽 trace에 실시간으로 쌓입니다.
                </p>
              </div>
            </div>

            <div v-else class="space-y-5">
              <article v-for="turn in turns" :key="turn.id" class="space-y-3">
                <div class="ml-auto max-w-[88%] rounded-lg rounded-tr-sm border border-sky-300/20 bg-sky-400/10 px-4 py-3">
                  <div class="mb-2 flex items-center justify-end gap-2 text-xs text-sky-200/80">
                    <User class="h-3.5 w-3.5" />
                    You
                  </div>
                  <p class="whitespace-pre-wrap text-sm leading-6 text-slate-100">{{ turn.query }}</p>
                </div>

                <div class="max-w-[92%] rounded-lg rounded-tl-sm border border-console-line bg-[#0a1321] px-4 py-3">
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2 text-xs text-console-muted">
                      <Bot class="h-3.5 w-3.5 text-console-cyan" />
                      Supervisor
                    </div>
                    <span
                      class="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
                      :class="turn.status === 'error' ? 'border-red-300/25 bg-red-300/10 text-red-100' : 'border-console-line bg-console-raised text-console-muted'"
                    >
                      <Loader2 v-if="turn.status === 'running'" class="h-3 w-3 animate-spin" />
                      <Check v-else-if="turn.status === 'complete'" class="h-3 w-3 text-console-green" />
                      <AlertCircle v-else-if="turn.status === 'error'" class="h-3 w-3" />
                      {{ turn.status }}
                    </span>
                  </div>
                  <p v-if="turn.answer" class="whitespace-pre-wrap text-sm leading-7 text-slate-200">{{ turn.answer }}</p>
                  <p v-else-if="turn.error" class="text-sm leading-6 text-red-100">{{ turn.error }}</p>
                  <p v-else class="text-sm leading-6 text-console-muted">Waiting for streamed answer...</p>
                </div>
              </article>
              <div ref="messagesEnd" />
            </div>
          </div>
        </div>

        <aside class="flex min-h-0 flex-col rounded-lg border border-console-line bg-console-panel/72">
          <button
            class="flex items-center justify-between border-b border-console-line px-4 py-3 text-left"
            type="button"
            :aria-expanded="traceExpanded"
            @click="traceExpanded = !traceExpanded"
          >
            <span class="flex items-center gap-3">
              <PanelRightOpen class="h-4 w-4 text-console-cyan" />
              <span>
                <span class="block text-sm font-semibold text-white">Agent Trace</span>
                <span class="block text-xs text-console-muted">{{ completedCount }}/{{ traceEvents.length }} visible steps</span>
              </span>
            </span>
            <ChevronDown v-if="traceExpanded" class="h-4 w-4 text-console-muted" />
            <ChevronRight v-else class="h-4 w-4 text-console-muted" />
          </button>

          <div v-show="traceExpanded" class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div v-if="traceEvents.length === 0" class="rounded-lg border border-dashed border-console-line p-4 text-sm leading-6 text-console-muted">
              아직 실행 trace가 없습니다.
            </div>

            <div v-else class="relative">
              <div class="absolute bottom-4 left-[18px] top-1 w-px bg-gradient-to-b from-console-cyan/60 via-console-line to-transparent" />

              <div v-for="event in traceEvents" :key="event.id" class="relative grid grid-cols-[38px_1fr] gap-3 pb-5 last:pb-1">
                <div
                  class="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-console-panel"
                  :class="event.status === 'running' ? 'border-console-cyan/60 shadow-[0_0_24px_rgba(94,234,212,0.18)]' : 'border-console-line'"
                >
                  <span v-if="event.status === 'running'" class="absolute h-3 w-3 animate-ping rounded-full bg-console-cyan/70" />
                  <Check v-if="event.status === 'complete'" class="h-4 w-4 text-console-green" />
                  <CircleDashed v-else-if="event.status === 'queued'" class="h-4 w-4 text-console-muted" />
                  <component :is="eventIcon(event.kind)" v-else class="relative h-4 w-4 text-console-cyan" />
                </div>

                <div class="rounded-lg border border-console-line/80 bg-[#0a1321]/82 p-3">
                  <div class="flex flex-col gap-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-sm font-semibold text-white">{{ event.title }}</h2>
                      <span v-if="event.graphNode" class="inline-flex items-center gap-1 rounded-md border border-blue-300/25 bg-blue-300/10 px-2 py-0.5 text-[11px] font-medium text-blue-100">
                        <Code2 class="h-3 w-3" />
                        {{ event.graphNode }}
                      </span>
                    </div>
                    <p class="text-sm leading-6 text-console-muted">{{ event.summary }}</p>
                    <time class="text-xs tabular-nums text-slate-500">{{ event.timestamp }}</time>
                  </div>

                  <div v-if="event.tool" class="mt-3 rounded-lg border border-console-cyan/25 bg-[#071725]/80 p-3">
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <span class="flex items-center gap-2 text-xs font-semibold uppercase text-console-cyan">
                        <Search class="h-3.5 w-3.5" />
                        {{ event.tool.name }}
                      </span>
                      <span class="rounded-md bg-console-green/10 px-2 py-0.5 text-[11px] text-console-green">
                        {{ event.tool.elapsedMs ? `${event.tool.elapsedMs}ms` : 'pending' }}
                      </span>
                    </div>
                    <div class="grid gap-2 text-xs text-slate-300">
                      <pre class="max-h-36 overflow-auto rounded-md bg-black/24 p-3">{{ event.tool.input }}</pre>
                      <pre v-if="event.tool.output" class="max-h-36 overflow-auto rounded-md bg-black/24 p-3">{{ event.tool.output }}</pre>
                    </div>
                  </div>

                  <button
                    class="mt-3 inline-flex items-center gap-2 rounded-md border border-console-line px-2.5 py-1.5 text-xs font-medium text-console-muted transition hover:border-console-cyan/40 hover:text-console-text"
                    type="button"
                    @click="toggleDetails(event.id)"
                  >
                    <ChevronDown v-if="detailsOpen[event.id]" class="h-3.5 w-3.5" />
                    <ChevronRight v-else class="h-3.5 w-3.5" />
                    Details
                  </button>
                  <pre v-if="detailsOpen[event.id]" class="mt-2 max-h-40 overflow-auto rounded-lg border border-console-line/70 bg-black/25 p-3 text-xs leading-5 text-slate-300">{{ jsonMetadata(event) }}</pre>
                </div>
              </div>
              <div ref="liveCursor" />
            </div>
          </div>
        </aside>
      </section>

      <form class="rounded-lg border border-console-line bg-console-panel/88 p-3" @submit.prevent="submitRun">
        <label class="sr-only" for="agent-context">Context</label>
        <textarea
          id="agent-context"
          v-model="contextInput"
          class="mb-2 min-h-10 w-full resize-y rounded-md border border-console-line bg-[#07111f] px-3 py-2 text-xs leading-5 text-slate-300 outline-none transition placeholder:text-slate-600 focus:border-console-cyan/60"
          placeholder="선택 사항: 시간 범위, 서비스명, 환경(prod/stage), 이미 확인한 단서"
          rows="2"
        />
        <div class="flex gap-2">
          <label class="sr-only" for="agent-message">Message</label>
          <textarea
            id="agent-message"
            v-model="input"
            class="min-h-12 flex-1 resize-none rounded-md border border-console-line bg-[#07111f] px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-console-cyan/60"
            placeholder="장애 상황을 입력하세요"
            rows="2"
            :disabled="isRunning"
            @keydown="submitOnEnter"
          />
          <button
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-console-cyan/35 bg-console-cyan/12 text-console-cyan transition hover:bg-console-cyan/18 disabled:cursor-not-allowed disabled:opacity-45"
            type="submit"
            :disabled="isRunning || !input.trim()"
            title="Send"
          >
            <Loader2 v-if="isRunning" class="h-4 w-4 animate-spin" />
            <Send v-else class="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  </main>
</template>
