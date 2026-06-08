import { sleep } from 'k6';
import { stressThresholds } from '../config/thresholds.js';
import { summaryTrendStats } from '../helpers/summary.js';
import { getUsers } from '../tests/getUsers.test.js';
import { getSingleUser } from '../tests/getSingleUser.test.js';

export const options = {
  summaryTrendStats,
  scenarios: {
    controlled_stress: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1m',
      preAllocatedVUs: 3,
      maxVUs: 5,
      stages: [
        { duration: '20s', target: 8 },
        { duration: '40s', target: 14 },
        { duration: '20s', target: 8 },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: stressThresholds,
};

export default function () {
  getUsers();
  getSingleUser();

  sleep(1);
}
