
# Autentykacja HTTP w praktyce: teoria i implementacja w k6

## Wprowadzenie

Autentykacja (uwierzytelnianie) to proces weryfikacji tożsamości klienta, który próbuje uzyskać dostęp do zasobów serwera. W codziennym życiu spotykamy się z autoryzacją niemal na każdym kroku. W przypadku API autoryzacja odbywa się poprzez przesyłanie danych uwierzytelniających w odpowiednim elemencie zapytania. W tym artykule omówimy najpopularniejsze metody autentykacji HTTP oraz pokażemy, jak zaimplementować je w k6.

> Większość testów nie odbywa się na środowiskach produkcyjnych i ujawnienie haseł lub innych wrażliwych danych nie narusza zasad bezpieczeństwa. Dobrą praktyką jest jednak nie przechowywwanie takich danych w kodzie skryptu. Zamiast tego wykorzystuj zmienne środowiskowe, np. `__ENV.CLIENT_SECRET`.

## Popularne typy uwierzytelniania

### Basic Authentication

Basic Authentication polega na przesłaniu danych uwierzytelniających w formacie `username:password`, zakodowanych w Base64 i umieszczonych w nagłówku `Authorization`.

**Przykładowy nagłówek**:
```http
Authorization: Basic dXNlcjpwYXNz
```

Jest to prostsza forma autentykacji, która do wdrożenia często wymaga tylko drobnej korekty konfiguracji serwera lub load balancera. Aby była bezpieczna, wymaga połączenia przez HTTPS — w przeciwnym razie dane można łatwo przechwycić. Ten typ autoryzacji spotkamy dziś przede wszystkim na środowiskach testowych. W wdrożeniach produkcyjnych stosuje się bardziej złożone mechanizmy autoryzacji.

W k6 dane potrzebne do autentykacji możemy zakodować jak w przykładzie poniżej.

```javascript
import http from 'k6/http';
import encoding from 'k6/encoding';
import { check } from 'k6';

export default function () {
  const username = 'testuser';
  const password = __ENV.TEST_PASSWORD || 'testpass';
  const credentials = `${username}:${password}`;
  const encodedCredentials = encoding.b64encode(credentials);

  const options = {
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  const res = http.get(`https://httpbin.org/basic-auth/${username}/${password}`, options);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

Warto pamiętać, że protokół HTTP umożliwia uwierzytelnienie się metodą Basic poprzez przesłanie danych, jak pokazuje to poniższy przykład.

```javascript
const credentials = `${username}:${password}`;
const url = `https://${credentials}@httpbin.org/basic-auth/${username}/${password}`;
const res = http.get(url);
```

### Bearer Token

Bearer Token to sposób autoryzacji, w którym klient zamiast hasła i nazwy użytkownika przesyła token.

**Przykładowy nagłówek**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
```

Token może być dowolnym ciągiem znaków, jednak często wykorzystywanym formatem jest JWT.

### JWT

Token JWT (JSON Web Token) oprócz unikalności jest nośnikiem informacji. Jego ważność jest ograniczona czasowo i przestrzennie (np. tylko do konkretnego API). JWT zwykle jest generowany po poprawnym uwierzytelnieniu użytkownika. Przechowywany jest po stronie klienta i dołączany do każdego żądania HTTP jako Bearer Token.

JWT składa się z **trzech części**, oddzielonych kropkami (`xxxxx.yyyyy.zzzzz`):

* Nagłówka
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

* Danych (tzw. *claims*), np.:
```json
{
  "sub": "1234567890",
  "name": "Jan Kowalski",
  "iat": 1716900000,
  "exp": 1716903600
}
```

* Podpisu wygenerowanego przy pomocy algorytmu wskazanego w nagłówku, np.:
```text
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

W k6 możesz rozkodować dane przesłane w tokenie. Pokazuje to przykład poniżej.

```javascript
import encoding from 'k6/encoding';

const parts = token.split('.');
const payload = JSON.parse(
  encoding.b64decode(parts[1].toString(), 'rawstd', 's')
);
```

## Wprowadzenie do OAuth 2.0

OAuth 2.0 to protokół autoryzacji, który pozwala aplikacjom uzyskać dostęp do zasobów użytkownika bez konieczności udostępniania hasła. Protokół definiuje cztery główne role:

- **Resource Owner** – użytkownik końcowy
- **Client** – aplikacja próbująca uzyskać dostęp
- **Authorization Server** – serwer logowania
- **Resource Server** – system przechowujący dane

Właściciel zasobów to zazwyczaj użytkownik końcowy, który decyduje, czy dana aplikacja może uzyskać dostęp do jego danych. Klient to aplikacja, która chce uzyskać ten dostęp – może to być np. aplikacja mobilna Facebooka próbująca uzyskać dostęp do zdjęć użytkownika w serwisie Google Photos. Serwer autoryzacyjny jest odpowiedzialny za uwierzytelnienie użytkownika i wydanie odpowiednich tokenów, natomiast serwer zasobów przechowuje chronione dane i honoruje ważne tokeny dostępu.

Autoryzacja może przybierać kilka wariantów, które w OAuth 2.0 nazywamy grant types (lub flows).

### Client Credentials flow

To najszybszy i najprostszy sposób autoryzacji w OAuth 2.0. Przeznaczony jest dla komunikacji serwer-serwer, bez udziału użytkownika końcowego. Aplikacja chcąca uzyskać dostęp do danych przesyła do serwera logowania swoje poświadczenia, podobnie jak w przypadku formularza. W odpowiedzi otrzymuje token, który zawiera informacje o zakresie dostępu. Mając token, może wysłać zapytanie o potrzebne dane do właściwego serwera, korzystając z uwierzytelniania Bearer Token.

```javascript
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const hostname = __ENV.HOSTNAME || 'localhost';
  const url = `https://${hostname}/realms/sample-app/protocol/openid-connect/token`;

  const payload = {
    grant_type: 'client_credentials',
    client_id: __ENV.CLIENT_ID || 'client-pat',
    client_secret: __ENV.CLIENT_SECRET || '...',
  };

  const res = http.post(url, payload);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  const json = JSON.parse(res.body || '{}');
  console.log(json.access_token);
}
```

- [Keycloak Docs – Token Endpoint](https://www.keycloak.org/docs/latest/securing_apps/#token-endpoint)

### Authorization Code Flow

Mechanizm autoryzacji typu Authorization Code Flow to jeden z filarów protokołu OAuth 2.0. Składa się z większej liczby kroków niż `Client Credentials`, ponieważ występuje w nim użytkownik końcowy. W procesie tym klient (np. aplikacja web) otrzymuje kod autoryzacyjny od serwera autoryzacyjnego. Korzystając z niego, będzie mógł pobierać dane z serwera zasobów w imieniu użytkownika.



### Diagram sekwencji — klasyczny Authorization Code Flow bez PKCE (przykład Google)

Poniższy diagram odpowiada opisowi poniżej — klient to tu **aplikacja server-side** (ma własny backend, może bezpiecznie przechowywać `client_secret`), nie SPA jak w przykładzie Keycloaka. Dzięki temu widać różnicę, o której mówiliśmy wcześniej: pierwsze przekierowanie (krok 2) jest tu prawdziwym żądaniem HTTP do backendu klienta, zakończonym odpowiedzią `302 Redirect` — a nie czymś, co dzieje się wyłącznie w JS w przeglądarce.

```mermaid
sequenceDiagram
    actor User as Użytkownik (przeglądarka)
    participant Client as Klient (backend aplikacji)
    participant Auth as Serwer autoryzacyjny (Google)
    participant Res as Serwer zasobów (Google APIs)

    User->>Client: GET /login
    Client-->>User: 302 Redirect do /o/oauth2/v2/auth<br/>(client_id, redirect_uri, scope, state)
    User->>Auth: GET /o/oauth2/v2/auth?...
    Auth->>User: formularz logowania + ekran zgody
    User->>Auth: login, zgoda na dostęp
    Auth-->>User: redirect na redirect_uri<br/>?code=AUTH_CODE&state=xyz123
    User->>Client: GET /callback?code=AUTH_CODE&state=xyz123
    Client->>Client: sprawdź, czy state<br/>zgadza się z wysłanym (CSRF)
    Client->>Auth: POST /token<br/>(client_id, client_secret, code,<br/>grant_type=authorization_code, redirect_uri)
    Auth-->>Client: access_token (+ refresh_token)
    Client->>Res: GET /v1/userinfo<br/>Authorization: Bearer access_token
    Res-->>Client: dane użytkownika
```

Różnice względem pierwszego diagramu: zamiast `code_challenge`/`code_verifier` klient uwierzytelnia się w kroku wymiany kodu na token wprost przez `client_secret` (bo — w przeciwieństwie do SPA — może go bezpiecznie trzymać po stronie serwera), a krok 2 (przekierowanie) faktycznie pojawia się w ruchu sieciowym jako osobna para żądanie/odpowiedź, a nie znika w kodzie JS przeglądarki.

Pierwszym krokiem jest przekierowanie użytkownika do endpointu autoryzacyjnego. Przykładowy URL wygląda następująco:

```http
GET https://accounts.google.com/o/oauth2/v2/auth?
  ?response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=https%3A%2F%2Fclient-app.com%2Fcallback
  &scope=read%20profile
  &state=xyz123
```

**Parametry zapytania:**

- `response_type=code` – określa, że aplikacja oczekuje otrzymania kodu autoryzacyjnego.
- `client_id` – unikalny identyfikator klienta nadany przez serwer autoryzacyjny.
- `redirect_uri` – adres URI, na który serwer autoryzacyjny przekieruje użytkownika po udzieleniu (lub odmowie) zgody.
- `scope` – zakresy uprawnień, o jakie prosi aplikacja.
- `state` – losowy ciąg znaków używany do ochrony przed atakami CSRF.

Po autoryzacji użytkownika i wyrażeniu przez niego zgody, serwer autoryzacyjny przekierowuje przeglądarkę użytkownika z powrotem na `redirect_uri`, dodając do adresu **kod autoryzacyjny**:

```http
GET https://client-app.com/callback?code=AUTH_CODE&state=xyz123
```

Klient (np. backend aplikacji) wysyła teraz **żądanie POST** do endpointu tokenowego w celu wymiany kodu na access token:

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id=CLIENT_ID
&client_secret=CLIENT_SECRET
&code=AUTH_CODE
&grant_type=authorization_code
&redirect_uri=https%3A%2F%2Fclient-app.com%2Fcallback
```

**Parametry:**

- `client_id` i `client_secret` – dane uwierzytelniające klienta.
- `code` – kod autoryzacyjny otrzymany wcześniej.
- `grant_type=authorization_code` – wskazuje typ żądania.
- `redirect_uri` – musi się zgadzać z tym podanym w żądaniu autoryzacji.

Serwer autoryzacyjny weryfikuje dane, a następnie zwraca odpowiedź w formacie JSON zawierającą m.in. **access token** i często **refresh token**:

```json
{
  "access_token": "ACCESS_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "REFRESH_TOKEN"
}
```

Access token jest używany do autoryzowanego dostępu do zasobów użytkownika na serwerze zasobów:

```http
GET https://openidconnect.googleapis.com/v1/userinfo
Authorization: Bearer ACCESS_TOKEN
```

Pokazany wyżej flow jest mniej bezpieczną wersją autoryzacji. W nowszych rozwiązaniach można spotkać wersję z tzw. Proof Key for Code Exchange (PKCE). Wymaga ona, aby podczas inicjalizacji flow wygenerowany był `code_verifier` – losowy ciąg znaków. Z niego wylicza się `code_challenge`, który przesyłany jest w pierwszym zapytaniu wraz z informacją o metodzie kodowania.

Poniższy diagram pokazuje wszystkie kroki opisane powyżej w jednym miejscu — od wygenerowania `code_verifier` po stronie klienta, aż po użycie access tokenu do pobrania zasobu.

```mermaid
sequenceDiagram
    actor User as Użytkownik (przeglądarka)
    participant Client as Klient (aplikacja, np. SPA)
    participant Auth as Serwer autoryzacyjny
    participant Res as Serwer zasobów

    User->>Client: GET / (otwarcie aplikacji)
    Client-->>User: strona aplikacji (kod JS klienta)
    Client->>Client: JS w przeglądarce generuje code_verifier<br/>oraz code_challenge = SHA256(code_verifier)
    Client->>User: nawigacja do /authorize<br/>(code_challenge, state, redirect_uri)
    Note over User,Client: Gdy Klient to SPA (jak nasz skrypt),<br/>te dwa kroki dzieją się w JS w przeglądarce<br/>— nie generują osobnych żądań HTTP
    User->>Auth: GET /authorize
    Auth->>User: formularz logowania
    User->>Auth: login + hasło, zgoda
    Auth-->>User: redirect na redirect_uri<br/>?code=...&state=...
    User->>Client: przekazanie code i state<br/>(poprzez redirect_uri)
    Client->>Client: sprawdź, czy state<br/>zgadza się z wysłanym (CSRF)
    Client->>Auth: POST /token<br/>(code, code_verifier, redirect_uri)
    Auth->>Auth: SHA256(code_verifier) == code_challenge?
    Auth-->>Client: access_token (+ refresh_token)
    Client->>Res: GET /resource<br/>Authorization: Bearer access_token
    Res-->>Client: dane zasobu
```

Kluczowy moment bezpieczeństwa to dwie linie w środku diagramu: `code_challenge` widać jawnie w pierwszym, publicznym żądaniu (krok 2), natomiast `code_verifier`, z którego ten `code_challenge` policzono, nigdy nie opuszcza klienta aż do momentu wymiany kodu na token (krok 9) — i to bezpośrednim, nieprzechwytywalnym przez przeglądarkę kanałem POST, a nie przez URL przekierowania.

```http
GET https://auth.server.com/authorize?
  response_type=code&
  client_id=client123&
  redirect_uri=https://client.app/callback&
  scope=read_profile&
  state=abc123&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

W momencie wymiany kodu autoryzacyjnego na token klient musi przesłać oryginalny `code_verifier`. Serwer porównuje go z wyliczonym wcześniej `code_challenge`, co zabezpiecza przed użyciem kodu przez nieautoryzowane aplikacje.

```http
POST https://auth.server.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTH_CODE_FROM_STEP1&
redirect_uri=https://client.app/callback&
client_id=client123&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### Generowanie code_verifier, code_challenge, state i nonce w k6

Do wygenerowania tych wartości w k6 służy moduł `k6/crypto`:

```javascript
import crypto from 'k6/crypto';

const verifier = crypto.sha256(crypto.randomBytes(32), 'base64rawurl');
const challenge = crypto.sha256(verifier, 'base64rawurl');
const state = crypto.sha256(crypto.randomBytes(32), 'hex');
const nonce = crypto.sha256(crypto.randomBytes(32), 'hex');
```

**`code_verifier`** — RFC 7636 wymaga losowego ciągu o długości 43–128 znaków, złożonego wyłącznie ze znaków `A-Z a-z 0-9 - . _ ~`. `crypto.randomBytes(32)` generuje 32 losowe bajty (256 bit) z bezpiecznego generatora liczb losowych, a `crypto.sha256(...)` je hashuje i koduje wynik jako `base64rawurl` (Base64 URL-safe, **bez** paddingu `=`). Wyjście SHA-256 to zawsze 32 bajty, co po takim kodowaniu daje dokładnie 43 znaki — czyli trafia w sam dolny limit długości z RFC. Sam krok haszowania nie jest wymagany przez specyfikację (wystarczyłoby zakodować losowe bajty bezpośrednio jako `base64rawurl`, bez SHA-256) — ale nie szkodzi: nadal losowy, nadal w dozwolonym alfabecie, nadal odpowiedniej długości.

**`code_challenge`** — to już dosłowna implementacja wzoru z RFC 7636 dla `code_challenge_method=S256`:
```
code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
```
Stąd `crypto.sha256(verifier, 'base64rawurl')` — liczymy SHA-256 z samego `code_verifier` (jako tekst, nie jako surowe bajty) i kodujemy wynik tym samym sposobem co wcześniej.

**`state` i `nonce`** — w przeciwieństwie do `code_verifier`, żaden standard (ani RFC 6749 dla `state`, ani OpenID Connect Core dla `nonce`) nie narzuca konkretnego formatu. Wymóg jest jeden: wartość ma być unikalna i trudna do odgadnięcia. Kodowanie `'hex'` (zamiast `'base64rawurl'`) jest tu wyborem czysto praktycznym — nie ma znaczenia bezpieczeństwa, po prostu nie wymaga żadnego dodatkowego escapowania przy wklejaniu do URL-a. Równie dobrze zamiast `sha256(randomBytes(32), 'hex')` można by użyć gotowego UUID (np. `uuidv4()` z biblioteki `k6-utils`) — k6 nie ma wbudowanego `crypto.randomUUID()`, więc wymagałoby to dodatkowego importu z `jslib.k6.io`, podczas gdy wersja z `k6/crypto` działa bez żadnych zależności.
