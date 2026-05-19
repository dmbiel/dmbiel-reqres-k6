import { get } from '../helpers/httpClient.js';
import { checkStatus, checkJsonField, checkResponseTime } from '../helpers/checks.js';

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

  return response;
}
