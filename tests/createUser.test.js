import { post } from '../helpers/httpClient.js';
import { checkStatus, checkJsonField, checkResponseTime } from '../helpers/checks.js';
import { recordEndpointMetrics } from '../helpers/metrics.js';

const payload = {
  name: 'Dima QA',
  job: 'Senior Automation QA',
};

export function createUser() {
  const response = post('/api/users', payload, {
    tags: {
      name: 'POST /api/users',
      endpoint: 'create_user',
      flow: 'standard',
    },
  });

  checkStatus(response, 201);
  checkJsonField(response, 'id');
  checkResponseTime(response, 1000);
  recordEndpointMetrics('create_user', response, 201);

  return response;
}
