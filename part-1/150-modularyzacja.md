# Modularyzacja

Pisząc testy, bardzo łatwo wpaść w pułapkę kopiowania tych samych wywołań HTTP w wielu plikach — zwłaszcza gdy endpointy są powtarzalne i różnią się tylko parametrami. Nie jest to zgodne z jedną z podstawowych zasad pisania oprogramowania, czyli DRY (Don’t Repeat Yourself), i szybko przekonujemy się, że nie jest to dobre rozwiązanie.

## Funkcje w lokalnym module

Pierwszym rozwiązaniem poprawiającym tzw. reużywalność kodu jest przeniesienie wspólnych fragmentów kodu do funkcji i odpowiednie ich sparametryzowanie. Funkcje możemy zapisać w tym samym skrypcie lub w oddzielnym pliku, tworząc z niego lokalny moduł.

```javascript
// user-api.js
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'https://api.example.com';

export function getUsers() {
  return http.get(`${BASE_URL}/users`, {
    headers: {
      Authorization: `Bearer ${__ENV.TOKEN}`,
    },
  });
}

export function createUser(payload) {
  return http.post(`${BASE_URL}/users`, JSON.stringify(payload), {
    headers: {
      Authorization: `Bearer ${__ENV.TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}
```

```javascript
import { getUsers } from './user-api.js';

export default function () {
  getUsers();
}
```

Dzięki temu zabiegowi w przypadku zmiany API nie będziemy musieli zmieniać każdego zapytania, na które zmiana miała wpływ. Przykład pokazuje też możliwość pobrania danych ze zmiennych środowiskowych poprzez obiekt `__ENV`.

## Budowanie klienta API

Rozwiązanie powyżej sprawdza się w wielu przypadkach, jednak widzimy w nim ciągle fragmenty powtarzalnego kodu. Możemy się ich pozbyć, jeśli stworzymy klasę, w której zdefiniujemy wspólne elementy. Jest to często stosowana praktyka, która doprowadzi nas do stworzenia klienta API.

```javascript
import http from 'k6/http';

class UsersApiClient {
  constructor(hostname, token) {
    this.hostname = hostname;
    this.token = token;
    this.baseUrl = `https://${hostname}/admin/realms/sample-app/users`;
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  getUsers(query = '') {
    const url = `${this.baseUrl}${query}`;
    const params = { headers: this.headers };
    const res = http.get(url, params);
    console.log(res.body);
    return res;
  }

  createUser(user) {
    const url = this.baseUrl;
    const payload = JSON.stringify(user);
    const params = { headers: this.headers };
    const res = http.post(url, payload, params);
    console.log(res.body);
    return res;
  }
}
```

## Generowanie kodu klienta API

Popularnym sposobem specyfikacji API jest standard OpenAPI. Jeśli testowana przez Ciebie usługa posiada tego typu specyfikację, możesz wygenerować klienta API automatycznie, korzystając z narzędzia [OpenAPI-to-k6](https://github.com/grafana/openapi-to-k6/). 

Do instalacji wykorzystaj komendę:

```
npm install -g @grafana/openapi-to-k6
```

Generowanie do wygenerowania kodu wykorzystaj polecenie

```
openapi-to-k6 open-api.json ./open-api --include-sample-script
```

Z wygenerowanego kodu możesz skorzystać jak pokazuje to poniższy przykład.

```javascript
import { UsersClient } from './users.ts';

const baseUrl = 'https://<IP>/';

export default function () {
  const token = 'TOKEN';
  const realm = 'sample-app';

  const commonRequestParameters = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const usersClient = new UsersClient({ baseUrl, commonRequestParameters });
  const getAdminRealmsRealmUsersResponseData = usersClient.getAdminRealmsRealmUsers(realm);
}
```
