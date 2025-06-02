
# Autentykacja HTTP w praktyce: Teoria i implementacja w k6

## Wprowadzenie

Autentykacja (uwierzytelnianie) to proces weryfikacji tożsamości klienta, który próbuje uzyskać dostęp do zasobów serwera. W codziennym życiu spotykamy się z autoryzacją niemal na każdym kroku. W przypadku API opartych autoryzacja odbywa się poprzez przesyłanie danych uwierzytelniających w odpowiednim elemcie zapytania. W tym artykule omówimy najpopularniejsze metody autentykacji HTTP oraz pokażemy, jak zaimplementować je w k6.

## Popularne typy uwierzytelniania 
### Basic Authentication

Basic Authentication polega na przesłaniu danych uwierzytelniających w formacie `username:password`, zakodowanych w Base64 i umieszczonych w nagłówku `Authorization`.   

**Przykładowy nagłówek**:
```
Authorization: Basic dXNlcjpwYXNz
```

Jest to prostsza forma autentykacji, która do wdrożenia potrzebuje często tylko drobnej korekty konfiguracji serwera lub load balancera. Aby były bezpieczna wymaga połączenia przez HTTPS — w przeciwnym razie dane można łatwo przechwycić. Ten typ autoryzacji spotkamy dziś przede wszystkim na środowiskach testowych. We wdrożeniach produkcujnych stosuje się bardziej złożone mechanizmy autoryzacji.

W k6 dane potrzebne do autentykacji możemy zakodować jak w przykładzie poniżej. 

```javascript
import http from 'k6/http';
import encoding from 'k6/encoding';
import { check } from 'k6';

export default function () {
    const username = 'testuser';
    const password = 'testpass';
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

Warto pamiętać, że protokuł HTTP umożliwia uwierzytelnienie się metodą Basic poprzez przesłanie danych jak pokazuje to przykład poniżej.

```javascript
  const credentials = `${username}:${password}`;
  const url = `https://${credentials}@httpbin.org/basic-auth/${username}/${password}`;
  let res = http.get(url);
``` 

### Bearer Token

Bearer Token to sposób autoryzacji, w którym klient zamiast hasła i nazwy użytkownik a przesyła token.

**Przykładowy nagłówek**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
```

Token może być dowolnym ciągiem znaków jednak często wykorzystywanym formatem jest JWT.

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

* Danych (tzw. *claims*) np.:
```json
{
  "sub": "1234567890",
  "name": "Jan Kowalski",
  "iat": 1716900000,
  "exp": 1716903600
}
```

* Podpisu wygenerowanego przy pomocy algorytmu wskazanego w nagłówku, np.
```
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

W k6 możesz rozkodować dane przesłane w tokenie. Pokazuje to przykład poniżej.

```javascript
import encoding from 'k6/encoding';

const parts = token.split('.');
const content  = JSON.parse(encoding.b64decode(parts[1].toString(), "rawstd", 's'))
```

## Wprowadzenie do OAuth 2.0

OAuth 2.0 to protokół autoryzacji, który pozwala aplikacjom uzyskać dostęp do zasobów użytkownika bez konieczności udostępniania hasła. Protokół definiuje cztery główne role:

- **Resource Owner** – użytkownik końcowy
- **Client** – aplikacja próbująca uzyskać dostęp
- **Authorization Server** – serwer logowania
- **Resource Server** – system przechowujący dane

Właściciel zasobów to zazwyczaj użytkownik końcowy, który decyduje, czy dana aplikacja może uzyskać dostęp do jego danych. Klient to aplikacja, która chce uzyskać ten dostęp – może to być np. aplikacja mobilna Facebooka próbująca uzyskać dostęp do zdjęć użytkownika w serwisie Google Photos. Serwer autoryzacyjny jest odpowiedzialny za uwierzytelnienie użytkownika i wydanie odpowiednich tokenów, natomiast serwer zasobów przechowuje chronione dane i honoruje ważne tokeny dostępu.

Autoryzacja może przybiegać w kilku wariantach, które w OAuth 2.0 nazywamy Grant Types (lub Flows). 

### Client Credentials flow

To najszybszy i najprostszy sposób autoryzacji w OAuth 2.0. Przeznaczony jest dla komunikacji serwer-serwer, bez udziału użytkownika końcowego. Aplikacja chcąca uzyskać dostęp do danych przesyła do serwera logowania swoje poświadczenia, podobnie jak w przypadku formularza. W odpowiedzi otrzymuje token, który zawiera informacje o zakresie dostępu. Mając token może wysłać zapytanie o potrzebne dane do właściwego serwera, korzystając z uwierzytalniania Bearer Token.

```javascript
import http from 'k6/http';
import { check } from 'k6';

export default function () {
    
    const url = `https://${hostname}/realms/sample-app/protocol/openid-connect/token`;
    const payload = {
        grant_type: 'client_credentials',
        client_id: 'client-pat',
        client_secret: '...',
    };

    const res = http.post(url, payload);
    const json = JSON.parse(res.body);
    console.log(json.access_token);
}
```

- [Keycloak Docs – Token Endpoint](https://www.keycloak.org/docs/latest/securing_apps/#token-endpoint)

### Authorization Code Flow

Mechanizm autoryzacji typu Authorization Code Flow to jeden z filarów protokołu OAuth 2.0. Składa się z większej liczby kroków niż Client Credentials ponieważ występuje w nim użytkownik końcowy. W procesie tym klient (np. aplikacja web), otrzyma kod autoryzacujny od serwerem autoryzacyjnego. Korzystając z niego będzie mógł pobierać dane serwerem zasobów w imieniu użytkownika.

Pierwszym krokiem jest przekierowanie użytkownika do endpointa autoryzacyjnego. Przykładowy URL wygląda następująco:

```
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

```
GET https://client-app.com/callback?code=AUTH_CODE&state=xyz123
```

Klient (np. backend aplikacji) wysyła teraz **żądanie POST** do endpointa tokenowego w celu wymiany kodu na access token:

```
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

```
GET https://openidconnect.googleapis.com/v1/userinfo
Authorization: Bearer ACCESS_TOKEN
```

Pokazany wyżej flow jest mniej bezpieczną wersją autoryzacji. W nowszych rozwiązaniach można spotkać wersję z tzw. Proof Key for Code Exchange (PKCE).
Wymaga ona aby podczas inicjalizacji flow wygenerowany był code_verifier – losowy ciąg znaków. Z niego wylicza się code_challenge, który przesyłany jest w pierwszym zapytaniu wraz z informacją o metodzie kodowania. 

```
GET https://auth.server.com/authorize?
  response_type=code&
  client_id=client123&
  redirect_uri=https://client.app/callback&
  scope=read_profile&
  state=abc123&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```
W momencie wymiany kodu autoryzacyjnego na token klient musi przesłać oryginalny code_verifier. Serwer porównuje go z wyliczonym wcześniej code_challenge, co zabezpiecza przed użyciem kodu przez nieautoryzowane aplikacje.

```
POST https://auth.server.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTH_CODE_FROM_STEP1&
redirect_uri=https://client.app/callback&
client_id=client123&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```