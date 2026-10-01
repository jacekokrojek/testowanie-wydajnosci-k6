# Ćwiczenie: analiza skryptu logowania przez Authorization Code Flow + PKCE

## Cel

W [130-autoryzacja.md](130-autoryzacja.md) poznałeś/aś teorię Authorization Code Flow oraz PKCE. W tym ćwicznieu napiszesz realny skrypt, który loguje się do konsoli administracyjnej Keycloaka **dokładnie tak, jak zrobiłaby to przeglądarka**: wchodzi na stronę logowania, wypełnia formularz username/password, odbiera kod autoryzacyjny i wymienia go na token.

## Krok 1 — budowa żądania autoryzacyjnego z PKCE (linie 37–45)

Przejdź do przeglądarki, otwórz narzędzia developerskie i wejdź na stronę logowanie. Po serii przekierowań trafisz na złożonu URL. Wejście na ten adres możesz zasymulować poniższym kodem.

```javascript
import http from 'k6/http';
import crypto from 'k6/crypto';
import { check } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

const verifier = crypto.sha256(crypto.randomBytes(32), 'base64rawurl');
const challenge = crypto.sha256(verifier, 'base64rawurl');
const state = crypto.sha256(crypto.randomBytes(32), 'hex');
const nonce = crypto.sha256(crypto.randomBytes(32), 'hex');

const authUrl = `${baseUrl}/realms/master/protocol/openid-connect/auth` +
  `?client_id=security-admin-console` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&state=${state}`+
  `&response_mode=query&response_type=code` +
  `&scope=openid` +
  `&nonce=${nonce}` + 
  `&code_challenge=${challenge}` + 
  `&code_challenge_method=S256`;
```

**Elementy standardu (OIDC):**
- `code_verifier` — sekret, który zna tylko ten, kto zainicjował logowanie (nasz skrypt/przeglądarka). Nigdy nie jest wysyłany w tym kroku, tylko trzymany lokalnie do momentu wymiany kodu na token. Po co: gdyby ktoś przechwycił sam kod autoryzacyjny (np. inna aplikacja na tym samym urządzeniu podsłuchująca redirect), nie mógłby go wymienić na token bez znajomości tego sekretu.
- `code_challenge` — jawna "pieczęć" policzona z `code_verifier` (SHA-256), wysyłana już na starcie logowania. Po co: pozwala serwerowi zapamiętać, czego dowodem będzie później `code_verifier`, bez ujawniania samego sekretu w publicznym URL-u.
- `state` — losowa wartość generowana przez klienta przed rozpoczęciem logowania. Po co: ochrona przed CSRF — klient sprawdza, czy wartość odbita w przekierowaniu zgadza się z wysłaną, czyli czy ten konkretny powrót z logowania faktycznie odpowiada sesji, którą sam zainicjował, a nie np. linkowi podrzuconemu przez atakującego.
- `nonce` — losowa wartość, którą serwer wpisuje do wydanego ID Tokena. Po co: pozwala klientowi wykryć próbę ponownego użycia (replay) wcześniej przechwyconego, ważnego tokena — jeśli `nonce` w tokenie nie zgadza się z tym wysłanym na starcie, token nie pochodzi z tego logowania.
- `scope=openid` — to properly czyni ten flow **OpenID Connect**, a nie "goły" OAuth2. Sam OAuth2 nie zna pojęcia tożsamości użytkownika (tylko autoryzację dostępu do zasobu) — dodanie scope `openid` mówi serwerowi: "wydaj też ID Token i honoruj parametr `nonce`".
- `response_mode=query` — mówi serwerowi, **gdzie** w adresie przekierowania ma umieścić `code` i `state`: w query stringu (`?code=...&state=...`). Alternatywą jest `response_mode=fragment` (`#code=...`) — fragment URL nigdy nie trafia na serwer (tylko do przeglądarki, dostępny wyłącznie przez JS po stronie klienta), więc skrypt k6 wysyłający zwykłe żądania HTTP **nie miałby jak go odczytać**. Dlatego ten skrypt świadomie wymusza `query`.
- `encodeURIComponent(redirectUri)` — `redirect_uri` musi być zakodowane jako bezpieczna wartość parametru URL (np. `:` i `/` zamienione na `%3A`/`%2F`), inaczej serwer źle sparsowałby granice parametrów w query stringu.

---

## Krok 2 — pobranie strony logowania 

```javascript
const loginPage = http.get(authUrl);
check(loginPage, {
  'login page returns HTTP 200': (response) => response.status === 200,
});
```

Standardowe żądanie GET — serwer autoryzacyjny (Keycloak) zwraca HTML z formularzem logowania.

---

## Krok 3 — automatyczne wypełnienie formularza 

```javascript
const loginResponse = loginPage.submitForm({
  formSelector: 'form',
  fields: { username, password },
});
```

**k6:** `submitForm()` to gotowa metoda obiektu `Response` w k6, która:
1. Parsuje HTML z `loginPage.body` (k6 ma wbudowany, ograniczony parser HTML z API podobnym do jQuery — `response.html()`).
2. Znajduje formularz pasujący do `formSelector` (tu: pierwszy element `<form>` na stronie — domyślny formularz logowania Keycloaka).
3. Wypełnia pola formularza wartościami z `fields` (k6 dopasowuje je po atrybucie `name` pól `<input>` — Keycloak nazywa je `username` i `password`, stąd zgodność z nazwami zmiennych w skrypcie).
4. Wysyła formularz metodą i na adres zdefiniowane w atrybutach `method`/`action` formularza (tu: POST), **podążając za kolejnym przekierowaniem** tak samo jak zwykłe `http.get()`/`http.post()`.

To jeden request zastępujący to, co w przeglądarce byłoby: wpisaniem loginu/hasła i kliknięciem "Zaloguj się".

---

## Krok 4 — odebranie kodu autoryzacyjnego 

Odczytaj z url na jaki zostałeś przekierowany parameter code oraz state.

```javascript
const callbackUrl = new URL(loginResponse.url);
const code = callbackUrl.searchParams.get('code') || '';
const returnedState = callbackUrl.searchParams.get('state') || '';
```

**k6:** użyj `URL` z jslib. `new URL(...)` parsuje ten string na obiekt z wygodnym `searchParams.get(...)`, zamiast ręcznego dzielenia stringa po `&` i `=`.

---

## Krok 5 — wymiana kodu na token

W  zapytaniu `/realms/master/protocol/openid-connect/token` prześli `code` odczytany w poprzenim kroku

`redirect_uri` musi być identyczne jak w żądaniu autoryzacyjnym (krok 1)

---

## Krok 6 — bezpieczne parsowanie odpowiedzi

Odczytaj access token i sprawdź czy pozwala na dostęp do `/admin/realms/master`

