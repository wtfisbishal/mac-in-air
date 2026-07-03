/**
 * Task Graph Builder — converts the flat array of PlannerSteps into
 * a proper DAG of TaskNodes ready for execution.
 *
 * Responsibilities:
 * - Assign unique string IDs
 * - Set initial status to "pending"
 * - Wire up dependency chains (sequential if none specified, otherwise
 *   honour explicit dependsOn from the planner)
 * - Validate that all dependency references point to real node IDs
 */

import type { PlannerStep, TaskNode, TaskGraph } from "@/types/task";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _execCounter = 0;

function nextExecutionId(): string {
  _execCounter += 1;
  return `exec_${Date.now()}_${_execCounter}`;
}

// ---------------------------------------------------------------------------
// Build graph
// ---------------------------------------------------------------------------

/**
 * Convert an ordered list of planner steps into a full {@link TaskGraph}.
 *
 * If a step has explicit `dependsOn`, those are used as-is.
 * Otherwise, the step depends on the immediately preceding step
 * (sequential fallback).
 */
export function buildGraph(
  steps: PlannerStep[],
  userInput: string
): TaskGraph {
  if (steps.length === 0) {
    throw new Error("Cannot build a graph from zero steps.");
  }

  const executionId = nextExecutionId();

  const nodes: TaskNode[] = steps.map((step, idx) => {
    const id = idx.toString();

    // Determine dependencies
    let dependsOn: string[];
    if (step.dependsOn && step.dependsOn.length > 0) {
      dependsOn = step.dependsOn;
    } else {
      // Default: sequential — depend on previous node (or nothing for first)
      dependsOn = idx === 0 ? [] : [(idx - 1).toString()];
    }

    return {
      id,
      type: step.type,
      action: step.action,
      dependsOn,
      status: "pending" as const,
      params: step.params,
      retryCount: 0,
      label: step.label ?? step.action,
    };
  });

  // ── Validate dependencies ──
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const node of nodes) {
    for (const dep of node.dependsOn) {
      if (!nodeIds.has(dep)) {
        throw new Error(
          `Node "${node.id}" depends on non-existent node "${dep}".`
        );
      }
    }
    // Self-dependency guard
    if (node.dependsOn.includes(node.id)) {
      throw new Error(`Node "${node.id}" depends on itself.`);
    }
  }

  // ── Detect cycles (topological sort via Kahn's algorithm) ──
  detectCycles(nodes);

  return {
    executionId,
    nodes,
    userInput,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Cycle detection
// ---------------------------------------------------------------------------

function detectCycles(nodes: TaskNode[]): void {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const node of nodes) {
    for (const dep of node.dependsOn) {
      // dep → node (dep must complete before node)
      adjacency.get(dep)!.push(node.id);
      inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited += 1;
    for (const neighbour of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbour) ?? 1) - 1;
      inDegree.set(neighbour, newDeg);
      if (newDeg === 0) queue.push(neighbour);
    }
  }

  if (visited !== nodes.length) {
    throw new Error(
      "Task graph contains a cycle — cannot execute. Check dependsOn references."
    );
  }
}
