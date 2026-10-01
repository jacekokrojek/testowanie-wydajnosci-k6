# Zasymulujemy logowanie do systemu z udziałem Keycloak.

## Logowanie do konsoli administracyjnej

Wejdź na stronę https://<ip>/. Otwórz narzędzia developerskie i przejdź do zakładki sieć aby móc obserwować ruch. Odśwież stronę. Zaloguj się do systemu. Przeanalizuj zapytania. Dokończ skrypt poniżej.

```javascript
import http from 'k6/http';
import crypto from 'k6/crypto';
import { check } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

const baseUrl = __ENV.BASE_URL || 'https://52.59.132.57';
const username = __ENV.KEYCLOAK_USERNAME || "admin";
const password = __ENV.KEYCLOAK_PASSWORD || "admin";
const redirectUri = `${baseUrl}/admin/master/console/`;

export const options = {
  insecureSkipTLSVerify: true,
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

export function adminLogin() {
  if (!username || !password) {
    throw new Error('Set KEYCLOAK_USERNAME and KEYCLOAK_PASSWORD environment variables.');
  }

  const homePage = http.get(`${baseUrl}/`);
  check(homePage, {
    'site opens the admin console': (response) =>
      response.status === 200 && response.url.includes('/admin/master/console/'),
  });

  const verifier = crypto.sha256(crypto.randomBytes(32), 'base64rawurl');
  const challenge = crypto.sha256(verifier, 'base64rawurl');
  const state = crypto.sha256(crypto.randomBytes(32), 'hex');
  const nonce = crypto.sha256(crypto.randomBytes(32), 'hex');
  const authUrl = `${baseUrl}/realms/master/protocol/openid-connect/auth` +
    `?client_id=security-admin-console` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}&response_mode=query&response_type=code&scope=openid` +
    `&nonce=${nonce}&code_challenge=${challenge}&code_challenge_method=S256`;

  const loginPage = http.get(authUrl);
  check(loginPage, {
    'login page returns HTTP 200': (response) => response.status === 200,
  });

  const loginResponse = loginPage.submitForm({
    formSelector: 'form',
    fields: { username, password },
  });
}
```



## Przygotowanie

Wejdź na stronę https://www.keycloak.org/app/ i skonfiguruj odpowiednio formluarz testowy

Realm: sample-app
Client: sample-client
Keycloak URL: https://<host-ip>

i zapisz zmiany

## Zadanie 1
Otwórz narzędzia developerskie i przejdź do zakładki sieć aby móc obserwować ruch.
Naciśnij Sign-in, zostaniesz przeniosiony do strony logowania KeyCloak
Zaloguj się korzystając z poniższych danych 
Username: sample-user
Hasło: sample1234

Zaobserwój ruch i stwórz na jego podstawie skrypt w k6. Wykorzystaj funkcję  submitForm() jeśli jest taka możliwość


## Dodaj  odświeżenie tokenów

Zaimplementuj symulacje odświeżania tokenów

**Adres:** ten sam endpoint `/token`.

**Formularz:**

```text
grant_type=refresh_token
refresh_token={aktualny_refresh_token}
client_id={CLIENT_ID}
client_secret={CLIENT_SECRET}
redirect_uri={REDIRECT_URI}
```

`redirect_uri` pozostawiamy dla zgodności z żądaniem oryginalnego benchmarku; nie jest ogólnym wymogiem protokołu dla refresh.

**Opis zadania:**

* Sprawdzaj `200` i obecność czterech pól zapisanych po wymianie kodu. Aktualizuj je po każdej odpowiedzi, zwłaszcza refresh token. Nie współdziel tokenu między VU.
* Po każdym odświeżeniu odczekaj `REFRESH_TOKEN_PERIOD` sekund, również po ostatnim. W oryginale pierwsze odświeżenie następuje od razu po wymianie kodu; nie ma przed nim dodatkowej przerwy ani oczekiwania na `expires_in`.

