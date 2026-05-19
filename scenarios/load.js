import { sleep } from 'k6';
import { summaryTrendStats } from '../helpers/summary.js';
import { getUsers } from '../tests/getUsers.test.js';
import { getSingleUser } from '../tests/getSingleUser.test.js';
import { createUser } from '../tests/createUser.test.js';
import { loginSuccessful } from '../tests/login.test.js';

export const options = {
  summaryTrendStats,
  scenarios: {
    average_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 3 },
        { duration: '1m', target: 5 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200', 'p(99)<2000'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  getUsers();
  getSingleUser();
  createUser();
  loginSuccessful();

  sleep(1);
}
