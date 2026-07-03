/**
 * Task DAG type definitions for Mac in Wind.
 *
 * These types describe the nodes, graph structure, and execution
 * progress that flow through the planner → graph-builder → executor
 * pipeline.
 */

// ---------------------------------------------------------------------------
// Node primitives
// ---------------------------------------------------------------------------

/** The kind of work a task node performs. */
export type NodeType = "browser" | "computer" | "api" | "decision";

/** Execution status of a single task node. */
export type NodeStatus = "pending" | "running" | "completed" | "failed";

/** A single node in the task DAG. */
export interface TaskNode {
  /** Unique identifier (usually a stringified index or UUID). */
  id: string;

  /** What category of agent handles this node. */
  type: NodeType;

  /** The concrete action the agent should perform (e.g. "open_url"). */
  action: string;

  /** IDs of nodes that must complete before this one can start. */
  dependsOn: string[];

  /** Current execution status. */
  status: NodeStatus;

  /** Arbitrary key-value params forwarded to the agent. */
  params?: Record<string, unknown>;

  /** How many times this node has been retried after failure. */
  retryCount?: number;

  /** Maximum retries allowed (overrides the executor default). */
  maxRetries?: number;

  /** Human-readable label shown in progress UI. */
  label?: string;

  /** Result data returned by the agent after successful execution. */
  result?: unknown;

  /** Error message if the node failed. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Raw planner output (what the LLM returns)
// ---------------------------------------------------------------------------

/** A single step as returned by the AI planner — before graph-builder enriches it. */
export interface PlannerStep {
  action: string;
  type: NodeType;
  params?: Record<string, unknown>;
  dependsOn?: string[];
  label?: string;
}

// ---------------------------------------------------------------------------
// Graph & execution
// ---------------------------------------------------------------------------

/** A complete task graph (just the node array + a unique execution id). */
export interface TaskGraph {
  /** Unique execution identifier. */
  executionId: string;
  /** The ordered list of task nodes. */
  nodes: TaskNode[];
  /** Original user input that produced this graph. */
  userInput: string;
  /** ISO timestamp of when the graph was created. */
  createdAt: string;
}

/** Emitted by the executor as each node transitions. */
export interface TaskProgress {
  executionId: string;
  nodeId: string;
  status: NodeStatus;
  /** Progress message (e.g. "Opening Safari…"). */
  message?: string;
  /** Timestamp of this progress event. */
  timestamp: string;
}

/** Final result returned after an execution completes. */
export interface ExecutionResult {
  executionId: string;
  success: boolean;
  /** Per-node summaries. */
  nodes: Pick<TaskNode, "id" | "action" | "status" | "error" | "result">[];
  /** Total wall-clock time in ms. */
  durationMs: number;
}
