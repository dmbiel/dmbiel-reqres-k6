const standardSuccessRate = ['rate>0.95'];
const relaxedSuccessRate = ['rate>0.90'];

export const smokeThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<4500'],
  'http_req_duration{flow:standard}': ['p(95)<1000'],
  'http_req_duration{flow:negative}': ['p(95)<1000'],
  'http_req_duration{endpoint:delayed_users}': ['p(95)<5000'],
  endpoint_list_users_success_rate: standardSuccessRate,
  endpoint_single_user_success_rate: standardSuccessRate,
  endpoint_user_not_found_success_rate: standardSuccessRate,
  endpoint_create_user_success_rate: standardSuccessRate,
  endpoint_login_successful_success_rate: standardSuccessRate,
  endpoint_delayed_users_success_rate: standardSuccessRate,
  endpoint_list_users_duration: ['p(95)<1000'],
  endpoint_single_user_duration: ['p(95)<1000'],
  endpoint_user_not_found_duration: ['p(95)<1000'],
  endpoint_create_user_duration: ['p(95)<1000'],
  endpoint_login_successful_duration: ['p(95)<1000'],
  endpoint_delayed_users_duration: ['p(95)<5000'],
  checks: standardSuccessRate,
};

export const loadThresholds = {
  http_req_failed: ['rate<0.02'],
  http_req_duration: ['p(95)<1200', 'p(99)<2000'],
  endpoint_list_users_success_rate: standardSuccessRate,
  endpoint_single_user_success_rate: standardSuccessRate,
  endpoint_list_users_duration: ['p(95)<1200'],
  endpoint_single_user_duration: ['p(95)<1200'],
  checks: standardSuccessRate,
};

export const stressThresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<2000', 'p(99)<3000'],
  endpoint_list_users_success_rate: relaxedSuccessRate,
  endpoint_single_user_success_rate: relaxedSuccessRate,
  endpoint_list_users_duration: ['p(95)<2000'],
  endpoint_single_user_duration: ['p(95)<2000'],
  checks: relaxedSuccessRate,
};

export const spikeThresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<2000'],
  endpoint_list_users_success_rate: relaxedSuccessRate,
  endpoint_list_users_duration: ['p(95)<2000'],
  checks: relaxedSuccessRate,
};
