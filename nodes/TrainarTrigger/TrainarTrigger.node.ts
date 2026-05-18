import {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	
} from 'n8n-workflow';

const BASE_URL = 'https://xddgmkiguaohdewecmju.supabase.co/functions/v1';

interface SubscribeResponse {
	id: string;
	events: string[];
}

interface CheckExistsResponse {
	exists: boolean;
	id?: string;
	events?: string[];
	url?: string;
}

function isNotFoundError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const err = error as {
		httpCode?: string | number;
		statusCode?: string | number;
		status?: string | number;
		response?: { status?: number; statusCode?: number };
		cause?: { response?: { status?: number }; statusCode?: number };
	};
	const candidates: Array<string | number | undefined> = [
		err.httpCode,
		err.statusCode,
		err.status,
		err.response?.status,
		err.response?.statusCode,
		err.cause?.response?.status,
		err.cause?.statusCode,
	];
	return candidates.some((c) => c !== undefined && Number(c) === 404);
}

export class TrainarTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrainAR Trigger',
		name: 'trainarTrigger',
		icon: 'file:trainar.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Triggers when a TrainAR event fires',
		defaults: { name: 'TrainAR Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'trainarApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['task.created'],
				description:
					'TrainAR events to subscribe to. The webhook fires on every event you select.',
				options: [
					{
						name: 'Session Completed',
						value: 'session.completed',
						description: 'A training session ended',
					},
					{
						name: 'Session Started',
						value: 'session.started',
						description: 'A training session started on an AR device',
					},
					{
						name: 'Skill Executed',
						value: 'skill.executed',
						description: 'A TrainAR skill was executed (success or failure)',
					},
					{
						name: 'Task Completed',
						value: 'task.completed',
						description: 'A task was completed',
					},
					{
						name: 'Task Created',
						value: 'task.created',
						description: 'A new operational task was created',
					},
					{
						name: 'Task Status Changed',
						value: 'task.status_changed',
						description: 'A task changed status (open / in_progress / completed / cancelled)',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const endpointId = webhookData.endpointId as string | undefined;
				if (!endpointId) return false;

				try {
					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'trainarApi',
						{
							method: 'GET',
							url: `${BASE_URL}/webhook-subscribe`,
							qs: { endpoint_id: endpointId },
						},
					)) as CheckExistsResponse;
					return response.exists === true;
				} catch (error) {
					if (isNotFoundError(error)) {
						return false;
					}
					throw error;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events', []) as string[];

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trainarApi',
					{
						method: 'POST',
						url: `${BASE_URL}/webhook-subscribe`,
						body: {
							url: webhookUrl,
							events,
							source: 'n8n',
						},
					},
				)) as SubscribeResponse;

				if (!response.id) return false;

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.endpointId = response.id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const endpointId = webhookData.endpointId as string | undefined;
				if (!endpointId) return true;

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'trainarApi', {
						method: 'DELETE',
						url: `${BASE_URL}/webhook-subscribe`,
						qs: { endpoint_id: endpointId, _source: 'n8n' },
					});
				} catch {
					// Ignore — endpoint may have been cleaned up upstream
				}
				delete webhookData.endpointId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as Record<string, unknown>;

		// Flatten the envelope: webhook delivers { event, timestamp, data: {...} }.
		// Emit the inner `data` object as the workflow's first item, with `event` + `timestamp`
		// fanned out alongside so downstream nodes can branch on event type cleanly.
		const data = (body.data ?? body) as Record<string, unknown>;
		const flattened: Record<string, unknown> = {
			...data,
			_event: body.event ?? null,
			_timestamp: body.timestamp ?? null,
		};

		return {
			workflowData: [[{ json: flattened as any }]],
		};
	}
}
