# Parametryzacja danych
## Pobieranie danych tablic

Jedną z prostszych metod przechowywania danych testowych jest wykorzystanie list JavaScript. 

```javascript
let usernameArr = ['admin', 'test_user'];
let passwordArr = ['123', '1234'];
```

Mając dane w tablicach możemy wylocować indeks i pobiera element spod tego indeksu.  

```javascript
// Get random username and password from array
let rand = Math.floor(Math.random() * usernameArr.length);
let username = usernameArr[rand];
let password = passwordArr[rand];
console.log('username: ' + username, ' / password: ' + password);
```
Możesz zdobyć więcej informacji na temat korzystania z funkcji Math.random() pod linkiem https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

> Generowanie liczb losowych w JavaScript nie pozwa podać parametru seed. Jeśli chciałbyś korzystać z losowej ale powtarzalnej kolejności wykorzystania danych. Możesz to zrobić  np. 

```javascript
var seed = 1;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
```
## Pobieranie danych z pliku JSON
Tablice są dobrym rozwiązaniem w przypadku projektowania testów lub małej ilości danych z jakich będziemy chcieli korzystać. Jeśli danych jest dużo wygodniej przechowywać je w oddzielnym pliku. Popularnym, szczególnie w ekosystemie JavaScript, formatem przechowywania danych jest JSON. Jest jest to natywny notacja i serializacji obiektów JavaScript, dzięki czemu pozwala na specyfikację złożonych obiektów.  

```json
{
  "users": [
    { "username": "admin", "password": "123" },
    { "username": "test_user", "password": "1234" }
  ]
}
```
Do wczytania danych w tym formacie możemy wykorzystać funkcję parse obiektu JSON, a następnie odwołać się do poszczególnych elementów tablicy jak w poprzednim przykładzie.
```javascript
const jsonData = JSON.parse(open('./users.json')).users;

export default function () {
    let rand = Math.floor(Math.random() * jsonData.length);
    console.log('username: ', jsonData[rand].username, ' / password: ', jsonData[rand].password);
}
```
## Pobieranie danych z plików csv
Kolejnym popularmym formatem przechowywania danych jest CSV (comma separated values). W tym przypadku każdy wiersz pliku zawiera serię danych dotyczących jednego obiektu.  

```csv
username,password
admin,123
test_user,1234
...
``` 
Choć struktura pliku jest prosta to praca z formatem csv nie jest trywialna. Wynika to z możliwości zmiany separatora danych, kodowania i innych detali przechowywanych danych. K6 dostarcza dedykowaną bibliotekę, która zwalnia nas z konieczności własnej implementacji pobierania danych w tym formacie. Poniżej przykład jej wykorzystania. 

```javascript
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const csvData = papaparse.parse(open('users.csv'), { header: true }).data;

export default function () {
    let rand = Math.floor(Math.random() * csvData.length);
    console.log('username: ', csvData[rand].username, ' / password: ', csvData[rand].password);
}
```
> Zwróć uwagę, że plik jest czytany poza funkcją default. Wynika to z faktu, że k6  celowo nie pozwala na umieszczanie kodu czytującego z lokalnego systemu plików wewnątrz funkcji default. Więcej na ten temat przeczytasz w cyklu życia testu.
## SharedArray
Korzystanie ze "standardowych" struktur i bibliotek JavaScript niesie ze sobą nieoptymalne i często wysokie wykorzystanie zasobów. We wcześniejszych przykładach każdy wirtualny użytkownik k6 próbował wczytać własną kopię danych, może to doprowadzić do wyczerpania dostępej pamięci i zatrzymaniem testu. Rozwiązaniem jest wykorzystanie SharedArray, które możemy połączyć z wcześniej omawianymi sposobami pobierania danych.

```javascript
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from "k6/data";

const sharedData = new SharedArray("Shared Logins", function() {
    let data = papaparse.parse(open('users.csv'), { header: true }).data;
    return data;
});

export default function () {
    let rand = Math.floor(Math.random() * sharedData.length);
    console.log('username: ', sharedData[rand].username, ' / password: ', sharedData[rand].password);
}
```

Załadujemy dane użytkowników z pliku JSON i wybierzemy losowego użytkownika.
## Generowanie danych

W materiale [Wprowadzienie do JavaScript](../A-podstawy-JS.md) omówiliśmy typowe sposoby do gerowania danych testowych w JavaScript. Poniżej znajdziesz przykład wykorzystnia zdalnego modułu i jego funkcji do generowania danych, które są podobne do danych rzeczywistych.
```javascript
import faker from 'https://cdnjs.cloudflare.com/ajax/libs/Faker/3.1.0/faker.min.js';

export const generateSubscriber = () => ({
    name: `SUBSCRIPTION_TEST - ${faker.name.firstName()} ${faker.name.lastName()}`,
    title: faker.name.jobTitle(),
    company: faker.company.companyName(),
    email: faker.internet.email(),
    country: faker.address.country()
});
```

https://github.com/farhanlabib/k6-faker-load-testing

> W kolejnych lekcjach omówimy inny sposób na pobranie biblioteki, https://dev.to/k6/performance-testing-with-generated-data-using-k6-and-faker-2e

TODO: pobieranie iteracji z https://grafana.com/docs/k6/latest/javascript-api/k6-execution/

