import { sleep } from 'k6';
import { spikeThresholds } from '../config/thresholds.js';
import { summaryTrendStats } from '../helpers/summary.js';
import { getUsers } from '../tests/getUsers.test.js';

export const options = {
  summaryTrendStats,
  scenarios: {
    small_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1m',
      preAllocatedVUs: 2,
      maxVUs: 4,
      stages: [
        { duration: '10s', target: 6 },
        { duration: '10s', target: 18 },
        { duration: '20s', target: 18 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: spikeThresholds,
};

export default function () {
  getUsers();

  sleep(1);
}
