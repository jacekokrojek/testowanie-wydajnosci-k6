# WYsyłanie zapytań HTTPS

W tym materiale omówimy różne warianty żądań HTTP. Pokażemy obsługę różnych typów treści, parametryzację danych, aż po walidację odpowiedzi.

---

## 1. Wysyłanie żądań GET, POST, PUT, DELETE

Przyglądając się funkcjom i parametrom jakie udostępnia k6 mam wrażenie, że twórcom zależało na spójności z założeniami protokołu HTTP. W większości przypadków przesyłane dane muszą mieć format tekstu a i jesteśmy odpowiedzialni za ich właściwe przygotowanie. Wymaga to od nas podstawowej wiedzy o mechanizmach wykorzystywanych przez protoków HTTP ale dzięki możliwościom JavaScrpt napisanie kodu nie jest trudne.

### GET

Najczęściej wykorzystywaną funkcją protokołu HTTP jest GET. Używamy jej do pobierania danych z serwera. Podstawowy przykład pokazujący wysłanie zapytania GET omówiliśmy w poprzednim rozdziale. Teraz pokażemy jak przesyłać w nim dodatkowe parametry. Robimy to dodając po znaku `?` pary `klucz=wartość` oddzielone znakiem `&` do parametru url.

```javascript
let url = 'https://jsonplaceholder.typicode.com/posts?userId=1&sort=desc';
let res = http.get(url);
```

Przykład ponieżej pokazuje, jak dołączać dynamiczne parametry korzystając z szablów stringów (template literals) JavaScript. Korzystając ze znaków \`\`\` (backticks) możemy łatwo wstawiać zmiennych do ciągów znaków.

```javascript
let userId = Math.floor(Math.random() * 10) + 1;
let url = `https://jsonplaceholder.typicode.com/posts?userId=${userId}`;
let res = http.get(url);
check(res, { 'status jest 200': (r) => r.status === 200 });
```

### POST

W k6 funkcje http.post, http.put i inne metody HTTP oczekują, że dane przesyłane w ciele żądania będą w formacie tekstowym (string), jeśli używamy Content-Type: application/json. Oznacza to, że musimy jawnie zamienić obiekt JavaScript na JSON za pomocą JSON.stringify(), aby przesłać go jako treść żądania.

Nie ma wbudowanego wsparcia dla przesyłania obiektu JavaScript bezpośrednio jako JSON — dlatego ta konwersja jest konieczna. Jeśli jednak użyjemy innych Content-Type (np. multipart/form-data czy application/x-www-form-urlencoded), wtedy sposób przygotowania danych może być inny, ale dla JSON zawsze wymagana jest konwersja na string.

Źródło: https://k6.io/docs/javascript-api/k6-http/post/


Tutaj wysyłamy dane w formacie JSON z nagłówkiem `Content-Type: application/json` i oczekujemy statusu 201 (utworzenie zasobu).

```javascript
export default function () {
    let payload = JSON.stringify({ title: 'foo', body: 'bar', userId: 1 });
    let params = { headers: { 'Content-Type': 'application/json' } };
    
    let res = http.post('https://jsonplaceholder.typicode.com/posts', payload, params);
    check(res, {
        'status jest 201': (r) => r.status === 201
    });
}
```

Wysyła nowy zasób do serwera. Warto zauważyć, że obiekt `params` służy do przekazania dodatkowych ustawień żądania, takich jak nagłówki (więcej w dokumentacji: [https://k6.io/docs/javascript-api/k6-http/#params](https://k6.io/docs/javascript-api/k6-http/#params)), a ponieważ w HTTP przesyłamy dane jako tekst, obiekt danych musi zostać zamieniony na tekst przy użyciu `JSON.stringify()`.

### PUT

Wysyłamy zaktualizowane dane pod istniejący zasób (id=1) i oczekujemy statusu 200.

```javascript
export default function () {
    let payload = JSON.stringify({ id: 1, title: 'foo updated', body: 'bar', userId: 1 });
    let params = { headers: { 'Content-Type': 'application/json' } };

    let res = http.put('https://jsonplaceholder.typicode.com/posts/1', payload, params);
    check(res, {
        'status jest 200': (r) => r.status === 200
    });
}
```

Aktualizuje istniejący zasób.

### DELETE

Żądanie DELETE usuwa wskazany zasób, a my weryfikujemy, czy odpowiedź miała status 200.

```javascript
export default function () {
    let res = http.del('https://jsonplaceholder.typicode.com/posts/1');
    check(res, {
        'status jest 200': (r) => r.status === 200
    });
}
```

Usuwa zasób.

---

## 2. Obsługa różnych Content-Type (JSON, Form-data, Multipart)

### JSON

Wysyłanie JSON zostało pokazane wcześniej — używamy `JSON.stringify()` i nagłówka `Content-Type: application/json`.

### application/x-www-form-urlencoded

Tutaj ręcznie budujemy zakodowany ciąg parametrów (łączenie par klucz=wartość przy użyciu encode) i ustawiamy odpowiedni nagłówek, aby serwer zinterpretował dane jako formularz przesłany metodą POST.

```javascript
import { encode } from 'k6/encoding';

export default function () {
    let payload = 'username=' + encode('user1') + '&password=' + encode('pass1');
    let params = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

    let res = http.post('https://example.com/api/login', payload, params);
    check(res, {
        'status jest 200': (r) => r.status === 200
    });
}
```

Przykład wysyłania danych w formacie `application/x-www-form-urlencoded`.

### multipart/form-data (upload pliku)

Tutaj używamy `http.file()` do załączenia pliku — nagłówki `Content-Type` i `boundary` zostaną ustawione automatycznie przez k6. Zapytanie multipart/form-data składa się z części (każda z nagłówkiem Content-Disposition, opcjonalnym Content-Type oraz samą zawartością pliku lub danych) oddzielonych unikalnym boundary, co pozwala przesyłać pliki i inne dane w jednym żądaniu; każda część zawiera więc nagłówki opisujące parametry oraz treść przesyłanego elementu.

```javascript
export default function () {
    let payload = { file: http.file(open('./plik.pdf', 'b'), 'plik.pdf') };

    let res = http.post('https://example.com/upload', payload);
    check(res, {
        'status jest 200': (r) => r.status === 200
    });
}
```

Przykład wysyłania pliku w formacie `multipart/form-data`.

---

## 3. Parametryzacja danych (CSV/JSON)

### Parametryzacja z pliku JSON

Tutaj wczytujemy dane z JSON-a i losujemy użytkownika, którego dane przesyłamy w żądaniu POST.

```json
[
    { "username": "user1", "password": "pass1" },
    { "username": "user2", "password": "pass2" }
]
```

**dane.json**

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function() {
    return JSON.parse(open('./dane.json'));
});

export default function () {
    let user = users[Math.floor(Math.random() * users.length)];
    let payload = JSON.stringify(user);
    let params = { headers: { 'Content-Type': 'application/json' } };

    let res = http.post('https://example.com/api/login', payload, params);
    check(res, {
        'status jest 200': (r) => r.status === 200
    });
}
```

Załadujemy dane użytkowników z pliku JSON i wybierzemy losowego użytkownika.

### Parametryzacja z pliku CSV

Tutaj wczytujemy dane z pliku CSV, mapujemy je na obiekty i losujemy jednego użytkownika do wysłania w żądaniu.

```
username,password
user1,pass1
user2,pass2
```

**dane.csv**

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const csvData = new SharedArray('users', function() {
    return open('./dane.csv')
        .split('\n')
        .slice(1)
        .map(line => {
            let parts = line.split(',');
            return { username: parts[0], password: parts[1] };
        });
});

export default function () {
    let user = csvData[Math.floor(Math.random() * csvData.length)];
    let payload = JSON.stringify(user);
    let params = { headers: { 'Content-Type': 'application/json' } };

    let res = http.post('https://example.com/api/login', payload, params);
    check(res, {
        'status jest 200': (r) => r.status === 200
    });
}
```

Załadujemy dane użytkowników z pliku CSV i również wybierzemy losowego użytkownika.

---

## 4. Walidacja odpowiedzi (checks)

Tutaj jeśli odpowiedź nie ma statusu 200, zostanie wypisany komunikat błędu do konsoli.

```javascript
if (!check(res, { 'status jest 200': (r) => r.status === 200 })) {
    console.error(`Błąd: status ${res.status}`);
}
```

Możliwe jest również logowanie nieudanych walidacji.

```javascript
check(res, {
    'status jest 200': (r) => r.status === 200,
    'body zawiera userId': (r) => JSON.parse(r.body).userId !== undefined,
    'czas odpowiedzi < 200ms': (r) => r.timings.duration < 200
});
```

Ten przykład weryfikuje jednocześnie status odpowiedzi, obecność pola `userId` w odpowiedzi oraz czas trwania odpowiedzi.

Funkcja `check` pozwala definiować różne asercje na odpowiedzi.

---

## Podsumowanie

Ten moduł pokazuje jak korzystać z k6 do wysyłania różnych typów żądań HTTP, obsługi różnych typów treści, parametryzacji danych oraz walidacji odpowiedzi. Zachęcam do eksploracji oficjalnej dokumentacji: [https://k6.io/docs](https://k6.io/docs)

Czy chciałbyś, żebym dodał jakieś dodatkowe przykłady lub rozwinął któryś z tematów?
