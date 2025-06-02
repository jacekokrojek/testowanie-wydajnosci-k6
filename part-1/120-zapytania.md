# Wysyłanie zapytań HTTP

W tej części omówię jak w k6 wysłać różne warianty zapytań HTTP oraz pokażę obsługę najczęściej spotykanych typów treści. Omówię również jak odczytać odpowiedź serwera oraz jak ją walidować.

## Zapytanie GET

Najczęściej wykorzystywaną metodą protokołu HTTP jest metoda GET. Używamy jej do pobierania danych z serwera. Prosty przykład pokazujący wysłanie zapytania GET omówiliśmy już w poprzednim rozdziale. Teraz pokażę jak przesyłać w nim dodatkowe parametry.

Zaczniemy od wariantu, którym przesyłane parametry nie wymagają kodowania (w uproszczeniu nie zawierają spacji, znaków innych niż 0-9 a-z A-Z oraz znaków specjalnych). W takim przypadku możemy dodawać do adresu url znak `?` a następnie parametry w postaci `klucz=wartość` oddzielone znakiem `&`.

```javascript
let url = 'https://httpbin.org/get?seach=tv&sort=asc&limit=10';
let res = http.get(url);
```

Przykład ponieżej pokazuje, jak dołączać dynamiczne parametry korzystając z szablów stringów (template literals) JavaScript. Korzystając ze znaków \`\` (backticks) możemy łatwo łączyć zmienne i teksty statyczne.

```javascript
let startIndex = Math.floor(Math.random() * 10) + 1;
let url = `https://httpbin.org/get?seach=tv&sort=asc&limit=10&start=${startIndex}`;
let res = http.get(url);
```

Jeśli spodziewamy się danych wymagających zakodowania k6 dostarcza dedykowany mechanizm do budowania adresów URL. W tym celu wykorzystujemy klasę `URL` z modułu `k6/http`. Klasa ta pozwala na łatwe dodawanie parametrów do adresu URL oraz ich odpowiednie zakodowanie.

```javascript
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

const url = new URL('https://httpbin.org/get');
url.searchParams.append('seach', 'organic');
url.searchParams.append('sort', 'dest');
url.searchParams.append('limit', '1');

const res = http.get(url.toString());
```

Więcej informacji na temat wykorzystanych obiektów znajdziesz pod linkiem [URLs with query parameters](https://grafana.com/docs/k6/latest/examples/url-query-parameters/)

Dla kompletności dodam, że możemy też wykorzystać funkcję http.url jako tagged template literal. Pokazuje to przykład poniżej.

```javascript
const specialValue = "a value with spaces & symbols";
const res = http.get(http.url`https://httpbin.org/get?param=${specialValue}`,  {
        headers: {
            'accept': 'application/json'
        }
    });
```

Więcej informacji na temat tego podejścia możesz znaleźć pod linkiem [https://grafana.com/docs/k6/latest/javascript-api/k6-http/url/](https://grafana.com/docs/k6/latest/javascript-api/k6-http/url/).

## Zapytania POST i PUT

Chcąc przesłać dane do serwera wykorzystujemy metody POST lub PUT. Jeśli chcemy przesłać obiekt JSON będziemy musieli go przekonwertować na jego tekstową reprezentację. W JavaScript możemy to zrobić za pomocą funkcji JSON.stringify(). Wynikowy tekst załączamy do funkcji wysyłającej zapytanie. Musimy  pamiętać też, aby dodać informacje typie przesyłanych danych. Używamy do tego nagłówka `Content-Type`, który dla danych JSON ustawiamy na wartość `application/json`. Nagłówki oraz inne parametry zapytania dodajemy jako ostatni argument funkcji.

```javascript
export default function () {
    data =  { title: 'foo', body: 'bar', userId: 1 }
    let payload = JSON.stringify(data);
    let params = { headers: { 'Content-Type': 'application/json' } };    
    let res = http.post('https://httpbin.org/post', payload, params);
}
```

Pozostałe parametry zapytań możesz poznać odwiedzając stronę [https://grafana.com/docs/k6/latest/javascript-api/k6-http/params/](https://grafana.com/docs/k6/latest/javascript-api/k6-http/params/).

## Obsługa często spotykanych typów danych

Mimo, że w większości przypadków przesyłamy dane w formacie JSON, czasami będziemy musieli obsłużyć inne typy danych. W tej sekcji omówię najczęściej spotykane z nich.

### application/x-www-form-urlencoded

Ten typ danych będzie nam potrzebny do symulowania wysyłania danych poprzez standardowy formularz na stronie www. W k6 jeśli nie podamy typu przesyłanych danych domyślnie zostanie on zakodowany jako application/x-www-form-urlencoded'.

```javascript

export default function () {
    let resp = http.post('https://httpbin.org/post', { 'grant_type': 'xyz', 'profile_id': 'xyz' });
}
```

### multipart/form-data (upload pliku)

Jeśli chcemy przesłać pliki musimy wykorzystać format `multipart/form-data`. W tym przypadku treść zapytania składa się z części. Każda z nich rozpoczyna się od nagłówka Content-Disposition i jest rozdzielona identyfikatorem boundary.

K6 do przesyłania plików udostępnia funkcję `http.file()`. Przesyłając dane jak w przykładzie poniżej wszystkie elementy zapytania zostaną ustawione automatycznie. Zwróć uwagę, że plik musi być wczytany w sekcji inicjalizacyjnej skryptu.

```javascript
let payload = { file: http.file(open('./plik.pdf', 'b'), 'plik.pdf') };

export default function () {
    let res = http.post('https://httpbin.org/anything', payload);
}
```

Bardziej zaawanowany przykład wysyłania zapytań multipart można znaleźć w dokumentacji pod adresem [https://grafana.com/docs/k6/latest/examples/data-uploads/](https://grafana.com/docs/k6/latest/examples/data-uploads/).

## Przetwarzanie odpowiedzi

Być może zwróciłeś uwagę, że wynik działania funkcji `k6/http` zapisywałem do zmiennej. Jest tak dlatego, że zawiera on obiekt z informacjami o odpowiedzi serwera. Znajdziemy tam m.in status i treść odpowiedzi, które możemy wykorzystać do spawdzenia poprawności działania aplikacji jak i samego skryptu. 

### Wyświetalanie danych

Zanim przejdziemy do walidacji odpowiedzi, pokażę jak wyświetlić dane odpowiedzi w konsoli. Możemy to zrobić za pomocą funkcji `console.log()`.

```javascript
import http from 'k6/http';
import { check } from 'k6';

export default function(){
    let res = http.get()
    console.log(`Odpowiedź: ${res.body}`);
    console.log(`Status: ${res.status}`);
}
```

Jeśli odpowiedź jest w formacie JSON możemy dodatkowo użyć `JSON.parse()` do przetworzenia jej z tekstu na obiekt JavaScript a dalej odwoływać się do jego pól. 

```javascript
import http from 'k6/http';

export default function(){
    let res = http.get('https://jsonplaceholder.typicode.com/posts/1')
    let jsonResponse = JSON.parse(res.body);
    console.log(`Tytuł: ${jsonResponse.title}`);
}
```

### Walidacja odpowiedzi (checks)
Wyświetlania danych odpowiedzi w konsoli to dobre rozwiązanie do na etapie tworzenia i debugowania skryptu. W czasie testowania chcielibyśmy aby wybrane elementy odpowiedzi były weryfikowane automatycznie a niepoprawne wyniki raportowne w statystykach testu.

W k6 jest to możliwe dzięki funkcji `checks()`, która pozwalaja sprawdzić, czy odpowiedź HTTP lub inne dane spełniają określone kryteria. Każdy check zwraca `true` (zaliczony) lub `false` (niezaliczony) i jest rejestrowany jako **dodatkowa metryka (`checks`)** w raporcie testu.

Funkcja `check()` przyjmuje dwa parametry: 
- obiekt do sprawdzenia (np. `res` – odpowiedź HTTP)
- obiekt z nazwami checków i funkcjami zwracającymi `true/false`
Jest to konstrukcja bardziej złożona niż w przypadku `console.log()` ale warto ją opanować.

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

Funkcja `check` pozwala definiować wiele asercje dla danej odpowiedzi. Kolejny przykład weryfikuje jednocześnie status odpowiedzi, obecność pola `userId` w odpowiedzi oraz czas trwania odpowiedzi.

```javascript
check(res, {
    'status jest 200': (r) => r.status === 200,
    'body zawiera userId': (r) => JSON.parse(r.body).userId !== undefined,
    'czas odpowiedzi < 200ms': (r) => r.timings.duration < 200
});
```

Możliwe jest również logowanie nieudanych walidacji.

```javascript
if (!check(res, { 'status jest 200': (r) => r.status === 200 })) {
    console.error(`Błąd: status ${res.status}`);
}
```



