
# Wprowadzenie do k6

## Podstawowe informacje

**k6** to narzędzie open-source do testów obciążeniowych (load testing) i wydajnościowych (performance testing). Umożliwia pisanie skryptów testowych w **JavaScript/ES6**, co pozwala łatwo modelować różne scenariusze użytkowników.

> W szybko zminiającym się ekosystemie JavaScript mamy kilka specyfikacji języka. k6 wykorzystuje silnik Goja (JS engine napisany w Go), który implementuje dużą część ECMAScript 5.1 i części ES6 (ECMAScript 2015). Z praktycznego punktu widzenia przyjmujemy, że skrypt k6 jest zgodny z ES6 (ECMAScript 2015). Najważniejsza różnica to brak obługi async/await.

### Najważniejsze cechy k6:

- prosta składnia oparta na JavaScript
- uruchamianie testów lokalnie lub w chmurze (np. [k6 Cloud](https://k6.io/cloud))
- generowanie metryk w czasie rzeczywistym
- integracja z CI/CD
- niska zajętość zasobów systemowych
- możliwoć rozszerzania możliwosci poprzez doatkowe moduły

Oficjalna strona: [https://k6.io/](https://k6.io/)  
Repozytorium GitHub: [https://github.com/grafana/k6](https://github.com/grafana/k6)

---

## Budowa skryptu i uruchamianie testów

Skrypt w k6 to plik JavaScript. Wymaganym elementem skryptu jest domyslnie eksportowana funkcja. Będzie ona wykonywana przez silnik symulujący wirtualnych użytkowników (VUs).

### Struktura podstawowego skryptu

```javascript
import http from 'k6/http';

export default function () {
  const res = http.get('https://test.k6.io');
}
```

W powyższym przykładzie:

- Importujemy moduł `http`, który pozwala na wysyłanie żądań HTTP
- Wykonujemy zapytanie GET na `https://test.k6.io`

---

### Uruchamianie testów

Aby uruchomić skrypt, w terminalu wpisujemy:

```bash
k6 run skrypt.js
```

Po uruchomieniu zobaczymy na konsoli statystyki z wykonanego testu. Domyslnie kroki testu zostaną wykonane jeden raz przez jednego wirtualnego użytkownika (VU).

---
### Podstawowe opcje uruchamiania

Uruchamiając test chcemy kontrolować parametry generowanego obciążenie. W k6 możemy zrobić to na kilka sposobów. Jednym z nich jest wykorzystanie opcji podawanych w linii polecen przy uruchamianiu testu. Poniżej najważniejsze z nich.

#### `--vus` – liczba wirtualnych użytkowników

Określa ilu użytkowników jednocześnie symulujemy.

#### `--duration` – czas trwania testu

Określa, jak długo ma trwać test (np. `30s`, `1m`, `5m`).

```bash
k6 run --vus 10 --duration 30s skrypt.js
```

Powyższe polecenie uruchomi test z **10 VU** przez **30 sekund**.

---

## Definiowanie opcji testu w skrypcie

Zamiast przekazywać opcje testu (np. `iterations`, `vus`, `duration`) w linii poleceń, możemy zdefiniować je **bezpośrednio w skrypcie** za pomocą obiektu `options`.

Przykład:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  iterations: 10,
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status was 200': (r) => r.status === 200 });
}
```

W tym przykładzie:

- `options.iterations = 10` oznacza, że funkcja `default` zostanie wykonana dokładnie **10 razy** (niezależnie od liczby wirtualnych użytkowników i czasu trwania)

Uruchamiamy test tak samo jak zwykle:

```bash
k6 run skrypt.js
```

> W k6 opcje zdefiniowane w kodzie będą nadpisane jesli podamy odpowiadajace im parametry w linii polecen przy uruchamianiu testów. 

Więcej o konfiguracji przez `options`: [https://k6.io/docs/using-k6/options/](https://k6.io/docs/using-k6/options/)

---

### Dodatkowe opcje uruchamiania

Pracując na srodowiskach testowych często będziemy nam pracować z aplikacjami jakie nie posiadają zaufanych certyfikatów SSL. W takim przypadku skorzystaj z dodatkowej opcji: 

#### `--insecure-skip-tls-verify` – pominięcie weryfikacji certyfikatów TLS (odpowiednio "insecureSkipTLSVerify: true" przy definiowaniu parametru w kodzue) 

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

---

## Podsumowanie

W tym rozdziale nauczyliśmy się:

✅ czym jest k6 i do czego służy  
✅ jak wygląda podstawowy skrypt  
✅ jak uruchamiać testy z różnymi opcjami  
✅ jak interpretować wyniki testu

Przejdźmy teraz do bardziej zaawansowanych scenariuszy! 🎯
