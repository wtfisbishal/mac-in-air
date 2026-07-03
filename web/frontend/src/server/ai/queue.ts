/**
 * Task Queue — simple in-memory store for task graph executions.
 *
 * Tracks active and completed executions so the API / frontend
 * can poll for status.
 *
 * NOTE: This is ephemeral — a server restart clears the queue.
 * For production, swap with Redis / DB-backed persistence.
 */

import type { TaskGraph, ExecutionResult, TaskProgress } from "@/types/task";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QueueStatus = "queued" | "running" | "completed" | "failed";

export interface QueueEntry {
  /** Matches the TaskGraph's executionId. */
  executionId: string;
  /** Current high-level status. */
  status: QueueStatus;
  /** The full task graph (nodes + metadata). */
  graph: TaskGraph;
  /** Final result (set once execution finishes). */
  result?: ExecutionResult;
  /** Progress events collected during execution. */
  progress: TaskProgress[];
  /** ISO timestamp when the entry was created. */
  createdAt: string;
  /** ISO timestamp when the entry last changed. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const _store = new Map<string, QueueEntry>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enqueue a new task graph for execution.
 */
export function enqueue(graph: TaskGraph): QueueEntry {
  const now = new Date().toISOString();
  const entry: QueueEntry = {
    executionId: graph.executionId,
    status: "queued",
    graph,
    progress: [],
    createdAt: now,
    updatedAt: now,
  };
  _store.set(graph.executionId, entry);
  return entry;
}

/**
 * Mark an execution as running.
 */
export function markRunning(executionId: string): void {
  const entry = _store.get(executionId);
  if (entry) {
    entry.status = "running";
    entry.updatedAt = new Date().toISOString();
  }
}

/**
 * Record a progress event.
 */
export function addProgress(progress: TaskProgress): void {
  const entry = _store.get(progress.executionId);
  if (entry) {
    entry.progress.push(progress);
    entry.updatedAt = progress.timestamp;
  }
}

/**
 * Mark an execution as completed (or failed) and store the result.
 */
export function markCompleted(
  executionId: string,
  result: ExecutionResult
): void {
  const entry = _store.get(executionId);
  if (entry) {
    entry.status = result.success ? "completed" : "failed";
    entry.result = result;
    entry.updatedAt = new Date().toISOString();
  }
}

/**
 * Retrieve a single entry by execution ID.
 */
export function getStatus(executionId: string): QueueEntry | undefined {
  return _store.get(executionId);
}

/**
 * Retrieve all entries (most recent first).
 */
export function getAllTasks(): QueueEntry[] {
  return [..._store.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Remove a completed / failed entry from the queue.
 */
export function dequeue(executionId: string): QueueEntry | undefined {
  const entry = _store.get(executionId);
  if (entry) _store.delete(executionId);
  return entry;
}

/**
 * Clear all entries. Useful for testing / cleanup.
 */
export function clearAll(): void {
  _store.clear();
}
