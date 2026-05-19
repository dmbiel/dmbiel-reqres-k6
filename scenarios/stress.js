import { sleep } from 'k6';
import { summaryTrendStats } from '../helpers/summary.js';
import { getUsers } from '../tests/getUsers.test.js';
import { getSingleUser } from '../tests/getSingleUser.test.js';

export const options = {
  summaryTrendStats,
  scenarios: {
    controlled_stress: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 5 },
        { duration: '30s', target: 10 },
        { duration: '30s', target: 5 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    checks: ['rate>0.90'],
  },
};

export default function () {
  getUsers();
  getSingleUser();

  sleep(1);
}
