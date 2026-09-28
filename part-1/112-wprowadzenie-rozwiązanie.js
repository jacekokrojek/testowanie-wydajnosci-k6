import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend } from 'k6/metrics';

const myTrend = new Trend('custom_response_time');

export const options = {
  vus: 1,
  duration: '30s',
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(80)'],
};

export default function () {
  const res = http.get('https://63.177.237.242/resources/2rh13/login/keycloak.v2/img/keycloak-logo-text.svg');
  check(res, { 'status is 200': (r) => r.status === 200 });
  myTrend.add(res.timings.duration);
  sleep(5);
}
