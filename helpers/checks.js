import { check } from 'k6';

export function checkStatus(response, expectedStatus) {
  return check(response, {
    [`status is ${expectedStatus}`]: (res) => res.status === expectedStatus,
  });
}

export function checkJsonField(response, fieldName) {
  return check(response, {
    [`response has field: ${fieldName}`]: (res) => {
      try {
        const body = res.json();
        return Object.prototype.hasOwnProperty.call(body, fieldName);
      } catch {
        return false;
      }
    },
  });
}

export function checkResponseTime(response, maxMs) {
  return check(response, {
    [`response time < ${maxMs}ms`]: (res) => res.timings.duration < maxMs,
  });
}
