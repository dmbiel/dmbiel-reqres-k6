import { get } from '../helpers/httpClient.js';
import { checkStatus, checkJsonField, checkResponseTime } from '../helpers/checks.js';

export function getUsers() {
  const response = get('/api/users?page=1', {
    tags: {
      name: 'GET /api/users?page=1',
      endpoint: 'list_users',
      flow: 'standard',
    },
  });

  checkStatus(response, 200);
  checkJsonField(response, 'data');
  checkResponseTime(response, 1000);

  return response;
}
