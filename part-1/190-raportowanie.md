
# Raportowanie wyników w k6

Wynik testu wydajności nie kończy się na komunikacie „test przeszedł". Zależnie od tego, kto i po co czyta wyniki, potrzebujemy czego innego: programista chce szybko zobaczyć, czy nie pogorszył czasów odpowiedzi, pipeline CI potrzebuje jednoznacznego „przeszedł / nie przeszedł", a zespół chce zobaczyć przebieg testu w czasie, najlepiej obok metryk serwera. k6 daje na to kilka poziomów raportowania. Poniżej przechodzimy przez nie od najprostszego do najbardziej rozbudowanego.

> Przykłady dotyczą k6 w wersji 2.x. W k6 2.0 usunięto flagę `--no-summary` oraz tryb podsumowania `legacy` – jeśli pracujesz na starszej wersji, część opcji może wyglądać inaczej.

## 1. Podsumowanie na końcu testu

Po zakończeniu testu k6 wypisuje w konsoli podsumowanie: wyniki progów (thresholds), wyniki `check`ów oraz zagregowane metryki. Jego wygląd kontrolujemy opcją `--summary-mode`:

- **compact** (domyślny) – najważniejsze wyniki w zwięzłej formie,
- **full** – to samo plus dodatkowe metryki oraz szczegółowe wyniki dla każdej grupy i scenariusza,
- **disabled** – bez podsumowania (zastępuje dawne `--no-summary`).

```bash
k6 run --summary-mode=full script.js
```

Dla metryk typu Trend (np. `http_req_duration`) możemy wybrać, jakie statystyki mają się pojawić, oraz jednostkę czasu:

```bash
k6 run --summary-trend-stats="avg,med,p(95),p(99),max" --summary-time-unit=ms script.js
```

To samo można zapisać w skrypcie, w obiekcie `options`:

```javascript
export const options = {
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
  summaryTimeUnit: 'ms',
};
```

Warto zawsze dodać `med`, `p(95)` i `max`. Średnia potrafi ukryć problem: jeśli 5% żądań trwa 2 sekundy, a reszta 50 ms, średnia wygląda niewinnie, a `p(95)` i `max` od razu pokazują, że coś jest nie tak.

## 2. Progi (thresholds) – raport „przeszedł / nie przeszedł"

Progi zamieniają wynik testu w jednoznaczną decyzję. Definiujemy je w `options` jako warunki na metrykach:

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<800', 'max<2000'],
    checks: ['rate>0.99'],
  },
};
```

Jeśli którykolwiek próg nie zostanie spełniony, k6 oznacza go w podsumowaniu jako niezaliczony i kończy działanie z **niezerowym kodem wyjścia (99)**. Dzięki temu pipeline CI może zatrzymać wdrożenie bez parsowania jakichkolwiek raportów.

Test można też przerwać od razu, gdy próg zostanie przekroczony, zamiast czekać do końca:

```javascript
thresholds: {
  http_req_duration: [{ threshold: 'p(95)<800', abortOnFail: true, delayAbortEval: '10s' }],
},
```

`delayAbortEval` daje testowi czas na „rozgrzanie się", zanim k6 zacznie oceniać próg – bez tego pierwsze, wolniejsze żądania mogłyby przerwać test zbyt wcześnie.

## 3. Własny raport: `handleSummary()`

Jeśli domyślne podsumowanie nie wystarcza, możemy wyeksportować funkcję `handleSummary()`. k6 wywoła ją na końcu testu i przekaże jej obiekt ze wszystkimi wynikami. Funkcja zwraca mapę „nazwa pliku → zawartość", co pozwala zapisać raport w dowolnym formacie (JSON, HTML, JUnit XML dla CI), a klucz `stdout` oznacza standardowe wyjście.

```javascript
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
  };
}
```

Uwaga: gdy eksportujesz `handleSummary()`, k6 **nie wypisuje już domyślnego podsumowania**. Dlatego w przykładzie wyżej ręcznie odtwarzamy je przez `textSummary` i przekazujemy do `stdout`.

Ta sama biblioteka pozwala wygenerować raport w formacie JUnit, który rozumie większość narzędzi CI:

```javascript
import { jUnit } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function handleSummary(data) {
  return { 'junit.xml': jUnit(data) };
}
```

## 4. Web dashboard i raport HTML

k6 ma wbudowany dashboard, który pokazuje metryki testu **w czasie rzeczywistym** w przeglądarce, a na końcu potrafi zapisać samodzielny raport HTML do przesłania zespołowi. Włączamy go zmiennymi środowiskowymi:

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run script.js
```

Dashboard jest dostępny domyślnie pod adresem `http://127.0.0.1:5665`. Zachowanie regulują zmienne:

- `K6_WEB_DASHBOARD` – włącza dashboard (domyślnie `false`),
- `K6_WEB_DASHBOARD_HOST` i `K6_WEB_DASHBOARD_PORT` – adres i port (domyślnie `localhost` i `5665`),
- `K6_WEB_DASHBOARD_PERIOD` – co ile odświeżać dane (domyślnie `10s`),
- `K6_WEB_DASHBOARD_OPEN` – otwiera dashboard w przeglądarce,
- `K6_WEB_DASHBOARD_EXPORT` – nazwa pliku, do którego na końcu testu zostanie zapisany raport HTML.

Raport zawiera wykresy tylko wtedy, gdy test trwa dłużej niż trzykrotność okresu agregacji (`K6_WEB_DASHBOARD_PERIOD`). Przy krótkich testach warto ten okres zmniejszyć.

To najszybszy sposób, żeby zobaczyć **przebieg testu w czasie**, np. piki czasu odpowiedzi, których nie widać w podsumowaniu końcowym.

## 5. Zapis surowych danych do pliku

Podsumowanie to wartości zagregowane. Gdy potrzebujemy każdego punktu pomiarowego (np. do własnej analizy), k6 może zapisywać metryki w trakcie testu do pliku JSON lub CSV:

```bash
k6 run --out json=wyniki.json script.js
k6 run --out csv=wyniki.csv script.js
```

Można użyć kilku wyjść naraz, np. `--out json=wyniki.json --out experimental-prometheus-rw`. Trzeba pamiętać, że przy długich testach z dużym obciążeniem takie pliki potrafią być bardzo duże. Przykładowa analiza z `jq` – liczba żądań w podziale na kody odpowiedzi:

```bash
jq -r 'select(.type=="Point" and .metric=="http_reqs") | .data.tags.status' wyniki.json | sort | uniq -c
```

## 6. Strumieniowanie metryk do zewnętrznych systemów

k6 potrafi wysyłać metryki w czasie rzeczywistym do systemów monitoringu, dzięki czemu wyniki testu można oglądać obok metryk aplikacji i infrastruktury. Wśród obsługiwanych miejsc docelowych są m.in. Grafana Cloud k6, Prometheus (remote write), OpenTelemetry, InfluxDB, TimescaleDB, Elasticsearch, Datadog, New Relic, Dynatrace, Amazon CloudWatch, Apache Kafka, StatsD i Netdata. Część z nich wymaga rozszerzenia k6.

W naszym środowisku szkoleniowym używamy **Prometheusa** (ma włączony odbiornik remote write), a wyniki oglądamy w Grafanie:

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://<host>:9090/api/v1/write K6_PROMETHEUS_RW_TREND_STATS="avg,p(95),max" k6 run -o experimental-prometheus-rw script.js
```

Co warto wiedzieć:

- Metryki dostają prefiks `k6_`, a metryki typu Trend są zamieniane na kilka osobnych szeregów, po jednym na statystykę wskazaną w `K6_PROMETHEUS_RW_TREND_STATS`, np. `k6_http_req_duration_avg`, `k6_http_req_duration_p95`, `k6_http_req_duration_max`. Czasy są przeliczane na **sekundy**.
- k6 wysyła już **zagregowane** statystyki, osobno dla każdego zestawu tagów. Jeśli w adresie jest losowy parametr (np. `?id=sample-app-<losowa liczba>`), domyślny tag `url` tworzy osobny szereg dla każdego adresu. Ustaw stały tag `name` (`http.get(url, { tags: { name: 'keycloak-logo' } })`) i wyłącz systemowy tag `url`, żeby uniknąć setek szeregów.
- Prometheus musi być osiągalny z komputera, na którym działa k6.
- Nazwa wyjścia (`experimental-prometheus-rw`) pochodzi z dokumentacji – w nowszych wersjach k6 sprawdź `k6 run --help`.

Na dashboardzie „Nginx / Keycloak (PromQL)” panel „k6 (klient)” pokazuje wtedy czas widziany przez klienta, a obok są panele z nginx i Keycloaka. Dzięki temu widać, **gdzie w łańcuchu klient → nginx → Keycloak powstaje opóźnienie**.

## Który sposób wybrać?

| Sposób | Kiedy | Zalety | Ograniczenia |
|---|---|---|---|
| Podsumowanie w konsoli | Szybkie uruchomienie lokalne | Zero konfiguracji | Tylko wartości zagregowane |
| Progi (thresholds) | CI, testy regresji | Jednoznaczny wynik i kod wyjścia | Trzeba znać sensowne wartości progów |
| `handleSummary()` | Raporty dla CI, własny format | Pełna kontrola nad formatem | Trzeba napisać kod |
| Web dashboard / raport HTML | Analiza przebiegu w czasie, raport do wysłania | Wbudowany, wykresy | Raport HTML wymaga odpowiednio długiego testu |
| JSON / CSV | Własna analiza każdego punktu | Pełne dane | Duże pliki |
| Prometheus + Grafana | Korelacja z metrykami serwera | Wyniki obok metryk aplikacji, historia | Wymaga infrastruktury i uwagi na tagi |

## Jak pokazać duże różnice w czasach odpowiedzi

Gdy w środowisku pojawiają się opóźnienia i piki (np. wstrzyknięte przez Toxiproxy), dobrze jest połączyć kilka z powyższych sposobów:

1. W podsumowaniu ustaw `summaryTrendStats` na `med`, `p(95)`, `p(99)`, `max` – rozjazd między `med` a `max` od razu pokazuje pik.
2. Dodaj próg na `max` (np. `max<2000`), żeby test wyraźnie „zaświecił się na czerwono".
3. Włącz web dashboard, żeby zobaczyć piki na osi czasu.
4. Wyślij metryki do Prometheusa i porównaj je w Grafanie z czasami z nginx i Keycloaka.
5. Wolne żądania możesz oznaczyć w skrypcie i odszukać po parametrze w Loki (zob. rozdział o Loki):

```javascript
const id = `sample-app-${Math.floor(Math.random() * 1000)}`;
const res = http.get(`https://<host>/resources/<hash>/login/keycloak.v2/img/keycloak-logo-text.svg?id=${id}`);
if (res.timings.duration > 1000) {
  console.warn(`SLOW ${Math.round(res.timings.duration)}ms id=${id}`);
}
```

## Linki

- Podsumowanie na końcu testu: [https://grafana.com/docs/k6/latest/results-output/end-of-test/](https://grafana.com/docs/k6/latest/results-output/end-of-test/)
- Własne podsumowanie (`handleSummary`): [https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/](https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/)
- Web dashboard: [https://grafana.com/docs/k6/latest/results-output/web-dashboard/](https://grafana.com/docs/k6/latest/results-output/web-dashboard/)
- Wyniki w czasie rzeczywistym: [https://grafana.com/docs/k6/latest/results-output/real-time/](https://grafana.com/docs/k6/latest/results-output/real-time/)
- Prometheus remote write: [https://grafana.com/docs/k6/latest/results-output/real-time/prometheus-remote-write/](https://grafana.com/docs/k6/latest/results-output/real-time/prometheus-remote-write/)
- Progi (thresholds): [https://grafana.com/docs/k6/latest/using-k6/thresholds/](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
