import { Rate, Trend } from 'k6/metrics';

const endpointMetrics = {
  list_users: {
    duration: new Trend('endpoint_list_users_duration', true),
    successRate: new Rate('endpoint_list_users_success_rate'),
  },
  single_user: {
    duration: new Trend('endpoint_single_user_duration', true),
    successRate: new Rate('endpoint_single_user_success_rate'),
  },
  user_not_found: {
    duration: new Trend('endpoint_user_not_found_duration', true),
    successRate: new Rate('endpoint_user_not_found_success_rate'),
  },
  create_user: {
    duration: new Trend('endpoint_create_user_duration', true),
    successRate: new Rate('endpoint_create_user_success_rate'),
  },
  login_successful: {
    duration: new Trend('endpoint_login_successful_duration', true),
    successRate: new Rate('endpoint_login_successful_success_rate'),
  },
  delayed_users: {
    duration: new Trend('endpoint_delayed_users_duration', true),
    successRate: new Rate('endpoint_delayed_users_success_rate'),
  },
};

export function recordEndpointMetrics(endpointName, response, expectedStatus) {
  const metrics = endpointMetrics[endpointName];

  if (!metrics) {
    throw new Error(`Unknown endpoint metric: ${endpointName}`);
  }

  metrics.duration.add(response.timings.duration);
  metrics.successRate.add(response.status === expectedStatus);
}
