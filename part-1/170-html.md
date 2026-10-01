# Testowanie stron WWW i formularzy w k6

Test HTTP może odtwarzać przechodzenie między stronami i wysyłanie formularzy. Najpierw pobieramy HTML, następnie odczytujemy z niego adresy, pola i tokeny potrzebne w kolejnych żądaniach. Takie przekazywanie dynamicznych danych między krokami nazywamy korelacją.

## Test HTTP a przeglądarka

`k6/http` pobiera odpowiedź serwera, a `k6/html` pozwala analizować jej treść. Nie wykonują JavaScript strony, nie renderują CSS i nie pobierają automatycznie wszystkich obrazów czy skryptów. Element widoczny w przeglądarce może więc nie istnieć w HTML otrzymanym przez test HTTP.

Do interakcji z DOM zmienianym przez JavaScript służy `k6/browser`. Tabelę selektorów i porównanie obu podejść znajdziesz w [rozdziale o selektorach HTML i locatorach](../part-2/242-selektory-html-browser.md).

## Pobieranie i parsowanie HTML

`response.html()` parsuje treść odpowiedzi HTTP. Funkcja `parseHTML(tekst)` z modułu `k6/html` przyjmuje dowolny tekst HTML, np. fragment zapisany w zmiennej. Obie zwracają obiekt `Selection`, umożliwiający wyszukiwanie elementów selektorami CSS.

```javascript
import http from 'k6/http';
import { parseHTML } from 'k6/html';

export default function () {
  const response = http.get(__ENV.PAGE_URL);

  const doc = response.html(); // lub parseHTML(response.body);
  
  console.log(doc.find('title').text());

  const fragment = parseHTML('<a href="/customers">Customers</a>');
  console.log(fragment.find('a').attr('href'));
}
```

Dla odpowiedzi HTTP najwygodniej używać `response.html()`. Metoda przyjmuje również selektor, więc poniższe zapisy wybierają te same elementy:

```javascript
const links1 = response.html().find('a[href*="/sell/customers/"]');
const links2 = response.html('a[href*="/sell/customers/"]');
```

Dalsze krótkie fragmenty zakładają, że `response` pochodzi z wcześniejszego żądania i są wykonywane wewnątrz funkcji scenariusza. Nie wyłączaj przechowywania treści odpowiedzi, którą zamierzasz parsować.

Dokumentacja: [Response.html()](https://grafana.com/docs/k6/latest/javascript-api/k6-http/response/response-html/) i [parseHTML()](https://grafana.com/docs/k6/latest/javascript-api/k6-html/parsehtml/).

## Odczyt tekstu, atrybutów i wartości pól

Załóżmy, że odpowiedź zawiera:

```html
<h1>Customers</h1>
<a class="customer-link" href="/sell/customers/123">Maria Jopek</a>
<input name="customer[email]" value="maria@example.com">
```

```javascript
const doc = response.html();
const title = doc.find('h1').text().trim();
const href = doc.find('a.customer-link').attr('href');
const email = doc.find('input[name="customer[email]"]').val();
```

| Metoda | Zastosowanie |
| --- | --- |
| `.text()` | Tekst wewnątrz wybranych elementów, np. nazwa klienta. |
| `.attr('href')` | Atrybut pierwszego wybranego elementu, np. adres linku. |
| `.val()` | Wartość pola formularza. |
| `.size()` | Liczba dopasowanych elementów. |

Pole input nie przechowuje wartości jako tekstu między znacznikami — dlatego do odczytu e-maila używamy `.val()`, a nie `.text()`.

## Wybór spośród wielu elementów

```javascript
const links = response.html('a.customer-link');

console.log(`Liczba linków: ${links.size()}`);

const first = links.first();
const last = links.last();
const second = links.eq(1); // Indeksy zaczynają się od 0.

links.each((index, element) => {
  console.log(`${index}: ${element.attr('href')}`);
});
```

`first()`, `last()` i `eq()` zwracają `Selection`, więc można dalej wywołać `.attr()` lub `.text()`. `get(index)` zwraca `Element`, który ma inny interfejs. Do prostego wyboru po indeksie używaj `.eq(index)`.

### Losowanie linku

```javascript
import { fail } from 'k6';

// Wewnątrz funkcji scenariusza:
const links = response.html('a[href*="/sell/customers/"]');

if (links.size() === 0) {
  fail('Nie znaleziono linków do Customers');
}

const index = Math.floor(Math.random() * links.size());
const href = links.eq(index).attr('href');
```

Każdy pasujący element ma taką samą szansę wyboru. Losujemy od 0 do liczby elementów pomniejszonej o 1. Jeśli selektor znajduje tylko link do menu Customers, zawsze wybierzemy ten link. Aby losować klientów z listy, dopasuj selektor do linków poszczególnych rekordów. Kilka elementów z tym samym `href` zwiększa szansę wylosowania tego adresu.

## Brak elementu i przerwanie zależnych kroków

Zanim odczytasz token lub wyślesz formularz, sprawdź, czy właściwy element istnieje. Zbyt ogólny selektor może wskazać kilka różnych formularzy.

```javascript
import { check, fail } from 'k6';

// Wewnątrz funkcji scenariusza:
const forms = response.html('form[name="customer"]');
const found = check(forms, {
  'znaleziono jeden formularz klienta': (f) => f.size() === 1,
});

if (!found) {
  fail('Nie można kontynuować bez formularza klienta');
}
```

`check()` zapisuje wynik, ale nie zatrzymuje wykonania. `fail()` kończy bieżącą iterację. Jeśli chcesz, aby nieudane sprawdzenia wpływały także na zaliczenie całego testu, skonfiguruj threshold dla `checks`. Więcej w [rozdziale o asercjach](135-asercje.md).

## Linki i adresy względne

`href` może zawierać pełny adres, ścieżkę zaczynającą się od `/` albo ścieżkę względną. Zbuduj pełny URL względem adresu strony, z której odczytano link:

```javascript
import http from 'k6/http';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

// Wewnątrz funkcji scenariusza, po sprawdzeniu i odczytaniu href:
const customersUrl = new URL(href, response.url).toString();
const nextPage = http.get(customersUrl);
```

Dla zwykłych linków nawigacyjnych taki zapis obsługuje zarówno pełne, jak i względne adresy. Jeżeli dokument używa `<base href>`, uwzględnij wskazaną w nim bazę. Odrzuć puste adresy oraz linki takie jak `javascript:` lub `mailto:`, jeśli selektor może je zwrócić.

### Skrót clickLink()

`clickLink()` wyszukuje link i wykonuje odpowiadające mu żądanie. Link wskazujemy parametrem `selector`, nie `text`:

```javascript
const nextPage = response.clickLink({
  selector: 'a[href*="/sell/customers/"]',
});
```

Ta operacja nie uruchamia obsługi zdarzenia `onclick` w JavaScript strony.
Przy wielu dopasowaniach użyj jawnego wyboru i `http.get()`, gdy chcesz np. losować.  
[Dokumentacja clickLink()](https://grafana.com/docs/k6/latest/javascript-api/k6-http/response/response-clicklink/).

## Wysyłanie formularzy

`submitForm()` zbiera dane wybranego formularza i wysyła żądanie. Sposób wysłania zależy od formularza: atrybut `method` określa metodę, a `action` adres. Brak `method` oznacza domyślnie GET; brak adresu akcji oznacza wysłanie do adresu bieżącej strony.

```html
<form name="customer" method="post" action="/sell/customers/new">
  <input name="customer[email]" value="">
  <input type="hidden" name="customer[_token]" value="dynamiczny-token">
  <button type="submit" name="save" value="1">Save</button>
</form>
```

```javascript
response = response.submitForm({
  formSelector: 'form[name="customer"]',
  fields: {
    'customer[email]': 'maria@example.com',
  },
  submitSelector: 'button[name="save"]',
  params: {
    tags: { name: 'POST /sell/customers/new' },
  },
});
```

`fields` ustawia lub nadpisuje wartości według atrybutu **name**, nie `id`. Pozostałe pola formularza, w tym ukryty token, mogą zostać pobrane automatycznie z HTML. `submitSelector` wskazuje przycisk wysyłania, a `params` pozwala przekazać parametry żądania, np. tagi lub nagłówki. [Dokumentacja submitForm()](https://grafana.com/docs/k6/latest/javascript-api/k6-http/response/response-submitform/).

W rzeczywistej aplikacji uzupełnij wszystkie wymagane pola. Dla pól wielowartościowych, np. grup klienta, zweryfikuj wysyłany format: lista wartości nie jest tym samym co jeden napis `1,2,3`.

## Sprawdzanie rezultatu

Status `200` nie dowodzi, że formularz został poprawnie zapisany. Serwer może zwrócić formularz z komunikatem o błędnym e-mailu lub nieważnym tokenie. Sprawdź element potwierdzający sukces, oczekiwany adres po przekierowaniu albo utworzony rekord.

Po automatycznym przekierowaniu `response.status` i `response.url` opisują końcową odpowiedź. Przy diagnozowaniu wysłanego POST sprawdź również wcześniejsze żądania w logu HTTP.

## Kompletny przykład: link → formularz → wynik

Poniższy przykład zakłada przykładową stronę o ustalonym kontrakcie:

- `START_URL` wskazuje stronę z jednym linkiem `a[data-testid="new-customer"]`.
- Link prowadzi do formularza `form[name="customer"]`, z `method="post"`, poprawnym `action`, polem e-mail i ukrytym tokenem `customer[_token]`.
- Po zapisie serwer zwraca, ewentualnie po przekierowaniu, element `[data-testid="customer-created"]` zawierający zapisany e-mail.

```javascript
import http from 'k6/http';
import { check, fail } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: { checks: ['rate==1'] },
};

export default function () {
  if (!__ENV.START_URL || !__ENV.RUN_ID) {
    fail('Ustaw START_URL oraz unikalny RUN_ID');
  }

  let response = http.get(__ENV.START_URL);
  const link = response.html('a[data-testid="new-customer"]');

  if (!check(link, {
    'link do formularza istnieje': (s) => s.size() === 1 && Boolean(s.attr('href')),
  })) {
    fail('Nie można otworzyć formularza');
  }

  const formUrl = new URL(link.attr('href'), response.url).toString();
  response = http.get(formUrl);
  const form = response.html('form[name="customer"]');

  if (!check(form, {
    'formularz i token są dostępne': (s) => s.size() === 1 &&
      Boolean(s.find('input[name="customer[_token]"]').val()),
  })) {
    fail('Nie można wysłać formularza');
  }

  const email = `maria-${__ENV.RUN_ID}-${__VU}-${__ITER}@example.com`;
  response = response.submitForm({
    formSelector: 'form[name="customer"]',
    fields: { 'customer[email]': email },
  });

  check(response, {
    'utworzono klienta z oczekiwanym e-mailem': (r) => r.status === 200 &&
      r.html('[data-testid="customer-created"]').text().includes(email),
  });
}
```
