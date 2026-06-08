import { sleep } from 'k6';
import { smokeThresholds } from '../config/thresholds.js';
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
  thresholds: smokeThresholds,
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
