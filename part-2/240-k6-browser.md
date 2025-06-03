# Testowanie z wykorzystaniem przeglądarki

Tradycyjnie, k6 działa na **poziomie protokołu** (np. HTTP), symulując wysyłanie żądań i analizując odpowiedzi serwera. Jest to świetne do testowania API i backendów [5]. Jednak wiele nowoczesnych aplikacji internetowych jest mocno zależnych od kodu wykonywanego po stronie klienta (JavaScript, CSS, itp.). Tutaj z pomocą przychodzi **moduł przeglądarkowy k6 (k6 browser)**, pozwalający na przeprowadzanie testów, które **symulują realne interakcje użytkowników w przeglądarce** i zbierają metryki związane z doświadczeniami użytkownika.

Poniżej znajdziesz przykłady, które pomogą Ci zacząć pisać własne testy przeglądarkowe w k6.

## Uruchamianie prostego testu przeglądarkowego

Zaczniemy od najprostszego testu, który uruchomi przeglądarkę, przejdzie do wskazanej strony i zrobi zrzut ekranu.

```javascript
import { browser } from 'k6/browser';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const page = await browser.newPage();

  try {
    await page.goto('https://test.k6.io/');
    await page.screenshot({ path: 'screenshots/screenshot.png' });
  } finally {
    await page.close();
  }
}
```
Dzięki modułowi `k6/browser` i konfiguracji `browser: { type: 'chromium' }` w opcjach, k6 uruchamia w tle prawdziwą instancję przeglądarki Chromium. Zwróć uwagę, że interakcja z przeglądarką jest asynchroniczna przez co konieczne poprzedzenie wywołań funkcji słowem kluczowym `await`. W konsekwencji funkcja ze scenariuszem musi być oznaczona słowem kluczowym `async`. Do obłużenia zamknięcia przeglądarki nawet w przypadku błędów wykorzystano strukturę try/finally.

Test uruchamiamy w standardowy sposób. Domyślnie jednak przeglądarka będzie działać w trybie Headless. Jeśli chcemy zobaczyć jak przebiega nasz test musimy odpowiednio ustawić zmienną `K6_BROWSER_HEADLESS`

```bash
K6_BROWSER_HEADLESS=false k6 run script.js
```

Warto zapoznać się również z innymi opcjami wspieranymi przez moduł [`k6/browser`](https://grafana.com/docs/k6/latest/using-k6-browser/options/) a także opcjami jakie możesz skonfigurować wywołując fukncję [`newPage()`](https://grafana.com/docs/k6/latest/javascript-api/k6-browser/newpage/).

## Interakcja ze elementami strony

API k6/browser udostępnia szereg metod i klas do interakcji z przeglądarką. Dzięki nim m.in. zasymulujesz kliknięcie, wypełnianie formularzy, czy też pobieranie treści strony. Listę wszystkich możliwości znajdziesz w dokumentacji obiektów [Page](https://grafana.com/docs/k6/latest/javascript-api/k6-browser/page/) oraz [Locator](https://grafana.com/docs/k6/latest/javascript-api/k6-browser/locator/)
Twórcom zależało na tym aby zestaw funkcji był kompatybilny z Playwright a elementy wskazuje się poprzez XPath lub CSS.

```javascript
import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

export default async function () {
  const page = await browser.newPage();

  try {
    await page.goto('https://test.k6.io/my_messages.php');

    await page.locator('input[name="login"]').type('admin');
    await page.locator('input[name="password"]').type('123');

    const submitButton = page.locator('input[type="submit"]');

    await Promise.all([page.waitForNavigation(), submitButton.click()]);

    await check(page.locator('h2'), {
      header: async (lo) => (await lo.textContent()) == 'Welcome, admin!',
    });
  } finally {
    await page.close();
  }
}
```
W przykładzie powyżej pokazałem też jak odpowiednio synchronizować się ze zdarzeniami w przeglądarce. Konstrukcja `await Promise.all([page.waitForNavigation(), submitButton.click()])` pozwala nam jednoczesnie zainicjować kliknięcie przycisku i zacząć czekać na zakończenie nawigacji. Jest to kluczowe, aby poczekać na załadowanie strony przed kolejnymi akcjami. Używamy tu też asynchrnicznej wersji funkcji `check` z modułu k6-utils.
