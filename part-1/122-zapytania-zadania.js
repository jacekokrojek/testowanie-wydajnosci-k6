import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {

    stages: [
      { duration: '30s', target: 10},
      { duration: '30s', target: 10 },
      // { duration: '60s', target: 10 },
      // { duration: '90s', target: 15 },
    ],
    // iterations: 1,
    // vus: 1,
    summaryTrendStats: ['avg', 'med', 'min', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

function getOpenIdConfig(hostname) {
  const res = http.get(`https://${hostname}/realms/sample-app/.well-known/openid-configuration`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

export function authorize(hostname) {
  const url = `https://${hostname}/realms/sample-app/protocol/openid-connect/token`;
  const payload = {
    grant_type: 'client_credentials',
    client_id: __ENV.CLIENT_ID || 'client-pat',
    client_secret: __ENV.CLIENT_SECRET || 'WJmCgangJQYEttl2fQOvjdniGIJbHvWq',
  };

  const res = http.post(url, payload);
  check(res, {
    'token endpoint responds 200': (r) => r.status === 200,
  });

  const jsonResponse = res.json();
  return jsonResponse.access_token;
}

export default function () {
  const hostname = __ENV.HOSTNAME || '52.59.132.57';
  //getOpenIdConfig(hostname);
  const token = authorize(hostname);
  console.log(`token length: ${token.length}`);
  // sleep(5)
}

// export function handleSummary(data) {
//   const d = data.metrics.http_req_duration.values;
//   const reqs = data.metrics.http_reqs.values;
//   const failed = data.metrics.http_req_failed ? data.metrics.http_req_failed.values.rate * 100 : 0;
//   const recv = data.metrics.data_received.values.rate / 1024;
//   const sent = data.metrics.data_sent.values.rate / 1024;

//   const row = [
//     options.vus, 'TOTAL', reqs.count,
//     d.avg.toFixed(0), d.med.toFixed(0),
//     d['p(90)'].toFixed(0), d['p(95)'].toFixed(0), d['p(99)'].toFixed(0),
//     d.min.toFixed(0), d.max.toFixed(0),
//     failed.toFixed(2), reqs.rate.toFixed(1),
//     recv.toFixed(1), sent.toFixed(1),
//   ].join(',');
//   // return { stdout: row + '\n' };
//   return { [`vu${options.vus}.csv`]: row + '\n' };
// }