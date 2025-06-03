# Matryki i ich analiza

Domyślny raport k6 zawiera podsumowanie i statystyki bazujące na wszystkich zapytaniach w czasie testu. Uruchamiając test z opcją `--summary-mode full` możemy zobaczyć również statystyki per grupę zapytań i scenariusz. Jest to wystarczające w większości przypadków. Poniżej pokażemy możliwośc, dostosowania raportu do własnych potrzeb.  

## Raport końcowy

Raport końcowy zawiera statystyki wygenerowane na zakończenie testu. Jest budowany na podstawie obiektu, którego fragment możecie zobaczyć poniżej.

```json
{
    ...
    "metrics":  [{
        "http_req_duration": {
        "type": "trend",
        "contains": "time",
        "values": {
            "min": 54.343,
            "med": 58.1421,
            "max": 65.0555,
            "p(90)": 62.08442,
            "p(95)": 63.569959999999995,
            "avg": 58.81597000000001
        }
    }]
}
```

Możemy zmodyfikować informacje wyświetalane zarówno w konsoli jak i generowane w plikach po zakończeniu testu korzystając z funkcji handleSummary. Przykład poniżej modyfikuje dane a następnie wyświetla je na standardowym raporcie konsolowym k6 oraz dodatkowo w pliku json.

```javascript
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function handleSummary(data) {
  delete data.metrics['http_req_duration{expected_response:true}'];

  for (const key in data.metrics) {
    if (key.startsWith('iteration')) delete data.metrics[key];
  }

  return {
    stdout: textSummary(data, { indent: '→', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
  
}
```

## Metryki

W przypadku problemów z wydajnością potrzebujemy poznać szczegóły nie tylko na poziomie zapytań lub ich grup. Do tego celu musimy poznać podejście i mechanizmy jakie zastosowali twórców narzędzia. 

W typowych narzędziach do testowania wydajności wyniki zbierane są w pliku csv (np. jtl w JMeter). W pliku takim dla każdego zapytania znajdziemy linię zawierającą informacje na temat jego czasu odpowiedzi, statusu oraz inne informacje przydatne w analizie wyników.

W k6 dla każdego zapytania generowany jest zbiór metryk. Jest on nieco inny w zależności od wykorzystywanego protokołu (szczegółową listę możesz znaleźć pod adresem [https://grafana.com/docs/k6/latest/using-k6/metrics/reference/](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/)). 

Każda metryka zawiera nazwę, typ a także dane zawierające znacznik czasu, wartość metryki oraz dodatkowe tagi przypisane do metryki (zwykle określające szczegóły zapytania). Przykład metryk dla zapytania HTTP pokazałem znajdziecie poniżej:

```json
{"metric":"http_reqs","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":1,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_duration","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":57.0746,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_blocked","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":0,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_connecting","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":0,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_tls_handshaking","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":0,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_sending","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":0,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_waiting","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":55.957,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_receiving","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":1.1176,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"http_req_failed","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":0,"tags":{"expected_response":"true","group":"","method":"POST","myTag":"authorize","name":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token","proto":"HTTP/2.0","scenario":"default","status":"200","tls_version":"tls1.3","url":"https://3.79.196.112/realms/sample-app/protocol/openid-connect/token"}}}
{"metric":"checks","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":1,"tags":{"check":"status is 200","group":"","scenario":"default"}}}
{"metric":"data_sent","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":166,"tags":{"group":"","scenario":"default"}}}
{"metric":"data_received","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":1922,"tags":{"group":"","scenario":"default"}}}
{"metric":"iteration_duration","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":57.0746,"tags":{"group":"","scenario":"default"}}}
{"metric":"iterations","type":"Point","data":{"time":"2025-06-02T18:44:55.8795741+02:00","value":1,"tags":{"group":"","scenario":"default"}}}
```

Z zakres informacji zawartych w klasycznym podejściu i podejściu k6 jest bardzo podobny, są one jednak zorganizowane w inny sposób. Podejście k6 jest zoptymalizowane do przetwarzania wyników w bazach timeseries (TSDB) i narzędziach wizualizujących takie dane.

## Publikowanie danych w czasie rzeczywistym
Korzystając z opcji `--out` możemy wskazać do jakiego formatu będą publikowane metryki z testów. W zależności od stosu technologicznego jaki wykorzystujemy możemy dalej przetwarzać dane w wygodny dla nas sposób. Poniżej pokażę jak możemy w prosty sposób przetwarzać dane w formacie json narzędziem jq.

Zanim zaczniemy poznajmy kilka możliwości narzędzia.

Chcąc z danych json odfiltrować, te które mają odpowiednie wartości pól (oznaczone są odpowiednimi etykietami) możemy skorzystać ze składni:

```
select(.type=="Point" and .metric == "http_req_duration")
```

Dodając do wcześniejszego filtra poniższy zapis możemy z obiektów pobrać wartość metryki
```
| .data.value
```

W kolenym kroku możemy obliczyć średnią korzystając z zapisu
```
| jq -s 'add/length'
```
Podobnie możemy pobrać inne miary statystyczne np.

```
| jq -s min
```
Całe zapytanie wygląda jak poniżej
```
jq '.| select(.type=="Point" and .metric == "http_req_duration" and .data.tags.name) | .data.value' keycl 
oak-results.json | jq -s 'add/length'
```

Dziękuję za pomoc Grześkowi Piechnikowi, autorowi artykułu [How to quickly read summary data in k6 from json file](https://medium.com/@gpiechnik/how-to-quick-read-summary-data-in-k6-from-json-file-f9d09bccd9c2), z którego zaczerpnięto pomysł.

Podobnie możesz wykrzystać do analizy Powershell

```powershell
$values = Get-Content -Path "keycloak-results.json" | ForEach-Object {
    $obj = $_ | ConvertFrom-Json
    if (
        $obj.type -eq "Point" -and
        $obj.metric -eq "http_req_duration" -and
        $obj.data.tags.name
    ) {
        $obj.data.value
    }
}

# Oblicz średnią wartość
$average = ($values | Measure-Object -Average).Average
$average
```
### Integracje 

K6 jest zoptymalizowana do eksporotowania wyników testów do zewnętrznych systemów i baz danych timeseries. Wśród dostępnych integracji znajdziesz najpopularniejsze rozwiązania na rynku. Integracja sprowadza się do wybrania odpowiedniego typu wyjściowego i sknfigurowanie parametrów. Poniżej przykład integracji z Promethus RW. Zwróć uwagę, że domyślnie wysyłany tylko jedną metrykę. Jeśli chcesz aby było ich więce musisz je wskazać.

```
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
K6_PROMETHEUS_RW_TREND_STATS=p(95),p(99),avg,min,max \
k6 run -o experimental-prometheus-rw script.js
```

