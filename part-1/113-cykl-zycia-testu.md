# Cykl życia testu: init, setup, scenariusz i teardown

W k6 miejsce zapisania kodu wpływa na to, kiedy i ile razy zostanie wykonany. Podstawowa kolejność to:

```text
init → setup() → iteracje funkcji scenariusza → teardown()
```

`prepare()` nie jest specjalną funkcją k6. Jeśli zdefiniujesz funkcję o takiej nazwie, musisz sam ją wywołać. Do przygotowania testu k6 udostępnia eksportowaną funkcję `setup()`.

## Kod poza funkcjami — init

Kod na najwyższym poziomie modułu wykonuje się podczas jego inicjalizacji. Tutaj umieszczamy importy, konfigurację `options`, wczytywanie plików przez `open()` i tworzenie `SharedArray`.

Nie zakładaj, że init wykona się raz dla całego testu. k6 tworzy osobne środowiska JavaScript dla VU, a także konteksty potrzebne do obsługi testu. Zwykła zmienna globalna nie jest wspólną zmienną wszystkich VU.

W init nie można wykonywać zapytań HTTP przez `k6/http`. Umieszczenie definicji funkcji w pliku nie uruchamia jej treści — funkcja wykona się dopiero po wywołaniu.

## setup() — przygotowanie przed iteracjami

Eksportowane `setup()` wykonuje się przed rozpoczęciem iteracji. W typowym lokalnym uruchomieniu jest wywoływane raz na proces k6. Możesz tutaj wykonać HTTP, np. utworzyć dane przez API albo sprawdzić dostępność środowiska.

Wynik `return` z `setup()` jest przekazywany jako argument funkcji scenariusza oraz `teardown()`. Powinny to być dane serializowalne do JSON, np. obiekty, tablice, tekst i liczby, a nie funkcje lub aktywne połączenia.

## Funkcja scenariusza — praca wirtualnych użytkowników

`default()` albo funkcja wskazana przez `options.scenarios.<nazwa>.exec` wykonuje kroki użytkownika. Liczbą i tempem iteracji steruje executor. To tutaj zwykle wysyłamy zapytania do testowanej aplikacji, sprawdzamy odpowiedzi i wykonujemy `sleep()`.

## teardown() — sprzątanie po iteracjach

Eksportowane `teardown(data)` służy np. do usunięcia danych przygotowanych przed testem. Otrzymuje dane zwrócone przez `setup()`, a nie zmiany wprowadzone do nich przez VU.

Nie traktuj `teardown()` jako gwarantowanego sprzątania po każdej awarii: błąd w `setup()` lub gwałtowne zakończenie procesu może uniemożliwić jego wykonanie.

## Porównanie

| Cecha | Init | setup() | Funkcja scenariusza | teardown() |
| --- | --- | --- | --- | --- |
| Moment | Inicjalizacja kontekstów | Przed iteracjami | Każda iteracja | Po iteracjach |
| Liczba wykonań | M.in. dla każdego VU | Zwykle raz na proces | Zależna od executora | Zwykle raz na proces |
| HTTP | Nie | Tak | Tak | Tak |
| Typowe zastosowanie | Importy, pliki, konfiguracja | Przygotowanie danych | Symulacja użytkownika | Sprzątanie danych |

## Przykład do uruchomienia

Przykład nie wymaga aplikacji ani dodatkowych plików. Uruchom go przez `k6 run cykl-zycia.js` i porównaj komunikaty:

```javascript
import execution from 'k6/execution';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    example: {
      executor: 'per-vu-iterations',
      vus: 2,
      iterations: 2,
      maxDuration: '30s',
    },
  },
};

// Init: każdy VU ma własny licznik.
let localCounter = 0;

export function setup() {
  console.log('setup: przygotowanie danych');
  return { prefix: 'student', counter: 0 };
}

export default function (data) {
  localCounter += 1;
  data.counter += 1;
  console.log(JSON.stringify({
    vu: execution.vu.idInTest,
    localCounter,
    setupDataCounter: data.counter,
  }));
  sleep(0.1);
}

export function teardown(data) {
  console.log(`teardown: counter z setup = ${data.counter}`);
}
```

Każdy VU wykona dwie iteracje i będzie miał własny `localCounter`: 1, a następnie 2. Dane z `setup()` również nie stanowią wspólnego, modyfikowalnego obiektu między VU. `teardown()` zobaczy pierwotne `counter: 0`. Kolejność komunikatów różnych VU może się różnić.

## Zastosowanie w naszych ćwiczeniach

- Plik z kontami wczytaj w init, np. `JSON.parse(open('./users.json'))`; duże listy możesz umieścić w `SharedArray`.
- Przygotowanie danych przez API można wykonać w `setup()`.
- Logowanie w `setup()` i zwrócenie jednego tokenu oznacza używanie tego samego tokenu przez VU, a nie osobne logowanie każdego użytkownika. Cookies z `setup()` nie przechodzą automatycznie do sesji HTTP VU.
- Jeśli celem jest mierzenie logowania, umieść je w funkcji scenariusza. Jeśli użytkownik ma się logować tylko raz, potrzebujesz osobnego stanu sesji dla każdego VU.
- W zwykłym rozproszonym uruchomieniu OSS nie zakładaj jednego globalnego `setup()` i `teardown()` dla wszystkich generatorów. Uwzględnij oddzielne procesy i unikaj wielokrotnego tworzenia lub usuwania tych samych danych.

Dokumentacja: [Test lifecycle](https://grafana.com/docs/k6/latest/using-k6/test-lifecycle/).
