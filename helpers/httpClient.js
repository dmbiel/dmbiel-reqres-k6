import http from 'k6/http';
import { getEnvironment } from '../config/environments.js';

const env = getEnvironment();

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 404));

export function buildHeaders(extraHeaders = {}) {
  const apiKey = __ENV.REQRES_API_KEY;

  if (!apiKey) {
    throw new Error('REQRES_API_KEY environment variable is required');
  }

  return {
    'x-api-key': apiKey,
    'X-Reqres-Env': 'prod',
    'Content-Type': 'application/json',
    'User-Agent': 'dmbiel-reqres-k6/1.0',
    ...extraHeaders,
  };
}

export function buildParams(params = {}) {
  const { headers = {}, tags = {}, ...rest } = params;

  return {
    ...rest,
    headers: buildHeaders(headers),
    tags: {
      environment: __ENV.ENVIRONMENT || 'prod',
      ...tags,
    },
  };
}

export function get(path, params = {}) {
  return http.get(`${env.baseUrl}${path}`, buildParams(params));
}

export function post(path, body, params = {}) {
  return http.post(`${env.baseUrl}${path}`, JSON.stringify(body), buildParams(params));
}
