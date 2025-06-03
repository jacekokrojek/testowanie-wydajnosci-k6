## Check vs tresholds

W jednym z pierwszch materiałów pokazałem `check` spawdzający czas odpowiedzi zapytania. W testach wydajnościowych rzadko interesuje nas czas pojedynczej próbki. Częściej chcemy dowiedzieć się, czy po wykonaniu całego testu wybrane statystyki są w oczekiwanych granicach. Nie chcemy też sprawdzać wyników ręcznie a być poinformowani o takim przypadku automatycznie. DO tego celu w k6 wprowadzono pojęcie tresholds. Ponieważ dotyczy on wyników całego testu definiujemy go w sekcji options.

```javascript
export let options = {
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% żądań poniżej 500ms
    checks: ['rate>0.99'],            // co najmniej 99% checków musi być pozytywnych
  },
};
```

Jeśli próg określony w threshold zostanie przekroczony, test zakończy się błędem wyjściowym (exit code 99), co może przerwać pipeline CI/CD.

Możesz zdefiniować treshold nie tylko globalnie ale również zawęzić ich działanie do wybranych tagów, typowo do nazwy zapytania.

```javascript
export let options = {
  thresholds: {
    'http_req_duration{name:Login}': ['p(95)<500'],
    'http_req_duration{name:Products}': ['avg<300'],
  },
};
```

Thresholdy pozwalają na wiele więcej a informacje o nich znajdziesz na stronie [Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)