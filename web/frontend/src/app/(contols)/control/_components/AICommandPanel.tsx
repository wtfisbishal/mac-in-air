'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, CheckCircle2, XCircle,
  Loader2, Clock, ChevronDown, ChevronUp,
  Zap, Trash2, Bot,
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import type { NodeStatus } from '@/types/task';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanNode {
  id: string;
  action: string;
  type: string;
  label?: string;
  params?: Record<string, unknown>;
  dependsOn: string[];
}

interface ClientNode extends PlanNode {
  status: NodeStatus;
  error?: string;
}

interface HistoryEntry {
  id: string;
  input: string;
  timestamp: string;
  overallStatus: 'planning' | 'running' | 'completed' | 'failed';
  nodes: ClientNode[];
  durationMs?: number;
  planError?: string;
}

// ---------------------------------------------------------------------------
// Action → Socket command mapping
// Mirrors what the control page does via emit('command', { type, payload })
// ---------------------------------------------------------------------------

// All actions supported by the desktop agent (computer + browser via Playwright)
const ACTION_MAP: Record<string, string> = {
  // Computer
  open_app:    'OPEN_APP',
  key_press:   'KEY_PRESS',
  run_command: 'RUN_COMMAND',
  save_file:   'SAVE_FILE',
  screenshot:  'SCREENSHOT',
  mouse_click: 'MOUSE_CLICK',
  mouse_move:  'MOUSE_MOVE',
  lock_screen: 'LOCK_SCREEN',
  sleep:       'SLEEP',
  // Browser (Playwright)
  open_url:    'OPEN_URL',
  navigate:    'NAVIGATE',
  click:       'CLICK',
  type_text:   'TYPE_TEXT',
  scroll:      'SCROLL',
  wait:        'WAIT',
  key_press_browser: 'KEY_PRESS_BROWSER',
};

function nodeToSocketCommand(node: PlanNode): { type: string; payload: Record<string, unknown> } {
  const params = node.params ?? {};
  const type = ACTION_MAP[node.action.toLowerCase()]
    ?? node.action.toUpperCase().replace(/ /g, '_');
  return { type, payload: params };
}

// ---------------------------------------------------------------------------
// Execute a single node over Socket.IO (same as control page)
// ---------------------------------------------------------------------------

function executeNodeViaSocket(
  node: PlanNode,
  deviceId: string
): Promise<{ success: boolean; message?: string }> {
  return new Promise((resolve) => {
    const socket = getSocket();
    const { type, payload } = nodeToSocketCommand(node);

    console.log(`[AIPanel] socket.emit command type=${type}`, payload);

    socket.emit(
      'command',
      { type, payload, deviceId },
      (result?: { success: boolean; message?: string }) => {
        resolve(result ?? { success: true });
      }
    );

    // Timeout after 30 s
    setTimeout(() => resolve({ success: true, message: 'no-ack' }), 30_000);
  });
}

// ---------------------------------------------------------------------------
// DAG executor — client-side
// ---------------------------------------------------------------------------

async function runGraph(
  nodes: PlanNode[],
  deviceId: string,
  onUpdate: (nodes: ClientNode[]) => void
): Promise<ClientNode[]> {
  const state: ClientNode[] = nodes.map(n => ({ ...n, status: 'pending' as NodeStatus }));
  onUpdate([...state]);

  const MAX_ITERATIONS = nodes.length * 2 + 5;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const allDone = state.every(n => n.status === 'completed' || n.status === 'failed');
    if (allDone) break;

    const ready = state.filter(
      n =>
        n.status === 'pending' &&
        n.dependsOn.every(depId => state.find(d => d.id === depId)?.status === 'completed')
    );

    if (ready.length === 0) break;

    await Promise.all(
      ready.map(async (node) => {
        const idx = state.findIndex(n => n.id === node.id);

        state[idx] = { ...node, status: 'running' as NodeStatus };
        onUpdate([...state]);

        try {
          const result = await executeNodeViaSocket(node, deviceId);
          state[idx] = {
            ...state[idx],
            status: result.success ? 'completed' as NodeStatus : 'failed' as NodeStatus,
            error: result.success ? undefined : (result.message ?? 'Command failed'),
          };
        } catch (err) {
          state[idx] = {
            ...state[idx],
            status: 'failed' as NodeStatus,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }

        onUpdate([...state]);

        // Longer delay for browser steps (navigation takes time)
        const isBrowser = node.type === 'browser';
        await sleep(isBrowser ? 2000 : 1200);
      })
    );

    // Fail-fast on hard failures
    const hardFail = state.some(n => n.status === 'failed');
    if (hardFail) {
      state.forEach((n, i) => {
        if (n.status === 'pending') {
          state[i] = { ...n, status: 'failed' as NodeStatus, error: 'Blocked by failed step' };
        }
      });
      onUpdate([...state]);
      break;
    }
  }

  return state;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function NodeIcon({ status }: { status: NodeStatus }) {
  switch (status) {
    case 'completed': return <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />;
    case 'failed':    return <XCircle size={13} className="text-red-400 flex-shrink-0" />;
    case 'running':   return <Loader2 size={13} className="text-blue-400 animate-spin flex-shrink-0" />;
    default:          return <Clock size={13} className="text-slate-600 flex-shrink-0" />;
  }
}

function EntryIcon({ status }: { status: HistoryEntry['overallStatus'] }) {
  switch (status) {
    case 'completed': return <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />;
    case 'failed':    return <XCircle size={15} className="text-red-400 flex-shrink-0" />;
    default:          return <Loader2 size={15} className="text-blue-400 animate-spin flex-shrink-0" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AICommandPanel({ deviceId }: { deviceId: string }) {
  const [input, setInput]           = useState('');
  const [isRunning, setIsRunning]   = useState(false);
  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history]);

  const updateEntry = useCallback((id: string, patch: Partial<HistoryEntry>) => {
    setHistory(prev => prev.map(h => h.id !== id ? h : { ...h, ...patch }));
  }, []);

  // ── Execute ──────────────────────────────────────────────────────────────
  const execute = async () => {
    const trimmed = input.trim();
    if (!trimmed || isRunning) return;

    const id = `cmd_${Date.now()}`;
    const entry: HistoryEntry = {
      id, input: trimmed,
      timestamp: new Date().toISOString(),
      overallStatus: 'planning',
      nodes: [],
    };

    setHistory(prev => [...prev, entry]);
    setInput('');
    setIsRunning(true);
    setExpandedId(id);

    const t0 = Date.now();

    try {
      // ── 1. Plan (server-side, needs OpenAI) ──
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: trimmed }),
      });

      const planData = await planRes.json();

      if (!planRes.ok || planData.error) {
        updateEntry(id, { overallStatus: 'failed', planError: planData.error ?? 'Planning failed' });
        return;
      }

      const plannedNodes: PlanNode[] = planData.nodes;
      updateEntry(id, { overallStatus: 'running', nodes: plannedNodes.map(n => ({ ...n, status: 'pending' })) });

      // ── 2. Execute (client-side, via Socket.IO) ──
      const finalNodes = await runGraph(
        plannedNodes,
        deviceId,
        (nodes) => updateEntry(id, { nodes }),
      );

      const allOk = finalNodes.every(n => n.status === 'completed');
      updateEntry(id, {
        overallStatus: allOk ? 'completed' : 'failed',
        nodes: finalNodes,
        durationMs: Date.now() - t0,
      });

    } catch (err) {
      updateEntry(id, {
        overallStatus: 'failed',
        planError: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="glass-panel-dark rounded-3xl flex flex-col gap-0 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/30 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
            <Sparkles size={12} className="text-violet-400" />
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI Command</p>
        </div>
        {history.length > 0 && !isRunning && (
          <button
            onClick={() => { setHistory([]); setExpandedId(null); }}
            className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors text-slate-600 hover:text-slate-300"
            title="Clear"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); execute(); }} className="flex items-center gap-2 px-4 pb-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Tell AI what to do…"
          disabled={isRunning}
          className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!input.trim() || isRunning}
          className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-md shadow-violet-500/20"
        >
          {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Send size={12} />}
        </button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div ref={scrollRef} className="flex flex-col gap-1.5 overflow-y-auto px-3 pb-3" style={{ maxHeight: 320 }}>
          {history.map(entry => (
            <div key={entry.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">

              {/* Row */}
              <button
                onClick={() => setExpandedId(p => p === entry.id ? null : entry.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
              >
                <EntryIcon status={entry.overallStatus} />
                <span className="flex-1 text-[11px] text-slate-300 truncate font-medium">{entry.input}</span>
                {entry.durationMs !== undefined && (
                  <span className="text-[9px] text-slate-600 font-mono flex-shrink-0">
                    {entry.durationMs < 1000 ? `${entry.durationMs}ms` : `${(entry.durationMs / 1000).toFixed(1)}s`}
                  </span>
                )}
                {expandedId === entry.id
                  ? <ChevronUp size={11} className="text-slate-600 flex-shrink-0" />
                  : <ChevronDown size={11} className="text-slate-600 flex-shrink-0" />
                }
              </button>

              {/* Detail */}
              {expandedId === entry.id && (
                <div className="border-t border-white/[0.04] px-3 pb-3">

                  {/* Plan error */}
                  {entry.planError && (
                    <div className="mt-2 flex items-start gap-2 px-2 py-1.5 rounded-lg bg-red-500/[0.07] border border-red-500/10">
                      <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-red-300 leading-relaxed break-all">{entry.planError}</p>
                    </div>
                  )}

                  {/* Planning spinner */}
                  {entry.overallStatus === 'planning' && (
                    <div className="flex items-center gap-2 mt-3">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                      <p className="text-[10px] text-slate-500">Planning with AI…</p>
                    </div>
                  )}

                  {/* Node list */}
                  {entry.nodes.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {entry.nodes.map((node, i) => (
                        <div key={node.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors group">
                          <NodeIcon status={node.status} />
                          <span className="text-[9px] text-slate-600 font-mono w-3 text-right flex-shrink-0">{i + 1}</span>
                          <span className={`text-[11px] flex-1 truncate capitalize ${
                            node.status === 'completed' ? 'text-slate-300' :
                            node.status === 'failed'    ? 'text-red-300' :
                            node.status === 'running'   ? 'text-blue-300' : 'text-slate-600'
                          }`}>
                            {node.label ?? node.action.replace(/_/g, ' ')}
                          </span>
                          {node.error && (
                            <span className="text-[9px] text-red-400/60 truncate max-w-[70px]" title={node.error}>
                              {node.error}
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <Zap size={9} className="text-slate-600" />
                          <span className="text-[9px] text-slate-600">
                            {entry.nodes.filter(n => n.status === 'completed').length}/{entry.nodes.length} done
                          </span>
                        </div>
                        {entry.overallStatus === 'completed' && <span className="text-[9px] text-emerald-500 font-semibold">✓ Done</span>}
                        {entry.overallStatus === 'failed'    && <span className="text-[9px] text-red-500 font-semibold">✗ Failed</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div className="flex flex-col items-center py-5 gap-2 px-4">
          <Bot size={22} className="text-slate-700" />
          <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            Ask AI to perform tasks on your Mac
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center mt-1">
            {['Open Terminal', 'Open Safari', 'Open Spotify'].map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] hover:border-violet-500/20 transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
