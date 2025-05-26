
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

* Undefined, gry wartość zmiennej, która została zadeklarowana, ale nie została przypisana żadna wartość.

```js
let x;
console.log(x); // undefined
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

Funkcje pozwalają grupować kod w logiczne bloki. Mogę też przyjmować parametry. W JavaScript możemy zdefiniować funkcję na kilka sposobów. Klasycznie robimy to z wykrozystaniem słowa kluczowego `function` po którym podajemy nazwę funkcji a w nawiasie listę parametrów.

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
Przykład:
- `!==` — porównuje nierówność wartości i typu (strict inequality).
- `==` — porównuje wartości ale bez typu
- `>` `<` `>=` `<=` — większe/mniejsze

Wartości w warunkach są automatycznie konwertowane na typ logiczny (boolean) zgodnie z zasadą tzw. "truthy" i "falsy".
Przykłady wartości falsy: 0, '' (pusty string), null, undefined, NaN, false.
Wszystkie inne wartości są truthy, czyli traktowane jako true w warunkach.

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

## 🎯 7. Generowanie danych testowych

Podczas testowania wydajności w k6 często potrzebujemy generować dane testowe, takie jak losowe liczby, ciągi znaków czy obiekty. Oto kilka przykładów:

### 🔢 Losowe liczby

Generowanie losowej liczby w zakresie od 1 do 100:

```js
function losowaLiczba(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

console.log(losowaLiczba(1, 100)); // np. 42
```

### 🔤 Losowe ciągi znaków

Generowanie losowego ciągu znaków o określonej długości:

```js
function losowyCiag(dlugosc) {
  const znaki = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let wynik = '';
  for (let i = 0; i < dlugosc; i++) {
    wynik += znaki.charAt(Math.floor(Math.random() * znaki.length));
  }
  return wynik;
}

console.log(losowyCiag(10)); // np. 'aB3dE5FgH1'
```

### 🧑‍💻 Losowe dane użytkownika

Tworzenie obiektu z losowymi danymi użytkownika:

```js
function losowyUzytkownik() {
  return {
    imie: losowyCiag(5),
    wiek: losowaLiczba(18, 60),
    email: `${losowyCiag(5)}@example.com`
  };
}

console.log(losowyUzytkownik());
// np. { imie: 'Xyz12', wiek: 34, email: 'Abc34@example.com' }
```

### 📋 Tablica losowych obiektów

Generowanie tablicy z losowymi obiektami:

```js
function generujDaneTestowe(ilosc) {
  const dane = [];
  for (let i = 0; i < ilosc; i++) {
    dane.push(losowyUzytkownik());
  }
  return dane;
}

console.log(generujDaneTestowe(3));
// np. [
//   { imie: 'Abc12', wiek: 25, email: 'Xyz34@example.com' },
//   { imie: 'Def45', wiek: 40, email: 'Pqr56@example.com' },
//   { imie: 'Ghi78', wiek: 30, email: 'Stu90@example.com' }
// ]
```

Biblioteka [`faker`](https://github.com/faker-js/faker) pozwala łatwo generować realistyczne dane testowe, takie jak imiona, adresy e-mail czy numery telefonów. W k6 możesz użyć jej w następujący sposób:

### 📦 Instalacja

Aby użyć `faker` w k6, musisz najpierw zainstalować bibliotekę w swoim projekcie (np. za pomocą `npm`):

```bash
npm install @faker-js/faker
```

### 🛠️ Przykład użycia

Poniżej przykład generowania losowych danych użytkownika:

```js
import { faker } from '@faker-js/faker';

function losowyUzytkownik() {
  return {
    imie: faker.name.firstName(),
    nazwisko: faker.name.lastName(),
    email: faker.internet.email(),
    adres: faker.address.streetAddress(),
    telefon: faker.phone.number()
  };
}

console.log(losowyUzytkownik());
// np. {
//   imie: 'Anna',
//   nazwisko: 'Kowalska',
//   email: 'anna.kowalska@example.com',
//   adres: '123 Main Street',
//   telefon: '123-456-7890'
// }
```

### 📋 Generowanie wielu danych

Możesz również wygenerować tablicę z wieloma losowymi użytkownikami:

```js
function generujUzytkownikow(ilosc) {
  const uzytkownicy = [];
  for (let i = 0; i < ilosc; i++) {
    uzytkownicy.push(losowyUzytkownik());
  }
  return uzytkownicy;
}

console.log(generujUzytkownikow(5));
// np. [
//   { imie: 'Anna', nazwisko: 'Kowalska', email: 'anna.kowalska@example.com', ... },
//   { imie: 'Jan', nazwisko: 'Nowak', email: 'jan.nowak@example.com', ... },
//   ...
// ]
```

👉 Biblioteka `faker` jest bardzo przydatna do generowania realistycznych danych testowych w skryptach k6.

## Zapisywanie danych do pliku
```javascript
// Importujemy moduł 'fs' (file system) do obsługi plików
const fs = require('fs');

// Importujemy moduł 'path' do obsługi ścieżek plików
const path = require('path');

// Ustalamy ile użytkowników chcemy wygenerować
const numUsers = 100;

// Ustalamy nazwę i lokalizację pliku wynikowego
const outputFile = path.join(__dirname, 'users.csv');

// Tworzymy zmienną z nagłówkiem pliku CSV (pierwszy wiersz z nazwami kolumn)
let csvContent = 'username,password\n';

// Używamy pętli, aby dodać dane 100 użytkowników
for (let i = 1; i <= numUsers; i++) {
    // Generujemy nazwę użytkownika w formacie user1, user2, user3, itd.
    const username = `user${i}`;

    // Ustalamy hasło (tu dla uproszczenia każde hasło to 'pass123')
    const password = 'pass123';

    // Dodajemy wiersz do zawartości CSV (oddzielamy dane przecinkiem)
    csvContent += `${username},${password}\n`;
}

// Funkcja zapisująca dane do pliku
fs.writeFile(outputFile, csvContent, (err) => {
    if (err) {
        // Jeśli wystąpi błąd, wyświetlamy go w konsoli
        console.error('Błąd zapisu pliku:', err);
    } else {
        // Jeśli zapis się uda, informujemy o lokalizacji pliku
        console.log(`Plik został zapisany: ${outputFile}`);
    }
});
```

## 📝 Dodatkowe materiały

[Eloquent Javascript](https://eloquentjavascript.net/)
