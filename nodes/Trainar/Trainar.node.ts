import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

const BASE_URL = 'https://xddgmkiguaohdewecmju.supabase.co/functions/v1';

export class Trainar implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrainAR',
		name: 'trainar',
		icon: 'file:trainar.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Call the TrainAR API — tasks, users, skills',
		defaults: { name: 'TrainAR' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'trainarApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'task',
				options: [
					{ name: 'Task', value: 'task' },
					{ name: 'User', value: 'user' },
					{ name: 'Skill', value: 'skill' },
				],
			},

			// ─────────────────── Task operations ───────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['task'] } },
				default: 'create',
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a task',
						description: 'Create a new operational task',
					},
					{
						name: 'Update Status',
						value: 'updateStatus',
						action: 'Update task status',
						description: 'Update the status of an existing task',
					},
					{
						name: 'Find',
						value: 'find',
						action: 'Find tasks',
						description: 'List recent tasks; optionally filter client-side by title',
					},
				],
			},

			// Task Create fields
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				default: 'medium',
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'High', value: 'high' },
				],
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
			},
			{
				displayName: 'Assigned To Name or ID',
				name: 'assignedTo',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: { loadOptionsMethod: 'getUsers' },
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
			},

			// Task Update Status fields
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'resourceLocator',
				required: true,
				default: { mode: 'list', value: '' },
				displayOptions: { show: { resource: ['task'], operation: ['updateStatus'] } },
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: { searchListMethod: 'getTasks' },
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
					},
				],
			},
			{
				displayName: 'New Status',
				name: 'status',
				type: 'options',
				required: true,
				default: 'in_progress',
				options: [
					{ name: 'Open', value: 'open' },
					{ name: 'In Progress', value: 'in_progress' },
					{ name: 'Completed', value: 'completed' },
					{ name: 'Cancelled', value: 'cancelled' },
				],
				displayOptions: { show: { resource: ['task'], operation: ['updateStatus'] } },
			},

			// Task Find fields
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				default: 50,
				displayOptions: { show: { resource: ['task'], operation: ['find'] } },
			},
			{
				displayName: 'Title Contains',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'safety',
				description: 'Client-side filter on title (case-insensitive contains)',
				displayOptions: { show: { resource: ['task'], operation: ['find'] } },
			},

			// ─────────────────── User operations ───────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['user'] } },
				default: 'invite',
				options: [
					{
						name: 'Invite',
						value: 'invite',
						action: 'Invite a user',
						description: 'Send an invitation email to a new user',
					},
					{
						name: 'Find',
						value: 'find',
						action: 'Find users',
						description: 'List users in the tenant',
					},
				],
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'j.smith@example.com',
				displayOptions: { show: { resource: ['user'], operation: ['invite'] } },
			},
			{
				displayName: 'Full Name',
				name: 'fullName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Jane Smith',
				displayOptions: { show: { resource: ['user'], operation: ['invite'] } },
			},
			{
				displayName: 'Roles',
				name: 'roles',
				type: 'multiOptions',
				required: true,
				default: ['admin'],
				options: [{ name: 'Admin', value: 'admin' }],
				description:
					'Currently the tenant API accepts only ["admin"]. Trainer/trainee assignment lives in the seat-assignment endpoints, not here.',
				displayOptions: { show: { resource: ['user'], operation: ['invite'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				default: 50,
				displayOptions: { show: { resource: ['user'], operation: ['find'] } },
			},

			// ─────────────────── Skill operations ───────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['skill'] } },
				default: 'execute',
				options: [
					{
						name: 'Execute',
						value: 'execute',
						action: 'Execute a skill',
						description:
							"Run a TrainAR skill server-to-server. session_context is auto-resolved from the tenant's first active assigned seat unless supplied.",
					},
				],
			},
			{
				displayName: 'Skill ID',
				name: 'skillId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
				description: 'The UUID of the skill to execute',
				displayOptions: { show: { resource: ['skill'], operation: ['execute'] } },
			},
			{
				displayName: 'Arguments',
				name: 'skillArguments',
				type: 'json',
				required: true,
				default: '{}',
				description: 'JSON object of arguments forwarded to the skill webhook',
				displayOptions: { show: { resource: ['skill'], operation: ['execute'] } },
			},
			{
				displayName: 'Session Context Override',
				name: 'sessionContextOverride',
				type: 'json',
				default: '{}',
				description:
					"Optional override. If empty or null, session_context is auto-resolved from the tenant's first active seat (NO_ACTIVE_SEAT 400 if none qualify). For explicit override pass `{ customer_id, seat_id, user_id, role }`.",
				displayOptions: { show: { resource: ['skill'], operation: ['execute'] } },
			},
		],
	};

	methods = {
		loadOptions: {
			async getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{ method: 'GET', url: `${BASE_URL}/api-tenant-users`, qs: { limit: 50 } },
				);
				const users = Array.isArray(response) ? response : response.users ?? [];
				return users.map((u: { id: string; email: string; full_name?: string }) => ({
					name: u.full_name ? `${u.full_name} (${u.email})` : u.email,
					value: u.id,
				}));
			},
		},
		listSearch: {
			async getTasks(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<{ results: { name: string; value: string }[] }> {
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{ method: 'GET', url: `${BASE_URL}/api-tenant-tasks`, qs: { limit: 100 } },
				);
				const tasks = Array.isArray(response) ? response : response.tasks ?? [];
				const filtered = filter
					? tasks.filter((t: { title?: string }) =>
							(t.title ?? '').toLowerCase().includes(filter.toLowerCase()),
					  )
					: tasks;
				return {
					results: filtered.map((t: { id?: string; task_id?: string; title?: string }) => ({
						name: t.title ?? 'Untitled',
						value: (t.id ?? t.task_id) as string,
					})),
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// When execute() is defined, n8n SKIPS declarative routing entirely.
		// All HTTP dispatch lives here.
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const optional = <T>(name: string, i: number, fallback: T): T => {
			try {
				const v = this.getNodeParameter(name, i, fallback as any);
				return (v === '' || v === null || v === undefined ? fallback : v) as T;
			} catch {
				return fallback;
			}
		};

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			if (resource === 'task' && operation === 'create') {
				const body: Record<string, unknown> = {
					title: this.getNodeParameter('title', i) as string,
					priority: this.getNodeParameter('priority', i, 'medium') as string,
				};
				const description = optional<string>('description', i, '');
				if (description) body.description = description;
				const assignedTo = optional<string>('assignedTo', i, '');
				if (assignedTo) body.assigned_to = assignedTo;
				const externalId = optional<string>('externalId', i, '');
				if (externalId) body.external_id = externalId;
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{ method: 'POST', url: `${BASE_URL}/api-tenant-tasks`, body, json: true },
				);
				returnData.push({ json: response as any });
				continue;
			}

			if (resource === 'task' && operation === 'updateStatus') {
				const rl = this.getNodeParameter('taskId', i) as { value?: string } | string;
				const taskId = typeof rl === 'string' ? rl : (rl?.value ?? '');
				if (!taskId) throw new NodeOperationError(this.getNode(), 'TrainAR: Task ID is required for Update Status');
				const status = this.getNodeParameter('status', i) as string;
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{
						method: 'PATCH',
						url: `${BASE_URL}/api-tenant-tasks`,
						qs: { task_id: taskId },
						body: { status },
						json: true,
					},
				);
				returnData.push({ json: response as any });
				continue;
			}

			if (resource === 'task' && operation === 'find') {
				const limit = this.getNodeParameter('limit', i) as number;
				const query = (this.getNodeParameter('query', i, '') as string).toLowerCase();
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{ method: 'GET', url: `${BASE_URL}/api-tenant-tasks`, qs: { limit } },
				);
				const tasks = Array.isArray(response) ? response : response.tasks ?? [];
				const filtered = query
					? tasks.filter((t: { title?: string }) =>
							(t.title ?? '').toLowerCase().includes(query),
					  )
					: tasks;
				filtered.forEach((t: object) => returnData.push({ json: t as any }));
				continue;
			}

			if (resource === 'user' && operation === 'invite') {
				const body = {
					email: this.getNodeParameter('email', i) as string,
					full_name: this.getNodeParameter('fullName', i) as string,
					roles: this.getNodeParameter('roles', i) as string[],
				};
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{ method: 'POST', url: `${BASE_URL}/api-tenant-users`, body, json: true },
				);
				returnData.push({ json: response as any });
				continue;
			}

			if (resource === 'user' && operation === 'find') {
				const limit = this.getNodeParameter('limit', i) as number;
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{ method: 'GET', url: `${BASE_URL}/api-tenant-users`, qs: { limit } },
				);
				const users = Array.isArray(response) ? response : response.users ?? [];
				users.forEach((u: object) => returnData.push({ json: u as any }));
				continue;
			}

			if (resource === 'skill' && operation === 'execute') {
				const skillId = this.getNodeParameter('skillId', i) as string;
				const argsRaw = optional<string>('skillArguments', i, '{}');
				const ctxRaw = optional<string>('sessionContextOverride', i, '{}');
				let argsParsed: unknown;
				let ctxParsed: unknown;
				try { argsParsed = JSON.parse(argsRaw || '{}'); }
				catch { throw new NodeOperationError(this.getNode(), 'TrainAR: Arguments must be valid JSON'); }
				try { ctxParsed = JSON.parse(ctxRaw || '{}'); }
				catch { throw new NodeOperationError(this.getNode(), 'TrainAR: Session Context Override must be valid JSON'); }
				const body: Record<string, unknown> = { skill_id: skillId, arguments: argsParsed };
				if (ctxParsed && Object.keys(ctxParsed as object).length > 0) {
					body.session_context = ctxParsed;
				}
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{ method: 'POST', url: `${BASE_URL}/api-tenant-skills-execute`, body, json: true },
				);
				returnData.push({ json: response as any });
				continue;
			}

			throw new NodeOperationError(this.getNode(), `TrainAR: Unsupported operation ${resource}.${operation}`);
		}

		return [returnData];
	}
}
