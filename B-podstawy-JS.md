
# Podstawy JavaScript, które pomogą Ci zacząć pracę z k6

**JavaScript** to język programowania, który działa w przeglądarkach, ale także w środowiskach takich jak **Node.js** czy **k6**. Jeśli chcesz pisać skrypty testowe w k6, warto znać podstawowe konstrukcje języka, które są **uniwersalne** i przydadzą Ci się również poza k6.

Poniżej znajdziesz kluczowe elementy JavaScript, pokazane na ogólnych przykładach, a potem ich zastosowanie w k6.

## 🎯 1. Zmienne i typy danych

JavaScript to język dynamicznie typowany, co oznacza, że zmienne nie są przypisane do konkretnego typu danych i mogą zmieniać swój typ w trakcie działania programu. Poniżej krótkie podsumowanie prostych typów danych tego języka.

* Typ numeryczny reprezentuje liczby całkowite i zmiennoprzecinkowe.

```js
let liczba = 42;
let pi = 3.14;
```

* Teksotwy, który reprezentuje ciąg znaków otoczony pojedynczymi, podwójnymi lub backtickami (template literals).

```js
let imie = "Jan";
let powitanie = `Cześć, ${imie}!`;
```

* Wartości logiczne: true lub false.

```js
let czyPrawda = true;
```

* Undefined, dla zmiennej, która została zadeklarowana, ale nie została przypisana żadna wartość.

```js
let x;
```
* Null, który oznacza "brak wartości".

```js
let y = null;
```

Użycie słowa kluczowego `const` zamiast `let` sprawia, że zamiast zmiennej definiujemy stałą. Dzięki temu interpreter nie pozwoli na późniejszą zmianę zadeklarowanej wartości.

```js
wiek = 31; // Błąd!
```

## 🎯 2. Funkcje

Funkcje pozwalają grupować kod w logiczne bloki. Mogę też przyjmować parametry. W JavaScript możemy zdefiniować funkcję na kilka sposobów. Klasycznie robimy to z wykrozystaniem słowa kluczowego `function`, po którym podajemy nazwę funkcji a w nawiasie listę parametrów. Poniżej funckja wyświetlająca imię, przekazane jako parametr.

Najprostrzą funkcją z jaka przyjdzie Ci pracować to funkcja wyświetlająca dane w konsoli.

```Javascript
console.log(`Cześć, ${imie}!`)
```

Kolejne funkcje jakie powinieneś znać to funkcje pozwalające na formatowanie tekstu. Poniżej znajdziesz kola przykładów.

```javascript
const num = 7;
const formattedNum = num.toString().padStart(3, '0');
console.log(formattedNum); // "007"

const price = 3.14159;
const formatterPrice = price.toFixed(2)
console.log(formatterPrice); // "3.14"
```

Jeśli chcesz stworzć własną funkcję skorzystaj ze składni jak w przykładzie poniżej.

```js
function przywitaj(imie) {
  console.log('Cześć, ' + imie + '!');
}

przywitaj('Jan'); // wypisze: Cześć, Jan!
```

W JavaScript możesz też użyć **funkcji anonimowej**. Możesz ją przypisać do zmiennej jak w przykładzie poniżej. Nie będzie się to różnić od zapisu powyżej.

```js
const przywitaj = function(imie) {
  console.log('Hej, ' + imie + '!');
};
```

Podobnie funkcje zdefiujesz korzystając z tzw. **funkcji strzałkowej**:

```js
const przywitaj = (imie) => {
  console.log('Hej, ' + imie + '!');
};
```

Oba zapisy spotkasz najczęściej, w gdy funkcja wykorzystuje mechanizm callback. Oznacza to, że jako parametr funkcja przyjmuje inną funkcję, którą wykonuje w czasie swojego działania.

```js
// Funkcja, która przyjmuje dwie liczby i callback (funkcję do wykonania na tych liczbach)
function wykonajOperacje(a, b, callback) {
  return callback(a, b);
}

// Przykład wywołania z anonimową funkcją jako callbackiem — dodawanie
const wynikDodawania = wykonajOperacje(5, 3, function(x, y) {
  return x + y;
});
console.log(wynikDodawania); // 8

// Przykład wywołania z anonimową funkcją jako callbackiem — mnożenie
const wynikMnozenia = wykonajOperacje(5, 3, function(x, y) {
  return x * y;
});
console.log(wynikMnozenia); // 15
```

## 🎯 3. Instrukcje warunkowe

Instrukcje warunkowe pozwalają na wykonanie określonego fragmentu kodu tylko wtedy, gdy spełniony jest określony warunek. Dzięki nim program może podejmować decyzje i różnicować zachowanie.

Przykład podstawowej instrukcji if:

```js
let liczba = 10;

if (liczba > 5) {
  console.log('Większa niż 5');
} else {
  console.log('Mniejsza lub równa 5');
}
```

Instrukcje warunkowe korzystają z operatorów porównania, które zwracają wartość logiczną true lub false:
Operatory porównania:

- `===` — porównuje wartość i typ zmiennych. Nazywany jest "ściśle równy" (strict equality).
- `!==` — porównuje nierówność wartości i typu (strict inequality).
- `==` — porównuje wartości ale bez typu
- `>` `<` `>=` `<=` — większe/mniejsze

Wartości w warunkach są automatycznie konwertowane na typ logiczny (boolean) zgodnie z zasadą tzw. "truthy" i "falsy".
Przykłady wartości falsy: 0, '' (pusty string), null, undefined, NaN, false.
Wszystkie inne wartości są truthy, czyli traktowane jako true w warunkach.

> Zwróć uwagę, że przy porównywaniu obiektów operator `==` nie będzie porównywał wartości obiektów a ich referencje. W większości przypadków jego użycie będzie nieodpowiednie.

## 🎯 4. Obiekty i ich właściwości

Obiekty to kolekcje klucz-wartość. W JavaScrpit wtorzymy obiekty korzystając z poniższej składni. Pokazałem Ci również jak odczytać wartość poszczególnych pól korzystając z 2 zapisów:

```js
const osoba = {
  imie: 'Jan',
  wiek: 30
};

console.log(osoba.imie); // Jan
console.log(osoba['wiek']); // 30
```

Warto w tym miejscu wspomnieć jak poprawnie wyświetlić przekonwertować obiekt na tekst i odwrotnie. Wykorzystujemy do tego obiekt JSON.

```javascript
console.log (JSON.stringify(osoba)); // bez formatowania
console.log (JSON.stringify(osoba, null, 2)); // z wcięciami 2 znakowymi

const options = JSON.parse("{value: 1}");
```

## 🎯 5. Tablice i iteracja

Tablice w JavaScript to struktury danych, które pozwalają przechowywać wiele wartości w jednej zmiennej. Każdy element w tablicy ma swój indeks (numer porządkowy), zaczynający się od 0. W JavaScript tablice mogą przechowywać elementy różnych typów.

```js
const tablica = [42, 'tekst', true, null];
```

Tablice są obiektami, które mają wiele wbudowanych metod, np.:
* push() — dodaje element na koniec tablicy,
* pop() — usuwa ostatni element i go zwraca,
* indexOf() — zwraca indeks pierwszego wystąpienia elementu,
* filter(), map(), reduce() — do bardziej zaawansowanych operacji.

Poniżej przykład pokazujący jak dodać i odfiltrować dane w tablicach.

```js
const liczby = [1, 2, 3];
liczby.push(4); // teraz tablica to [1, 2, 3, 4]

const parzyste = liczby.filter(function(n) {
  return n % 2 === 0;
});

console.log(parzyste); // [2, 4]
```

Chcą wykonać operacje na kolejnych elementach z tablicy możesz wykrorzystać pętle. Najprościej będzie stworzyć pętlę, która będzie w każdym kroku zwiększać wartość zmiennej wykorzystywanej do indeksowania tablicy.

```js
console.log(tablica[0]); // 42

for (let i = 0; i < tablica.length; i++) {
  console.log(tabica[i]);
}
```

Alternatywnie, możesz skorzystać z **pętli `for...of`:**

```js
for (const owoc of owoce) {
  console.log(owoc);
}
```

Aby znaleźć konkretny element w tablicy, możesz użyć metody `find()`. Zwraca ona pierwszy element spełniający podany warunek lub `undefined`, jeśli taki element nie istnieje.

Przykład: wyszukiwanie użytkownika o imieniu "Jan":

```js
const users = [
  { imie: 'Anna', wiek: 28 },
  { imie: 'Jan', wiek: 35 },
  { imie: 'Maria', wiek: 22 }
];

const jan = users.find(user => user.imie === 'Jan');
console.log(jan); // { imie: 'Jan', wiek: 35 }
```

Możesz też użyć `findIndex()`, aby znaleźć indeks elementu, lub `includes()` dla prostych tablic:

```js
const liczby = [1, 2, 3, 4];
console.log(liczby.includes(3)); // true
```
## 🎯 6. Moduły i import

Od standardu ES6 (ECMAScript 2015) JavaScript wprowadził natywne wsparcie dla modułów. Moduły pozwalają na organizowanie kodu w osobne pliki, dzięki czemu można łatwo zarządzać dużymi projektami, importować i eksportować funkcje, zmienne czy klasy między plikami.

Jeśli chciałbym z danej funkcji skorzystać w innym pliku możesz to zrobić na dwa sposoby
* Eksportowanie funkcji z nazwami 

```js
// plik: modul.js
export function przywitaj(imie) {
  return `Cześć, ${imie}!`;
}

export const wersja = '1.0'; 
```
* Eksport domyślny

```js
// plik: modul.js

export default function (a, b) {
  return a + b;
}
```

W zależności od rodzaju eksportu nieco inacze wygląda importowanie funckji
```js
// plik: main.js
import { przywitaj, wersja } from './modul.js';
import dodaj from './modul.js';

console.log(przywitaj('Jan')); // Cześć, Jan!
console.log(`Wersja: ${wersja}`);
console.log(dodaj(5, 7)); // 12
```

## Zapisywanie danych do pliku
```javascript
const fs = require('fs');

const path = require('path');
const outputFile = path.join(__dirname, 'users.csv');

let csvContent = 'username,password\njacek,pas1234\ntosia,pas1234\n';

fs.writeFile(outputFile, csvContent, (err) => {
    if (err) {
        console.error('Błąd zapisu pliku:', err);
    } else {
        console.log(`Plik został zapisany: ${outputFile}`);
    }
});
```
