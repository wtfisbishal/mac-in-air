/**
 * POST /api/execute-command
 *
 * Orchestrates the full DAG pipeline:
 *   1. Planner — AI decomposes user input into steps
 *   2. Graph Builder — wires steps into a DAG
 *   3. DAG Executor — runs the graph, respecting dependencies
 *
 * Request body:
 *   { "userInput": string, "deviceId": string }
 *
 * Response:
 *   { "executionId": string, "success": boolean, "result": ExecutionResult }
 */

import { NextRequest, NextResponse } from "next/server";
import { planner } from "@/server/ai/planner";
import { buildGraph } from "@/server/ai/graph-builder";
import { DAGExecutor } from "@/server/ai/executor";
import {
  enqueue,
  markRunning,
  markCompleted,
  addProgress,
} from "@/server/ai/queue";

export async function POST(request: NextRequest) {
  try {
    // ── Parse request ──
    const body = await request.json();
    const { userInput, deviceId } = body as {
      userInput?: string;
      deviceId?: string;
    };

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { error: '"userInput" is required and must be a string.' },
        { status: 400 }
      );
    }

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        { error: '"deviceId" is required and must be a string.' },
        { status: 400 }
      );
    }

    // ── Step 1: Plan ──
    console.log(`[ExecuteCommand] Planning: "${userInput}"`);
    const steps = await planner(userInput);
    console.log(`[ExecuteCommand] Planner returned ${steps.length} step(s).`);

    // ── Step 2: Build graph ──
    const graph = buildGraph(steps, userInput);
    console.log(
      `[ExecuteCommand] Graph "${graph.executionId}" — ${graph.nodes.length} node(s).`
    );

    // ── Enqueue ──
    enqueue(graph);
    markRunning(graph.executionId);

    // ── Step 3: Execute ──
    const executor = new DAGExecutor({
      maxRetries: 2,
      onProgress: (progress) => {
        console.log(
          `[ExecuteCommand] [${progress.nodeId}] ${progress.status}: ${progress.message}`
        );
        addProgress(progress);
      },
    });

    const result = await executor.run(graph, deviceId);
    markCompleted(graph.executionId, result);

    console.log(
      `[ExecuteCommand] Execution "${graph.executionId}" ${result.success ? "succeeded" : "failed"} in ${result.durationMs}ms.`
    );

    // ── Respond ──
    return NextResponse.json({
      executionId: graph.executionId,
      success: result.success,
      result,
    });
  } catch (err) {
    console.error("[ExecuteCommand] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Internal server error.",
      },
      { status: 500 }
    );
  }
}
