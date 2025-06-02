
# Testowanie stron WWW i formularzy w k6 – pełny przewodnik

Choć k6 najczęściej używa się do testowania API, doskonale radzi sobie ono także z testowaniem aplikacji webowych. Jest tak dzięki łatwemu parsowaniu  treści html czy obsłudze formularzy www. Poniżej przedstawiam przegląd tych możliwości.

## Pobieranie i parsowanie HTML
Aby móc wskazywać elementy html (formularze, linki, tokeny) wykorzystujemy funkcję [`html()`](https://grafana.com/docs/k6/latest/javascript-api/k6-http/response/response-html/) obiektu Response. Zwraca ona obiekt typu [Selection](https://grafana.com/docs/k6/latest/javascript-api/k6-html/selection/), który udostępnia metody podobne do metod jQuery. Możesz zatem w łatwy sposób znaleźć interesujący Cię elemement i pobrać jego wartość (tests) lub atrybut. Alternatywnie możesz wykorzystać funkcję `parseHTML`, która jako parametr przyjmuje treść html i zwraca dokładnie taki sam obiekt.

```javascript
const res = http.get('https://test.k6.io/my_form.html');
const doc = res.html();
const csrfToken = doc.find('input[name="csrf_token"]').attr('value');
```

Jeśli wynikiem wyszukiwania jest więcej niż jeden element, możemy wskazać interesujący na element jedną z metod `first`, `last`, `eq` lub wykorzystać funcję `each` do iteracji po zwróconych elementach.

Zwróć uwagę, że jeśli skorzystasz z  funkcji `get`, to zwróci on obiekty typu [Element](https://grafana.com/docs/k6/latest/javascript-api/k6-html/element/), który mimo podobnych możliwości udostępnia nieco inny zestaw funkcji.

## Wysyłanie formularzy
k6 udostępnia metodę [`submitForm()`](https://grafana.com/docs/k6/latest/javascript-api/k6-http/response/response-submitform/), która upraszcza proces wysyłania formularzy. Pozwala ona na automatyczne zebranie danych z formularza i przesłanie ich jako żądanie POST.

```
import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  let res = http.get('https://quickpizza.grafana.com/admin');

  res = res.submitForm({
    formSelector: 'form',
    fields: { username: 'admin', password: 'admin' },
  });

}
```

## Kliknięcie linku
Chcąc zasymulować kliknięcie linku na stornie możemy sparsować odpowiedź html, znaleźć wybrany link oraz jego atrybut href a następnie wysłać na ten adres zapytanie GET. k6 daje ułatwia to nam symulowanie kliknięcia linku funkcją [`clickLink()`](https://grafana.com/docs/k6/latest/javascript-api/k6-http/response/response-clicklink/). 

```javascript
const res = http.get('https://test.k6.io/links.php');
const nextPage = res.clickLink({ text: 'About' });

check(nextPage, {
  'nawigacja działa': (r) => r.status === 200,
});
```
