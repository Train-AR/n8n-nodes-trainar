import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TrainarApi implements ICredentialType {
	name = 'trainarApi';

	displayName = 'TrainAR API';

	// eslint-disable-next-line n8n-nodes-base/cred-class-field-documentation-url-miscased
	documentationUrl = 'https://github.com/train-ar/n8n-nodes-trainar';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your TrainAR tenant API key (starts with `tak_`). Generate one in Dashboard → API. The key must have `manage:webhooks` for triggers, `manage:users` for the Invite User action, and `write:skills` for the Execute Skill action.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://xddgmkiguaohdewecmju.supabase.co/functions/v1',
			url: '/api-tenant-users',
			qs: { limit: '1' },
		},
	};
}
