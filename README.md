# n8n-nodes-trainar

[![npm version](https://img.shields.io/npm/v/n8n-nodes-trainar.svg)](https://www.npmjs.com/package/n8n-nodes-trainar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [TrainAR](https://trainar.ai) — the AR training platform.

Trigger n8n workflows when TrainAR events fire (task created, session completed, skill executed, etc.) and call TrainAR API actions (create tasks, invite users, execute skills) from any n8n workflow.

## Install

### Self-hosted n8n

1. In your n8n instance, go to **Settings → Community Nodes → Install**.
2. Paste `n8n-nodes-trainar` and click **Install**.
3. Reload n8n.

### n8n Cloud

Verified community node install is rolling out per workspace by n8n. Once approved, install the package from the **Nodes panel** with one click.

## Authenticate

1. In TrainAR Dashboard → API, generate a tenant API key (starts with `tak_`). Required scopes depend on what you need:
   - `manage:webhooks` — for the `TrainAR Trigger` node (subscribe/unsubscribe)
   - `read:tasks`, `write:tasks`, `read:users`, `read:skills` — for the various Find/Read operations of the `TrainAR` node
   - `manage:users` — for the `User → Invite` action
   - `write:skills` — for the `Skill → Execute` action
2. In n8n, create a new credential of type **TrainAR API** and paste the key.

## Nodes

### TrainAR Trigger (REST hook)

One trigger node, six event types:

| Event | When it fires |
|---|---|
| `task.created` | A new operational task is created in TrainAR |
| `task.status_changed` | A task changes status (open / in_progress / completed / cancelled) |
| `task.completed` | A task is completed |
| `session.started` | A training session starts on an AR device |
| `session.completed` | A training session ends |
| `skill.executed` | A TrainAR skill is executed (success or failure) |

Select one or more events on the trigger node. The webhook payload is flattened — fields from the event's `data` object are top-level, with `_event` and `_timestamp` carried alongside for routing logic.

### TrainAR (actions + searches)

Three resources, six operations:

| Resource | Operation | What it does |
|---|---|---|
| Task | Create | Create a new operational task |
| Task | Update Status | Move a task between open / in_progress / completed / cancelled |
| Task | Find | List recent tasks (client-side title filter) |
| User | Invite | Send an invitation email to a new user |
| User | Find | List users in the tenant |
| Skill | Execute | Run a TrainAR skill server-to-server (auto-resolves session_context) |

## Compatibility

- **n8n:** 1.0.0+
- **Node.js:** 20.x+
- **n8n-workflow:** 1.0.0+

## Endpoints

The node calls the TrainAR production API at `https://xddgmkiguaohdewecmju.supabase.co/functions/v1`:

- `POST /webhook-subscribe` — REST-hook lifecycle (create)
- `GET /webhook-subscribe?endpoint_id=…` — REST-hook lifecycle (checkExists)
- `DELETE /webhook-subscribe?endpoint_id=…&_source=n8n` — REST-hook lifecycle (delete, source-scoped)
- `POST /api-tenant-tasks` — Create task
- `PATCH /api-tenant-tasks?task_id=…` — Update task status
- `GET /api-tenant-tasks` — List tasks
- `POST /api-tenant-users` — Invite user
- `GET /api-tenant-users` — List users
- `POST /api-tenant-skills-execute` — Execute skill

## Source

[github.com/Train-AR/n8n-nodes-trainar](https://github.com/Train-AR/n8n-nodes-trainar)

## License

MIT
