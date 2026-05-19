import { get } from '../helpers/httpClient.js';
import { checkStatus, checkResponseTime } from '../helpers/checks.js';

export function getDelayedUsers() {
  const response = get('/api/users?delay=3', {
    tags: {
      name: 'GET /api/users?delay=3',
      endpoint: 'delayed_users',
      flow: 'delayed',
    },
  });

  checkStatus(response, 200);
  checkResponseTime(response, 5000);

  return response;
}
