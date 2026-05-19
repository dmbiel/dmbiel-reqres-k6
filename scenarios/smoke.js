import { sleep } from 'k6';
import { summaryTrendStats } from '../helpers/summary.js';
import { getUsers } from '../tests/getUsers.test.js';
import { getSingleUser, getMissingUser } from '../tests/getSingleUser.test.js';
import { createUser } from '../tests/createUser.test.js';
import { loginSuccessful } from '../tests/login.test.js';
import { getDelayedUsers } from '../tests/delayedResponse.test.js';

export const options = {
  summaryTrendStats,
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<4500'],
    'http_req_duration{flow:standard}': ['p(95)<1000'],
    'http_req_duration{flow:negative}': ['p(95)<1000'],
    'http_req_duration{endpoint:delayed_users}': ['p(95)<5000'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  getUsers();
  getSingleUser();
  getMissingUser();
  createUser();
  loginSuccessful();
  getDelayedUsers();

  sleep(1);
}
