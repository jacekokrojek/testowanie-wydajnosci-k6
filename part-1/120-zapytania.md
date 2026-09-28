# Wysyłanie zapytań HTTP

W tej części omówimy, jak w k6 wysyłać różne warianty zapytań HTTP oraz pokażemy obsługę najczęściej spotykanych typów treści. Omówimy również sposób odczytu odpowiedzi serwera oraz jej walidację.

## Zapytanie GET

Najczęściej wykorzystywaną metodą protokołu HTTP jest metoda `GET`. Używamy jej do pobierania danych z serwera. Prosty przykład pokazujący wysłanie zapytania `GET` omówiliśmy już w poprzednim rozdziale. Teraz pokażę, jak przesyłać w nim dodatkowe parametry.

Zaczniemy od wariantu, w którym przesyłane parametry nie wymagają kodowania (w uproszczeniu nie zawierają spacji, znaków innych niż 0-9, a-z, A-Z oraz znaków specjalnych). W takim przypadku możemy dodać do adresu URL znak `?`, a następnie parametry w postaci `klucz=wartość` oddzielone znakiem `&`.

```javascript
import http from 'k6/http';

let url = 'https://httpbin.org/get?search=tv&sort=asc&limit=10';
let res = http.get(url);
```

Poniższy przykład pokazuje, jak dołączać dynamiczne parametry z wykorzystaniem szablonów stringów (template literals) w JavaScript. Korzystając ze znaków backticks (`` ` ``), możemy łatwo łączyć zmienne i teksty statyczne.

```javascript
import http from 'k6/http';

let startIndex = Math.floor(Math.random() * 10) + 1;
let url = `https://httpbin.org/get?search=tv&sort=asc&limit=10&start=${startIndex}`;
let res = http.get(url);
```

Jeśli spodziewamy się danych wymagających zakodowania, k6 dostarcza dedykowany mechanizm do budowania adresów URL. W tym celu wykorzystujemy klasę `URL` z modułu `k6/http`. Klasa ta pozwala na łatwe dodawanie parametrów do adresu URL oraz ich odpowiednie zakodowanie.

```javascript
import http from 'k6/http';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

const url = new URL('https://httpbin.org/get');
url.searchParams.append('search', 'organic');
url.searchParams.append('sort', 'dest');
url.searchParams.append('limit', '1');

const res = http.get(url.toString());
```

Więcej informacji na temat wykorzystanych obiektów znajdziesz pod linkiem [URLs with query parameters](https://grafana.com/docs/k6/latest/examples/url-query-parameters/).

Dla kompletności dodam, że możemy też wykorzystać funkcję `http.url` jako tagged template literal. Pokazuje to przykład poniżej.

```javascript
import http from 'k6/http';

const specialValue = 'a value with spaces & symbols';
const res = http.get(http.url`https://httpbin.org/get?param=${specialValue}`, {
  headers: {
    accept: 'application/json',
  },
});
```

Więcej informacji na temat tego podejścia możesz znaleźć pod linkiem [https://grafana.com/docs/k6/latest/javascript-api/k6-http/url/](https://grafana.com/docs/k6/latest/javascript-api/k6-http/url/).

## Zapytania POST i PUT

Chcąc przesłać dane do serwera, wykorzystujemy metody `POST` lub `PUT`. Jeśli chcemy przesłać obiekt JSON, będziemy musieli go przekonwertować na jego tekstową reprezentację. W JavaScript możemy to zrobić za pomocą funkcji `JSON.stringify()`. Wynikowy tekst załączamy do funkcji wysyłającej zapytanie. Musimy pamiętać też o dodaniu informacji o typie przesyłanych danych. Używamy do tego nagłówka `Content-Type`, który dla danych JSON ustawiamy na wartość `application/json`. Nagłówki oraz inne parametry zapytania dodajemy jako ostatni argument funkcji.

```javascript
import http from 'k6/http';

export default function () {
  const data = { title: 'foo', body: 'bar', userId: 1 };
  const payload = JSON.stringify(data);
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post('https://httpbin.org/post', payload, params);
}
```

Pozostałe parametry zapytań możesz poznać, odwiedzając stronę [https://grafana.com/docs/k6/latest/javascript-api/k6-http/params/](https://grafana.com/docs/k6/latest/javascript-api/k6-http/params/).

## Obsługa często spotykanych typów danych

Mimo że w większości przypadków przesyłamy dane w formacie JSON, czasami będziemy musieli obsłużyć inne typy danych. W tej sekcji omówimy najczęściej spotykane z nich.

### application/x-www-form-urlencoded

Ten typ danych będzie nam potrzebny do symulowania wysyłania danych poprzez standardowy formularz na stronie www. W k6, jeśli nie podamy typu przesyłanych danych, domyślnie zostanie on zakodowany jako `application/x-www-form-urlencoded`.

```javascript
import http from 'k6/http';

export default function () {
  const resp = http.post('https://httpbin.org/post', {
    grant_type: 'xyz',
    profile_id: 'xyz',
  });
}
```

### multipart/form-data (upload pliku)

Jeśli chcemy przesłać pliki, musimy wykorzystać format `multipart/form-data`. W tym przypadku treść zapytania składa się z wielu części. Każda z nich rozpoczyna się od nagłówka `Content-Disposition` i jest rozdzielona identyfikatorem `boundary`.

k6 do przesyłania plików udostępnia funkcję `http.file()`. Przesyłając dane jak w przykładzie poniżej, wszystkie elementy zapytania zostaną ustawione automatycznie. Zwróć uwagę, że plik musi być wczytany w sekcji inicjalizacyjnej skryptu.

```javascript
import http from 'k6/http';

const payload = { file: http.file(open('./plik.pdf', 'b'), 'plik.pdf') };

export default function () {
  const res = http.post('https://httpbin.org/anything', payload);
}
```

Bardziej zaawansowany przykład wysyłania zapytań multipart można znaleźć w dokumentacji pod adresem [https://grafana.com/docs/k6/latest/examples/data-uploads/](https://grafana.com/docs/k6/latest/examples/data-uploads/).

## Przetwarzanie odpowiedzi

Być może zwróciłeś uwagę, że wynik działania funkcji z modułu `k6/http` zapisywałem do zmiennej. Dzieje się tak dlatego, że zawiera ona obiekt z informacjami o odpowiedzi serwera. Znajdziemy tam m.in. status i treść odpowiedzi, które możemy wykorzystać do sprawdzenia poprawności działania aplikacji, jak i samego skryptu.

### Wyświetlanie danych

Zanim przejdziemy do walidacji odpowiedzi, pokażę, jak wyświetlić dane odpowiedzi w konsoli. Możemy to zrobić za pomocą funkcji `console.log()`.

```javascript
import http from 'k6/http';

export default function () {
  const res = http.get('https://httpbin.org/get');
  console.log(`Odpowiedź: ${res.body}`);
  console.log(`Status: ${res.status}`);
}
```

Jeśli treść odpowiedzi jest w formacie JSON, możemy użyć funkcji `json()` do przetworzenia jej na obiekt JavaScript, a następnie odwoływać się do jego pól.

```javascript
import http from 'k6/http';

export default function () {
  const res = http.get('https://jsonplaceholder.typicode.com/posts/1');
  const jsonResponse = res.json();
  console.log(`Tytuł: ${jsonResponse.title}`);
}
```

### Walidacja odpowiedzi (`check`)

Wyświetlanie danych odpowiedzi w konsoli to dobre rozwiązanie na etapie tworzenia i debugowania skryptu. W czasie testowania chcielibyśmy, aby wybrane elementy odpowiedzi były weryfikowane automatycznie, a niepoprawne wyniki raportowane w statystykach testu.

W k6 jest to możliwe dzięki funkcji `check()`, która pozwala sprawdzić, czy odpowiedź HTTP lub inne dane spełniają określone kryteria. Każdy `check` zwraca `true` (zaliczony) lub `false` (niezaliczony) i jest rejestrowany jako dodatkowa metryka (`checks`) w raporcie testu.

Funkcja `check()` przyjmuje dwa parametry:
- obiekt do sprawdzenia (np. `res` – odpowiedź HTTP)
- obiekt z nazwami checków i funkcjami zwracającymi `true/false`

Jest to konstrukcja bardziej złożona niż w przypadku `console.log()`, ale warto ją opanować.

```javascript
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

Funkcja `check` pozwala definiować wiele asercji dla danej odpowiedzi. Kolejny przykład weryfikuje jednocześnie status odpowiedzi, obecność pola `userId` w odpowiedzi oraz czas trwania odpowiedzi.

```javascript
check(res, {
  'status jest 200': (r) => r.status === 200,
  'body zawiera userId': (r) => JSON.parse(r.body).userId !== undefined,
  'czas odpowiedzi < 200ms': (r) => r.timings.duration < 200,
});
```

Możliwe jest również logowanie nieudanych walidacji.

```javascript
if (!check(res, { 'status jest 200': (r) => r.status === 200 })) {
  console.error(`Błąd: status ${res.status}`);
}
```

### Debugowanie skryptów

Zamiast analizować problemy w terminalu, można przekierować logowanie do pliku:

```bash
k6 run --log-output=file=./k6.log script.js
```

Możemy również zmienić format logów na `json` lub `raw`. Możemy również włączyć opcje logowania na poziomie protokołu HTTP następującą opcją:

```bash
k6 run --http-debug=full script.js
```

