import { post } from '../helpers/httpClient.js';
import { checkStatus, checkJsonField, checkResponseTime } from '../helpers/checks.js';

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

  return response;
}
