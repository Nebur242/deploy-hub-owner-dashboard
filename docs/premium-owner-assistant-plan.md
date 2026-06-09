# Premium Owner Assistant Plan

## Goal

Introduce a premium AI assistant for paid owner plans while keeping the current form-based setup experience for free users.

- Free plan owners keep using `/dashboard/setup`
- Paid plan owners (`starter`, `pro`) get an OpenAI-powered assistant experience
- The assistant should help with:
  - project setup
  - license setup
  - configuration setup
  - deployment setup
  - failed deployment debugging

This should not replace the current forms immediately. It should layer on top of the current product and reuse the existing setup draft model where possible.

## Product Direction

### Free plan

Free plan owners should continue using the existing rule-based and form-based flows:

- `/dashboard/setup`
- current project creation forms
- current license creation forms
- current configuration/deployment forms

The free plan can still show the assistant entry points, but they should be locked with a clear premium upsell.

### Paid plans

Paid owners should get access to a real assistant, not a scripted mock chat.

The assistant should:

- ask useful follow-up questions
- understand owner context
- use tools to inspect real account/project/deployment state
- suggest next actions
- help draft structured data
- help debug deployment failures

The assistant should feel like one premium product with contextual modes, not a random chatbot pasted into each page.

## Recommended Architecture

## 1. Keep the current route split

- `/dashboard/setup` stays the free/manual path
- `/dashboard/setup-ai` becomes the premium AI-assisted setup path

Do not delete the current setup route. It remains the fallback and the free-plan experience.

## 2. Add explicit entitlement to subscription plans

Do not rely only on `plan !== free`.

Add a plan capability such as:

- `ai_assistant_enabled: boolean`

Recommended initial values:

- `free`: `false`
- `starter`: `true`
- `pro`: `true`

This keeps pricing flexible later without hardcoding premium behavior all over the app.

## 3. Use the existing setup draft as the source of truth

The existing shared setup draft should remain the setup state model.

That means:

- `/dashboard/setup` reads and writes the same setup draft
- `/dashboard/setup-ai` reads and writes the same setup draft
- the assistant updates structured draft state instead of inventing a separate hidden state model

This keeps the assistant trustworthy and reversible.

## 4. Move assistant orchestration to the API backend

The premium assistant should not be orchestrated directly inside the owner dashboard frontend.

Recommended placement:

- UI in `deploy-hub-owner-dashboard`
- assistant orchestration in `deploy-hub-api`
- OpenAI API key stored only on the backend

Benefits:

- safer key handling
- centralized auth and permission checks
- logging and auditability
- easier usage metering
- easier plan gating

## 5. Use OpenAI Responses API

Use the OpenAI Responses API for the premium assistant instead of Chat Completions.

Reasons:

- native tool calling
- better multi-step assistant behavior
- conversation state support
- support for remote MCP tools
- cleaner future path for agentic workflows

## 6. Add a Deploy Hub MCP server

Build a dedicated remote MCP server for Deploy Hub so the model can use real tools instead of pretending to know the account state.

This MCP server should expose internal platform tools in a controlled way.

### Initial read-only tool set

- `get_owner_context`
- `get_subscription_features`
- `get_setup_draft`
- `list_categories`
- `list_projects`
- `get_project`
- `list_licenses`
- `get_license`
- `list_configurations`
- `get_configuration`
- `get_deployment`
- `list_project_deployments`
- `get_failed_deployment_context`
- `get_deployment_logs_summary`

### Initial write or draft tools

- `update_setup_draft`
- `create_project_draft`
- `update_project_draft`
- `create_license_draft`
- `update_license_draft`
- `suggest_configuration`
- `suggest_deployment_fix`

Write tools should require approval.

## 7. Scope tools by page or mode

Do not expose every tool all the time.

Recommended tool scoping:

- Setup pages:
  - draft tools
  - project/license recommendation tools
- Project/configuration pages:
  - configuration suggestion tools
  - workflow assistant tools
- Deployment detail/failure pages:
  - deployment inspection tools
  - debugging tools

This keeps the assistant focused, cheaper, and easier to trust.

## Conversation Modes

The premium assistant should be one assistant product with contextual modes.

### Mode 1: Setup Assistant

Used mainly in `/dashboard/setup-ai`.

Responsibilities:

- ask useful onboarding questions
- fill the shared setup draft
- help define project shape
- help define license shape
- help suggest pricing and deployment limits
- prepare the owner for the next real form actions

### Mode 2: Build Assistant

Used in project/configuration flows.

Responsibilities:

- help design deployment configuration
- suggest environment variable expectations
- help create workflow structure
- guide owners through GitHub workflow setup

### Mode 3: Ops Assistant

Used in deployment pages and failed deployment flows.

Responsibilities:

- inspect deployment context
- summarize likely failure causes
- identify missing environment/configuration issues
- propose next debugging steps
- suggest possible fixes

## UI Plan

### Free plan UX

- Keep the current forms and setup route
- Show premium lock state where AI assistant entry points appear
- Use clear copy such as:
  - "AI Owner Assistant is available on paid plans"

### Paid plan UX

Expose the assistant in:

- `/dashboard/setup-ai`
- project create/edit
- license create/edit
- configuration edit
- deployment detail pages
- failed deployment views

The assistant UI should have:

- conversation thread
- live structured summary
- approval prompts for write actions
- visible context label such as `Setup`, `Configuration`, or `Deployment Debug`

## Safety and Control

The assistant must not silently mutate owner data.

Recommended controls:

- read-only by default
- approval required for all write actions
- log every tool call
- log every approval decision
- plan-based rate limits
- page-scoped tool allowlists
- system prompt rules against hidden or unapproved mutations

## Data Model Additions

Add assistant persistence to the backend.

Suggested tables:

- `assistant_threads`
- `assistant_messages`
- `assistant_runs`
- `assistant_tool_events`

Suggested fields:

- owner id
- optional project id
- optional license id
- optional configuration id
- optional deployment id
- assistant mode (`setup`, `build`, `ops`)
- page context
- OpenAI response or conversation identifiers
- status
- token usage / cost
- approval status
- timestamps

## Delivery Phases

## Phase 1: Premium Setup Assistant

Scope:

- plan gating
- backend assistant module
- Responses API integration
- MCP read tools
- `/dashboard/setup-ai` connected to backend
- assistant updates shared setup draft
- no silent entity creation

Outcome:

Paid owners get a real setup assistant. Free owners keep the current form flow.

## Phase 2: Build Assistant

Scope:

- configuration help
- workflow generation help
- project and license drafting from assistant context
- approval-based mutations

Outcome:

Assistant becomes useful during real project and configuration work, not only onboarding.

## Phase 3: Ops Assistant

Scope:

- deployment inspection
- failed deployment summaries
- log analysis
- environment/configuration troubleshooting
- fix suggestions

Outcome:

Assistant becomes valuable after launch, not just before launch.

## Suggested Implementation Order

1. Add `ai_assistant_enabled` to subscription plan data
2. Gate `/dashboard/setup-ai` and future assistant entry points by entitlement
3. Create assistant module in `deploy-hub-api`
4. Implement OpenAI Responses API integration on the backend
5. Build Deploy Hub remote MCP server with read-only tools first
6. Connect `/dashboard/setup-ai` to backend assistant endpoints
7. Reuse the existing shared setup draft for all setup mutations
8. Add approval-based write tools
9. Add configuration and workflow assistance
10. Add deployment debugging assistance
11. Add usage metering, rate limits, and audit reporting

## Practical Starting Point

The safest and highest-value first release is:

- premium-gated setup assistant
- shared setup draft integration
- project and license guidance
- backend Responses API orchestration
- read-only MCP tools first
- explicit approval for any draft mutation

That gives a real premium feature without making the assistant overly broad too early.

## Notes About Existing Codebase

Current relevant foundations already exist:

- shared setup draft model across `/dashboard/setup` and `/dashboard/setup-ai`
- subscription plan model with `free`, `starter`, and `pro`
- existing OpenAI usage in the owner dashboard workflow generator
- clear owner flows for project, license, configuration, and deployment management

That means this feature should be built as an extension of existing patterns, not a separate parallel product.

## External References

- OpenAI Responses API: [https://platform.openai.com/docs/api-reference/responses?api-mode=responses](https://platform.openai.com/docs/api-reference/responses?api-mode=responses)
- OpenAI Remote MCP tools guide: [https://platform.openai.com/docs/guides/tools-remote-mcp?lang=javascript](https://platform.openai.com/docs/guides/tools-remote-mcp?lang=javascript)
- OpenAI Responses migration guide: [https://platform.openai.com/docs/guides/responses-vs-chat-completions?api-mode=responses.html](https://platform.openai.com/docs/guides/responses-vs-chat-completions?api-mode=responses.html)
