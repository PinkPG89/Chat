<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import {
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
  Sparkles,
  Terminal,
  User,
} from '@lucide/vue';
import { mockAgentEvents, mockAgentRunId, mockAnswerText } from './data/mock-agent-run';
import { normalizeAgentEvent, type TraceEventView } from './types/agent-events';

const traceExpanded = ref(true);
const detailsOpen = ref<Record<string, boolean>>({ evt_002: true });
const liveCursor = ref<HTMLElement | null>(null);

const traceEvents = ref<TraceEventView[]>(
  mockAgentEvents.map(normalizeAgentEvent).filter((event): event is TraceEventView => event !== null),
);
const answerTokens = mockAnswerText.split(' ');

const completedCount = computed(() => traceEvents.value.filter((event) => event.status === 'complete').length);

function toggleDetails(id: string) {
  detailsOpen.value[id] = !detailsOpen.value[id];
}

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

function jsonMetadata(event: TraceEventView) {
  return JSON.stringify(event.metadata, null, 2);
}

watch(
  () => traceEvents.value.map((event) => `${event.id}:${event.status}`).join('|'),
  async () => {
    await nextTick();
    liveCursor.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
);

onMounted(() => {
  liveCursor.value?.scrollIntoView({ block: 'nearest' });
});
</script>

<template>
  <main class="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.12),transparent_30%),linear-gradient(145deg,#08111f_0%,#101827_45%,#0a0f19_100%)] px-4 py-6 text-console-text sm:px-6 lg:px-8">
    <div class="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl flex-col">
      <header class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg border border-console-line bg-console-raised shadow-glow">
            <Terminal class="h-4 w-4 text-console-cyan" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-console-muted">Agent Console</p>
            <p class="text-sm text-slate-400">Professional execution trace for agentic work</p>
          </div>
        </div>
        <div class="hidden items-center gap-2 rounded-full border border-console-line bg-console-panel/80 px-3 py-1.5 text-xs text-console-muted sm:flex">
          <span class="h-2 w-2 rounded-full bg-console-green shadow-[0_0_14px_rgba(134,239,172,0.8)]" />
          FastAPI stream
        </div>
      </header>

      <section class="flex flex-1 flex-col gap-5">
        <article class="ml-auto max-w-[82%] rounded-2xl rounded-tr-md border border-sky-300/20 bg-sky-400/10 px-5 py-4 shadow-panel">
          <div class="mb-2 flex items-center justify-end gap-2 text-xs text-sky-200/80">
            <User class="h-3.5 w-3.5" />
            You
          </div>
          <p class="text-sm leading-6 text-slate-100">
            Build an agentic AI chat UI that feels like a trusted developer tool, with visible working steps, tool activity,
            graph nodes, and a polished streaming answer state.
          </p>
        </article>

        <article class="glass-panel overflow-hidden rounded-2xl">
          <div class="border-b border-console-line/80 bg-white/[0.025] px-5 py-4 sm:px-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-teal-300/25 bg-teal-300/10">
                  <Bot class="h-5 w-5 text-console-cyan" />
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h1 class="text-base font-semibold text-white">Pydantic AI graph run</h1>
                    <span class="rounded-full border border-console-cyan/30 bg-console-cyan/10 px-2 py-0.5 text-[11px] font-medium text-console-cyan">
                      {{ completedCount }}/{{ traceEvents.length }} steps
                    </span>
                  </div>
                  <p class="mt-1 text-sm leading-6 text-console-muted">
                    Run {{ mockAgentRunId }} is rendered from typed FastAPI events with public execution summaries.
                  </p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span class="rounded-md border border-teal-300/20 bg-teal-300/10 px-2 py-1 text-[11px] font-medium text-teal-100">
                      Pydantic AI
                    </span>
                    <span class="rounded-md border border-blue-300/20 bg-blue-300/10 px-2 py-1 text-[11px] font-medium text-blue-100">
                      Graph nodes
                    </span>
                    <span class="rounded-md border border-amber-200/20 bg-amber-200/10 px-2 py-1 text-[11px] font-medium text-amber-100">
                      FastAPI SSE
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                  <Loader2 class="h-3.5 w-3.5 animate-spin" />
                  Finalizing
                </span>
              </div>
            </div>
          </div>

          <div class="px-5 py-5 sm:px-6">
            <button
              class="mb-4 flex w-full items-center justify-between rounded-lg border border-console-line bg-console-raised/70 px-4 py-3 text-left transition hover:border-slate-500/70 hover:bg-console-raised"
              type="button"
              :aria-expanded="traceExpanded"
              @click="traceExpanded = !traceExpanded"
            >
              <span class="flex items-center gap-3">
                <PanelRightOpen class="h-4 w-4 text-console-cyan" />
                <span>
                  <span class="block text-sm font-semibold text-white">Agent trace</span>
                  <span class="block text-xs text-console-muted">Pydantic events, tool calls, and graph nodes</span>
                </span>
              </span>
              <ChevronDown v-if="traceExpanded" class="h-4 w-4 text-console-muted" />
              <ChevronRight v-else class="h-4 w-4 text-console-muted" />
            </button>

            <div v-show="traceExpanded" class="relative max-h-[440px] overflow-y-auto pr-1">
              <div class="absolute bottom-4 left-[18px] top-1 w-px bg-gradient-to-b from-console-cyan/60 via-console-line to-transparent" />

              <div
                v-for="event in traceEvents"
                :key="event.id"
                class="relative grid grid-cols-[38px_1fr] gap-3 pb-5 last:pb-1"
              >
                <div class="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-console-panel"
                  :class="event.status === 'running' ? 'border-console-cyan/60 shadow-[0_0_24px_rgba(94,234,212,0.18)]' : 'border-console-line'"
                >
                  <span
                    v-if="event.status === 'running'"
                    class="absolute h-3 w-3 animate-ping rounded-full bg-console-cyan/70"
                  />
                  <Check v-if="event.status === 'complete'" class="h-4 w-4 text-console-green" />
                  <CircleDashed v-else-if="event.status === 'queued'" class="h-4 w-4 text-console-muted" />
                  <component :is="eventIcon(event.kind)" v-else class="relative h-4 w-4 text-console-cyan" />
                </div>

                <div class="rounded-xl border border-console-line/80 bg-console-panel/64 p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <h2 class="text-sm font-semibold text-white">{{ event.title }}</h2>
                        <span
                          v-if="event.graphNode"
                          class="inline-flex items-center gap-1 rounded-md border border-blue-300/25 bg-blue-300/10 px-2 py-0.5 text-[11px] font-medium text-blue-100"
                        >
                          <Code2 class="h-3 w-3" />
                          {{ event.graphNode }}
                        </span>
                        <span
                          v-if="event.pydanticModel"
                          class="rounded-md border border-teal-300/20 bg-teal-300/10 px-2 py-0.5 text-[11px] font-medium text-teal-100"
                        >
                          {{ event.pydanticModel }}
                        </span>
                      </div>
                      <p class="mt-1 text-sm leading-6 text-console-muted">{{ event.summary }}</p>
                    </div>
                    <time class="shrink-0 text-xs tabular-nums text-slate-500">{{ event.timestamp }}</time>
                  </div>

                  <div
                    v-if="event.tool"
                    class="mt-3 rounded-lg border border-console-cyan/25 bg-[#071725]/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <span class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-console-cyan">
                        <Search class="h-3.5 w-3.5" />
                        tool_call · {{ event.tool.name }}
                      </span>
                      <span class="rounded-full bg-console-green/10 px-2 py-0.5 text-[11px] text-console-green">
                        {{ event.tool.elapsedMs ? `${event.tool.elapsedMs}ms` : 'completed' }}
                      </span>
                    </div>
                    <div class="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                      <pre class="overflow-x-auto rounded-md bg-black/24 p-3">{{ event.tool.input }}</pre>
                      <pre class="overflow-x-auto rounded-md bg-black/24 p-3">{{ event.tool.output }}</pre>
                    </div>
                  </div>

                  <div class="mt-3">
                    <button
                      class="inline-flex items-center gap-2 rounded-md border border-console-line px-2.5 py-1.5 text-xs font-medium text-console-muted transition hover:border-console-cyan/40 hover:text-console-text"
                      type="button"
                      @click="toggleDetails(event.id)"
                    >
                      <ChevronDown v-if="detailsOpen[event.id]" class="h-3.5 w-3.5" />
                      <ChevronRight v-else class="h-3.5 w-3.5" />
                      Show details
                    </button>
                    <pre
                      v-if="detailsOpen[event.id]"
                      class="mt-2 max-h-40 overflow-auto rounded-lg border border-console-line/70 bg-black/25 p-3 text-xs leading-5 text-slate-300"
                    >{{ jsonMetadata(event) }}</pre>
                  </div>
                </div>
              </div>
              <div ref="liveCursor" />
            </div>

            <section class="mt-5 rounded-xl border border-console-line bg-[#0a1321]/72 p-4">
              <div class="mb-3 flex items-center justify-between">
                <h2 class="text-sm font-semibold text-white">Final answer</h2>
                <div class="relative overflow-hidden rounded-full border border-console-line bg-console-raised px-3 py-1 text-[11px] text-console-muted">
                  <span class="absolute inset-y-0 left-0 w-1/2 animate-scan bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span class="relative">streaming</span>
                </div>
              </div>
              <p class="text-sm leading-7 text-slate-200">
                <span
                  v-for="(token, index) in answerTokens"
                  :key="`${token}-${index}`"
                  class="token-word mr-1"
                  :style="{ animationDelay: `${index * 58}ms` }"
                >
                  {{ token }}
                </span>
                <span class="ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-console-cyan" />
              </p>
            </section>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>
