/**
 * AI Planner — converts natural-language user input into a structured
 * array of task steps using an OpenAI chat completion.
 *
 * Each step includes an action name, agent type, optional parameters,
 * and dependency references so the graph-builder can wire them into a DAG.
 */

import OpenAI from "openai";
import type { PlannerStep, NodeType } from "@/types/task";

// ---------------------------------------------------------------------------
// OpenAI client (lazy singleton — created on first call)
// ---------------------------------------------------------------------------

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to your .env file."
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a task planner for a remote Mac desktop control system called "Mac in Wind".

Given a user's natural-language request, break it into a sequence of discrete, executable steps.

You MUST return a JSON object with a "steps" key containing an array of step objects.

Each step object must have:
- "action"    (string) — a short snake_case verb describing what to do (e.g. "open_url", "click", "type_text", "open_app", "save_file", "run_command", "fetch_data").
- "type"      (string) — one of: "browser", "computer", "api", "decision".
- "params"    (object, optional) — key-value pairs the agent needs (url, selector, text, app name, path, etc.).
- "dependsOn" (string[], optional) — array of step indices (as strings like "0", "1") that must finish before this step can start. Omit or use [] for steps with no dependencies.
- "label"     (string) — a short human-readable description of the step.

Rules:
1. Steps that can run in parallel should share the same dependencies (or none).
2. Keep the number of steps reasonable (usually 2-10).
3. Use "decision" type for conditional logic (e.g. "if product is available, proceed").
4. Always return multiple steps even for simple requests — at minimum one step.
5. Index steps starting from "0".

Example input: "Open Safari and search for MacBook Air on Amazon"
Example output:
{
  "steps": [
    { "action": "open_app", "type": "computer", "params": { "app": "Safari" }, "dependsOn": [], "label": "Open Safari" },
    { "action": "open_url", "type": "browser", "params": { "url": "https://www.amazon.com" }, "dependsOn": ["0"], "label": "Navigate to Amazon" },
    { "action": "type_text", "type": "browser", "params": { "selector": "#twotabsearchtextbox", "text": "MacBook Air" }, "dependsOn": ["1"], "label": "Type search query" },
    { "action": "click", "type": "browser", "params": { "selector": "#nav-search-submit-button" }, "dependsOn": ["2"], "label": "Click search button" }
  ]
}

Example input: "Open Terminal"
Example output:
{
  "steps": [
    { "action": "open_app", "type": "computer", "params": { "app": "Terminal" }, "dependsOn": [], "label": "Open Terminal" }
  ]
}`;

// ---------------------------------------------------------------------------
// Planner function
// ---------------------------------------------------------------------------

const VALID_TYPES: NodeType[] = ["browser", "computer", "api", "decision"];

/**
 * Calls the AI model to decompose `userInput` into a list of
 * {@link PlannerStep} objects.
 */
export async function planner(userInput: string): Promise<PlannerStep[]> {
  const client = getClient();

  let raw: string | null | undefined;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Break the following request into executable task steps.\n\nRequest: "${userInput}"`,
        },
      ],
    });

    raw = response.choices[0]?.message?.content;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`OpenAI API call failed: ${msg}`);
  }

  if (!raw) {
    throw new Error("Planner received an empty response from the AI model.");
  }

  console.log("[Planner] Raw AI response:", raw);

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Planner returned invalid JSON: ${raw.slice(0, 300)}`);
  }

  // Detect error responses from the model itself
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "error" in parsed &&
    !("action" in parsed)
  ) {
    const errorMsg = (parsed as Record<string, unknown>).error;
    throw new Error(
      `OpenAI returned an error: ${typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)}`
    );
  }

  // Normalise to array — handle all possible LLM output shapes:
  //   1. bare array  [...]
  //   2. { "steps": [...] }
  //   3. { "tasks": [...] }
  //   4. object with any first array-valued key
  //   5. single step object { action, type, ... }
  let steps: unknown[];

  if (Array.isArray(parsed)) {
    steps = parsed;
  } else if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;

    if (typeof obj.action === "string" && typeof obj.type === "string") {
      // Single step object — wrap it in an array
      steps = [obj];
    } else if (Array.isArray(obj.steps)) {
      steps = obj.steps;
    } else if (Array.isArray(obj.tasks)) {
      steps = obj.tasks;
    } else {
      // Look for any array-valued key — but skip known non-step keys
      const SKIP_KEYS = new Set(["dependsOn", "params", "error"]);
      const firstArrayKey = Object.keys(obj).find(
        (k) => !SKIP_KEYS.has(k) && Array.isArray(obj[k])
      );

      if (firstArrayKey) {
        steps = obj[firstArrayKey] as unknown[];
      } else {
        throw new Error(
          `Planner output is not a recognised format: ${raw.slice(0, 300)}`
        );
      }
    }
  } else {
    throw new Error(
      `Planner output is not an object or array: ${raw.slice(0, 300)}`
    );
  }

  console.log("[Planner] Extracted steps array:", JSON.stringify(steps, null, 2));

  // ── Convert plain-string steps into structured objects ──
  // Some models return ["Open Terminal", "Type command"] instead of objects
  if (steps.length > 0 && typeof steps[0] === "string") {
    console.log("[Planner] Steps are plain strings — converting to structured objects.");
    steps = (steps as string[]).map((label) => ({
      action: label.toLowerCase().replace(/\s+/g, "_"),
      type: "computer",
      label,
    }));
  }

  // ── Filter to valid objects only ──
  const objectSteps = steps.filter(
    (s) => typeof s === "object" && s !== null && !Array.isArray(s)
  );

  console.log(`[Planner] ${objectSteps.length} valid step object(s) after filtering.`);

  // ── Fallback for zero steps ──
  if (objectSteps.length === 0) {
    console.warn("[Planner] Zero steps returned — generating fallback single step.");
    return [
      {
        action: "execute",
        type: "computer" as NodeType,
        params: { command: userInput },
        label: userInput,
      },
    ];
  }

  // Validate each step
  return objectSteps.map((s, i) => {
    const step = s as Record<string, unknown>;

    // Coerce missing/invalid action
    const action =
      typeof step.action === "string"
        ? step.action
        : typeof step.label === "string"
        ? (step.label as string).toLowerCase().replace(/\s+/g, "_")
        : `step_${i}`;

    // Coerce missing/invalid type — default to "computer"
    const type = VALID_TYPES.includes(step.type as NodeType)
      ? (step.type as NodeType)
      : "computer";

    return {
      action,
      type,
      params: (step.params as Record<string, unknown>) ?? undefined,
      dependsOn: Array.isArray(step.dependsOn)
        ? (step.dependsOn as string[]).map(String)
        : undefined,
      label: typeof step.label === "string" ? step.label : action,
    };
  });
}
