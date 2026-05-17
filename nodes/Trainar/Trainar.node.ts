import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	
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
		requestDefaults: {
			baseURL: BASE_URL,
			headers: { 'Content-Type': 'application/json' },
		},
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
						routing: {
							request: { method: 'POST', url: '/api-tenant-tasks' },
						},
					},
					{
						name: 'Update Status',
						value: 'updateStatus',
						action: 'Update task status',
						description: 'Update the status of an existing task',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/api-tenant-tasks?task_id={{$parameter["taskId"]}}',
							},
						},
					},
					{
						name: 'Find',
						value: 'find',
						action: 'Find tasks',
						description: 'List recent tasks; optionally filter client-side by title',
						routing: {
							request: {
								method: 'GET',
								url: '/api-tenant-tasks',
								qs: { limit: '={{$parameter["limit"]}}' },
							},
						},
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
				routing: { request: { body: { title: '={{$value}}' } } },
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { request: { body: { description: '={{$value}}' } } },
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
				routing: { request: { body: { priority: '={{$value}}' } } },
			},
			{
				displayName: 'Assigned To Name or ID',
				name: 'assignedTo',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: { loadOptionsMethod: 'getUsers' },
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { request: { body: { assigned_to: '={{$value}}' } } },
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { request: { body: { external_id: '={{$value}}' } } },
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
				routing: { request: { body: { status: '={{$value}}' } } },
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
						routing: {
							request: { method: 'POST', url: '/api-tenant-users' },
						},
					},
					{
						name: 'Find',
						value: 'find',
						action: 'Find users',
						description: 'List users in the tenant',
						routing: {
							request: {
								method: 'GET',
								url: '/api-tenant-users',
								qs: { limit: '={{$parameter["limit"]}}' },
							},
						},
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
				routing: { request: { body: { email: '={{$value}}' } } },
			},
			{
				displayName: 'Full Name',
				name: 'fullName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Jane Smith',
				displayOptions: { show: { resource: ['user'], operation: ['invite'] } },
				routing: { request: { body: { full_name: '={{$value}}' } } },
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
				routing: { request: { body: { roles: '={{$value}}' } } },
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
						routing: {
							request: { method: 'POST', url: '/api-tenant-skills-execute' },
						},
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
				routing: { request: { body: { skill_id: '={{$value}}' } } },
			},
			{
				displayName: 'Arguments',
				name: 'skillArguments',
				type: 'json',
				required: true,
				default: '{}',
				description: 'JSON object of arguments forwarded to the skill webhook',
				displayOptions: { show: { resource: ['skill'], operation: ['execute'] } },
				routing: { request: { body: { arguments: '={{JSON.parse($value)}}' } } },
			},
			{
				displayName: 'Session Context Override',
				name: 'sessionContextOverride',
				type: 'json',
				default: '{}',
				description:
					"Optional override. If empty or null, session_context is auto-resolved from the tenant's first active seat (NO_ACTIVE_SEAT 400 if none qualify). For explicit override pass `{ customer_id, seat_id, user_id, role }`.",
				displayOptions: { show: { resource: ['skill'], operation: ['execute'] } },
				routing: {
					request: {
						body: {
							session_context:
								'={{ JSON.parse($value || "{}") }}',
						},
					},
				},
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
		// Declarative routing handles dispatch — execute() is only invoked
		// for operations that need post-processing (currently: Task Find client-side filter).
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

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

			// All other operations go through declarative routing, but we still need
			// to return *something*. Pass-through.
			returnData.push(items[i]);
		}

		return [returnData];
	}
}
