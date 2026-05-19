import { post } from '../helpers/httpClient.js';
import { checkStatus, checkJsonField, checkResponseTime } from '../helpers/checks.js';

const payload = {
  email: 'eve.holt@reqres.in',
  password: 'cityslicka',
};

export function loginSuccessful() {
  const response = post('/api/login', payload, {
    tags: {
      name: 'POST /api/login',
      endpoint: 'login_successful',
      flow: 'standard',
    },
  });

  checkStatus(response, 200);
  checkJsonField(response, 'token');
  checkResponseTime(response, 1000);

  return response;
}
