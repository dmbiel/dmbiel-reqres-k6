import { get } from '../helpers/httpClient.js';
import { checkStatus, checkJsonField, checkResponseTime } from '../helpers/checks.js';
import { recordEndpointMetrics } from '../helpers/metrics.js';

export function getSingleUser() {
  const response = get('/api/users/2', {
    tags: {
      name: 'GET /api/users/{id}',
      endpoint: 'single_user',
      flow: 'standard',
    },
  });

  checkStatus(response, 200);
  checkJsonField(response, 'data');
  checkResponseTime(response, 1000);
  recordEndpointMetrics('single_user', response, 200);

  return response;
}

export function getMissingUser() {
  const response = get('/api/users/23', {
    tags: {
      name: 'GET /api/users/{missingId}',
      endpoint: 'user_not_found',
      flow: 'negative',
    },
  });

  checkStatus(response, 404);
  checkResponseTime(response, 1000);
  recordEndpointMetrics('user_not_found', response, 404);

  return response;
}
