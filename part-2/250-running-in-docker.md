# Testowanie wydajności w k6 z użyciem Dockera

Integracja narzędzia **k6** z **Dockerem** znacząco ułatwia zarządzanie środowiskiem testowym. Docker pozwala na uruchomienie testów w izolowanym środowisku kontenerowym, dzięki czemu uzyskujemy powtarzalne i niezależne od infrastruktury zewnętrznej środowisko. Testowanie w Dockerze pozwala także na łatwą integrację z systemami CI/CD jak np. GitHub Actions czy GitLab CI.

## Uruchamianie testów k6 w Dockerze

Aby rozpocząć korzystanie z **k6** w Dockerze, wystarczy podstawowa znajomość obsługi obu narzędzi. Gdy nasz test zapisany jest w jednym pliku możemy go uruchomić poniższym poleceniem.

```bash
docker run --rm -i grafana/k6 run - <test.js
```

Jeśli kod testu jest w kilku plikach warto zamontować katalog ze skryptami oraz uruchomić testy poniższą komendą. 

```bash
docker run --rm -v $(pwd):/scripts grafana/k6 run /scripts/test.js
```

## Przekazywanie parametrów i zmiennych środowiskowych

Zamiast statycznie definiować liczbę użytkowników i czas trwania testu, można to zrobić dynamicznie:

```bash
docker run --rm -i grafana/k6 run --vus 10 --duration 30s - <test.js
```

Można też przekazywać zmienne środowiskowe:

```bash
docker run --rm -i grafana/k6 run --vus 10 --duration 30s -e BASE_URL=https://3.71.14.30 - <test.js
```

W skrypcie można je odczytać tak:

```javascript
const url = `${__ENV.BASE_URL}/api/status`;
http.get(url);
```

Dzięki temu możemy używać tego samego skryptu do testowania różnych środowisk.

## Testy przeglądarkowe z k6 browser

K6 wspiera również testy przeglądarkowe z wykorzystaniem silnika Chromium. Aby uruchomić takie testy:

```bash
docker run --rm -v $(pwd):/scripts grafana/k6-browser run /scripts/test-browser.js
```
