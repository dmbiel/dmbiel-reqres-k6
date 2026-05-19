export const environments = {
  local: {
    baseUrl: 'https://reqres.in',
  },
  prod: {
    baseUrl: 'https://reqres.in',
  },
};

export function getEnvironment() {
  const envName = __ENV.ENVIRONMENT || 'prod';
  const environment = environments[envName];

  if (!environment) {
    throw new Error(
      `Unknown environment: ${envName}. Available environments: ${Object.keys(environments).join(', ')}`,
    );
  }

  return environment;
}
