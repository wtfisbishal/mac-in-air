/**
 * Node Runner — routes a TaskNode to the correct agent based on
 * its `type` field.
 *
 * This is the central dispatch point called by the DAG executor.
 */

import type { TaskNode } from "@/types/task";
import type { DesktopCommandResponse } from "@/server/socket/desktop-socket";
import { browserAgent } from "@/server/agents/browser-agent";
import { computerAgent } from "@/server/agents/computer-agent";
import { apiAgent } from "@/server/agents/api-agent";

/**
 * Run the appropriate agent for the given node.
 *
 * @param node     The task node to execute.
 * @param deviceId The target device for browser / computer agents.
 * @returns        The agent's response.
 * @throws         If the node type is unknown or the agent fails.
 */
export async function runAgent(
  node: TaskNode,
  deviceId: string
): Promise<DesktopCommandResponse> {
  switch (node.type) {
    case "browser":
      return browserAgent(node, deviceId);

    case "computer":
      return computerAgent(node, deviceId);

    case "api":
      return apiAgent(node);

    case "decision":
      // Decision nodes are resolved by the planner; at execution time
      // they act as pass-through checkpoints.  A more advanced
      // implementation could re-invoke the LLM here to make runtime
      // decisions based on prior node results.
      console.log(
        `[NodeRunner] Decision node "${node.id}" (${node.label ?? node.action}) — passing through.`
      );
      return { success: true, data: { decision: "proceed" } };

    default:
      throw new Error(
        `Unknown node type "${(node as TaskNode).type}" for node "${node.id}".`
      );
  }
}
