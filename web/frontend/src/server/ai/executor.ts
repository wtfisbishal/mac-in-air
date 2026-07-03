/**
 * DAG Executor — walks the task graph, executing nodes whose
 * dependencies are satisfied, in parallel where possible.
 *
 * Features:
 * - Parallel execution of independent nodes
 * - Configurable retry logic per node
 * - Progress callback for real-time UI updates
 * - Fail-fast: stops scheduling new nodes once any node fails
 */

import type {
  TaskNode,
  TaskGraph,
  TaskProgress,
  ExecutionResult,
} from "@/types/task";
import { runAgent } from "@/server/ai/node-runner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Callback invoked whenever a node's status changes. */
export type ProgressCallback = (progress: TaskProgress) => void;

export interface ExecutorOptions {
  /** Default max retries for nodes that don't specify their own. */
  maxRetries?: number;
  /** Called on every status transition. */
  onProgress?: ProgressCallback;
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export class DAGExecutor {
  private maxRetries: number;
  private onProgress?: ProgressCallback;

  constructor(options: ExecutorOptions = {}) {
    this.maxRetries = options.maxRetries ?? 2;
    this.onProgress = options.onProgress;
  }

  // ── Public entry point ──────────────────────────────────────────────────

  /**
   * Run every node in the graph, respecting dependency order.
   *
   * Returns an {@link ExecutionResult} summarising outcomes.
   */
  async run(graph: TaskGraph, deviceId: string): Promise<ExecutionResult> {
    const start = Date.now();
    const { nodes, executionId } = graph;

    // Main loop — keep going while there are actionable nodes
    while (true) {
      // Nodes ready to run: pending + all deps completed
      const ready = nodes.filter(
        (n) =>
          n.status === "pending" &&
          n.dependsOn.every(
            (depId) =>
              nodes.find((d) => d.id === depId)?.status === "completed"
          )
      );

      if (ready.length === 0) {
        // Nothing more to schedule — either everything is done or
        // remaining nodes are blocked by a failed dependency.
        break;
      }

      // Execute all ready nodes in parallel
      await Promise.all(
        ready.map((node) => this.executeNode(node, nodes, executionId, deviceId))
      );

      // Check if any node failed — fail-fast
      const hasFailed = nodes.some((n) => n.status === "failed");
      if (hasFailed) {
        // Mark any still-pending nodes as failed (blocked)
        for (const n of nodes) {
          if (n.status === "pending") {
            n.status = "failed";
            n.error = "Blocked by a failed dependency.";
            this.emitProgress(executionId, n, "Blocked — upstream failure.");
          }
        }
        break;
      }
    }

    const durationMs = Date.now() - start;
    const allCompleted = nodes.every((n) => n.status === "completed");

    return {
      executionId,
      success: allCompleted,
      nodes: nodes.map((n) => ({
        id: n.id,
        action: n.action,
        status: n.status,
        error: n.error,
        result: n.result,
      })),
      durationMs,
    };
  }

  // ── Execute a single node (with retries) ────────────────────────────────

  private async executeNode(
    node: TaskNode,
    allNodes: TaskNode[],
    executionId: string,
    deviceId: string
  ): Promise<void> {
    const maxRetries = node.maxRetries ?? this.maxRetries;

    node.status = "running";
    node.retryCount = 0;
    this.emitProgress(executionId, node, `Running: ${node.label ?? node.action}`);

    while (true) {
      try {
        const result = await runAgent(node, deviceId);
        node.status = "completed";
        node.result = result.data;
        this.emitProgress(
          executionId,
          node,
          `Completed: ${node.label ?? node.action}`
        );
        return;
      } catch (err) {
        node.retryCount = (node.retryCount ?? 0) + 1;

        if (node.retryCount > maxRetries) {
          node.status = "failed";
          node.error =
            err instanceof Error ? err.message : String(err);
          this.emitProgress(
            executionId,
            node,
            `Failed after ${node.retryCount} attempt(s): ${node.error}`
          );
          return;
        }

        // Retry — brief back-off
        const backoff = Math.min(1000 * node.retryCount, 5000);
        this.emitProgress(
          executionId,
          node,
          `Retry ${node.retryCount}/${maxRetries} in ${backoff}ms…`
        );
        await sleep(backoff);
      }
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private emitProgress(
    executionId: string,
    node: TaskNode,
    message: string
  ): void {
    this.onProgress?.({
      executionId,
      nodeId: node.id,
      status: node.status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
