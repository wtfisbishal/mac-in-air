/**
 * POST /api/plan
 *
 * Planning-only endpoint — calls the AI planner and returns
 * the structured task graph WITHOUT executing anything.
 *
 * The client (AICommandPanel) receives the plan and executes
 * each step client-side via the existing Socket.IO connection,
 * exactly the same way the control page sends commands.
 *
 * Request body:
 *   { "userInput": string }
 *
 * Response:
 *   { "executionId": string, "steps": PlannerStep[], "graph": TaskGraph }
 */

import { NextRequest, NextResponse } from "next/server";
import { planner } from "@/server/ai/planner";
import { buildGraph } from "@/server/ai/graph-builder";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput } = body as { userInput?: string };

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { error: '"userInput" is required.' },
        { status: 400 }
      );
    }

    console.log(`[Plan] Planning: "${userInput}"`);

    const steps = await planner(userInput);
    const graph  = buildGraph(steps, userInput);

    console.log(`[Plan] ${graph.nodes.length} node(s) in graph "${graph.executionId}"`);

    return NextResponse.json({
      executionId: graph.executionId,
      nodes: graph.nodes,          // TaskNode[] — has action, type, params, dependsOn, label
      userInput,
    });
  } catch (err) {
    console.error("[Plan] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error." },
      { status: 500 }
    );
  }
}
