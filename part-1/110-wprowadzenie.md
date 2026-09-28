
# Wprowadzenie do k6

Pytania wprowadzające:
- ❓Czym różnią się testy wydajności od testów funkcjonalnych?
- ❓Czym różnią się narzędzia do testowania wydajności od narzędzi do testowania funkcjonalnego?

## Podstawowe informacje

**k6** to narzędzie open-source służące do testowania wydajności. Umożliwia pisanie skryptów testowych w **JavaScript/ES6/TypeScript**, co pozwala łatwo modelować różne scenariusze użytkowników.

> k6 jest napisany w Go i wykorzystuje silnik JavaScript Sobek, będący forkiem projektu Goja. Sobek obsługuje nowoczesne funkcje ECMAScript (ES6+). k6 nie jest jednak środowiskiem Node.js ani przeglądarką, dlatego nie udostępnia automatycznie API charakterystycznych dla tych środowisk. k6 używa esbuild, żeby przetranspilować pliki .ts do JavaScriptu, a dopiero wynik wykonuje runtime. Jest to częściowe wsparcie TS.

### Najważniejsze cechy k6:

- składnia oparta na JavaScript/TypeScript
- uruchamianie testów lokalnie lub w chmurze (np. [k6 Cloud](https://k6.io/cloud))
- generowanie metryk w czasie rzeczywistym
- integracja z CI/CD
- niskie wykorzystanie zasobów systemowych
- możliwość rozszerzania funkcjonalności i duża społeczność użytkowników

Oficjalna strona: [https://k6.io/](https://k6.io/)  
Repozytorium GitHub: [https://github.com/grafana/k6](https://github.com/grafana/k6)

Kiedy potrzebujesz szybkiej pomocy z dokumentacją lub sprawdzeniem API k6, możesz użyć polecenia:

```bash
k6 x docs
```

Polecenie to otwiera lokalnie dokumentację k6 i pomaga wyszukiwać informacje na temat dostępnych modułów, opcji oraz API.

---

## Budowa skryptu

Skrypt w k6 to plik (moduł) JavaScript. Wymaganym elementem skryptu jest funkcja, którą musimy zadeklarować słowami kluczowymi `export default`. Dzięki temu silnik k6 będzie wiedział, gdzie znaleźć akcje symulujące wirtualnych użytkowników (VUs). Aby móc wysyłać zapytania HTTP, musimy zaimportować odpowiedni moduł. W k6 mamy do dyspozycji kilka wbudowanych modułów, które możemy wykorzystać w naszych testach. Choć nie jest to wymagane, zwykle definiujemy też obiekt `options`. Pozwala on na ustalenie parametrów generowanego obciążenia oraz innych wspólnych parametrów testów. Ostatnim elementem skryptu jest asercja `check()`, która pozwala na walidację odpowiedzi serwera.

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s'
};

export default function () {
  const res = http.get('https://quickpizza.grafana.com/');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

Możesz stworzyć skrypt k6 na podstawie jednego z kilku dostępnych wzorców. Poniżej znajdziesz prosty przykład, jak to zrobić.

```bash
k6 new test.js
```

Więcej informacji na ten temat znajdziesz pod linkiem: https://grafana.com/docs/k6/latest/using-k6/test-authoring/create-test-script-using-the-cli

## Uruchamianie testów

Aby uruchomić skrypt, w terminalu wpisujemy:

```bash
k6 run skrypt.js
```

Po uruchomieniu zobaczymy na konsoli statystyki z wykonanego testu. W przypadku uruchomienia skryptu omówionego powyżej 10 wirtualnych użytkowników (VUs) będzie wysyłać zapytanie testu przez 30 sekund. Jeśli w skrypcie nie zdefiniujemy opcji `options`, k6 domyślnie uruchomi 1 VU przez 10 sekund.

W przypadku testów, które mają być uruchamiane tylko raz, bez powtarzania scenariusza wg definicji `vus`/`duration`, przydatna jest flaga `--once`:

```bash
k6 run --once skrypt.js
```

Działa to dobrze np. do szybkich smok testów, sprawdzania poprawności skryptu lub uruchamiania jednorazowej weryfikacji endpointu.

---
### Opcje uruchamiania testów

Uruchamiając test (np. w ramach potoku CI/CD), warto mieć możliwość kontrolowania parametrów generowanego obciążenia nie tylko poprzez edycję pliku. W k6 możemy zrobić to na kilka sposobów. Jednym z nich jest wykorzystanie opcji dostępnych w linii poleceń przy uruchamianiu testu. Nadpiszą one ustawienia zdefiniowane w pliku.

```bash
k6 run --vus 5 --duration 5m skrypt.js
```

Powyższe polecenie uruchomi test z **5 VU** przez czas **5 minut**.

Pracując na środowiskach testowych, często będziemy pracować z aplikacjami, które nie posiadają zaufanych certyfikatów TLS. W takim przypadku skorzystaj z dodatkowej opcji `--insecure-skip-tls-verify` (odpowiednio `insecureSkipTLSVerify: true` przy definiowaniu parametru w kodzie).

Więcej o konfiguracji przez `options`: [https://grafana.com/docs/k6/latest/using-k6/k6-options/](https://grafana.com/docs/k6/latest/using-k6/k6-options/)

---

## Statystyki z wykonanych testów

Po zakończeniu testu k6 automatycznie wyświetla statystyki, takie jak:

- `http_reqs` – liczba wykonanych żądań HTTP
- `http_req_duration` – czas trwania żądania
- `vus` – liczba aktywnych wirtualnych użytkowników
- `checks` – wyniki testów walidacyjnych

Przykładowy wynik:

```
running (30s), 10/10 VUs, 300 complete and 0 interrupted iterations
default ✓ [======================================] 10 VUs  30s

     ✓ status was 200

     checks.....................: 100.00% ✓ 300 ✗ 0
     http_req_duration...........: avg=120ms  min=90ms  med=110ms  max=250ms
     http_reqs...................: 300     10.000045/s
     vus.........................: 10      min=10 max=10
```

Więcej o statystykach: [https://k6.io/docs/using-k6/results-output/](https://k6.io/docs/using-k6/results-output/)

## Zmiana obciążenia

Jeśli chcemy w teście symulować zmieniające się obciążenie, możemy wykorzystać opcję `stages`. W przykładzie poniżej obciążenie będzie rosło przez pierwsze 30 sekund do 20 VU. Następnie będzie stałe przez okres 1m30s, po czym zacznie opadać do 0.

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 20 },
    { duration: '30s', target: 0 },
  ],
};
```

## Raport HTML

Ciekawą funkcją k6 jest możliwość monitorowania metryk w czasie rzeczywistym oraz wygenerowania raportu po zakończeniu testu. Możesz to zrobić, ustawiając odpowiednie zmienne środowiskowe. Przykład uruchomienia testu znajdziesz poniżej:

W systemach z powłoką bash / zsh:

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run script.js
```

W cmd.exe w systemie Windows:

```cmd
set "K6_WEB_DASHBOARD=true" && set "K6_WEB_DASHBOARD_EXPORT=html-report.html" && k6 run script.js
```

Więcej na ten temat pod linkiem: https://grafana.com/docs/k6/latest/results-output/web-dashboard/


