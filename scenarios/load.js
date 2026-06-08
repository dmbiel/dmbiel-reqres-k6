import { sleep } from 'k6';
import { loadThresholds } from '../config/thresholds.js';
import { summaryTrendStats } from '../helpers/summary.js';
import { getUsers } from '../tests/getUsers.test.js';
import { getSingleUser } from '../tests/getSingleUser.test.js';

export const options = {
  summaryTrendStats,
  scenarios: {
    average_load: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1m',
      preAllocatedVUs: 2,
      maxVUs: 3,
      stages: [
        { duration: '30s', target: 6 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: loadThresholds,
};

export default function () {
  getUsers();
  getSingleUser();

  sleep(1);
}
