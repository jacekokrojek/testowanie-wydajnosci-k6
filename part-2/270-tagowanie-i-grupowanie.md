# Tagowanie i grupowanie zapytań w k6 – kompleksowe podejście do analizy testów wydajnościowych

Tagowanie w k6 to sposób na dodawanie metadanych (tzw. *tags*) do zapytań HTTP lub innych działań wykonywanych przez wirtualne użytkowniki (VUs – *virtual users*). Tag może być traktowany jako etykieta opisująca kontekst danego zapytania. Umożliwia to późniejsze filtrowanie wyników w raportach, grupowanie metryk lub identyfikację konkretnych fragmentów scenariusza testowego.

Standardowe tagi są dodawane automatycznie do metryk – niezależnie od tego, czy użytkownik jawnie je zdefiniuje. Te domyślne tagi pozwalają lepiej analizować i filtrować wyniki testów, szczególnie w dużych zbiorach danych, np. w InfluxDB, Grafanie czy k6 Cloud.

| Tagi domyślne | Opis                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| `method`      | Metoda HTTP użyta w żądaniu (`GET`, `POST`, `PUT`, itd.)                  |
| `url`         | Pełny URL żądania                                                         |
| `name`        | Nazwa żądania – domyślnie jest równa URL-owi, chyba że zostanie nadpisana |
| `status`      | Kod odpowiedzi HTTP (np. `200`, `404`, `500`)                             |
| `proto`       | Protokół (np. `HTTP/1.1`, `HTTP/2.0`)                                     |
| `tls_version` | Wersja TLS, jeśli połączenie używa HTTPS                                  |
| `ip`          | Adres IP hosta docelowego                                                 |
| `group`       | Nazwa grupy, jeśli zapytanie zostało wykonane w kontekście `group()`      |

Możesz nadpisać je nadpisać jeśli jest taka potrzeba.

```
http.get(`https://example.com/api/users/${id}`, {
  tags: { name: 'get_users' }
});
```

Możesz również dodać własne tagi

```javascript
import http from 'k6/http';

export default function () {
  http.get('https://example.com/api/users', {
    tags: { endpoint: 'users', type: 'api' }
  });
}
```

## Tagowanie globalne vs. lokalne

W k6 możemy wyróżnić dwa poziomy tagowania:

- **Globalne tagi** – ustawiane za pomocą `options.tags`, mają zastosowanie do wszystkich zapytań w skrypcie, chyba że zostaną nadpisane lokalnie.
- **Lokalne tagi** – przypisane do konkretnego zapytania lub akcji, mają wyższy priorytet niż tagi globalne.

```javascript
export const options = {
  tags: {
    environment: 'staging',
    team: 'qa'
  }
};

export default function () {
  http.get('https://example.com');
}
```

## Grupowanie zapytań – `group()`

Drugim potężnym narzędziem organizacyjnym w k6 jest funkcja `group()`, służąca do logicznego podziału testu na sekcje.

```javascript
import { group, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '30s',
  tags: { environment: 'dev' }
};

export default function () {
  group('Autoryzacja', function () {
    http.post('https://example.com/api/login', { username: 'admin', password: 'admin' }, {
      tags: { endpoint: 'login' }
    });
  });

  group('Interakcja z systemem', function () {
    http.get('https://example.com/api/dashboard', {
      tags: { endpoint: 'dashboard' }
    });
    http.get('https://example.com/api/users', {
      tags: { endpoint: 'get_users' }
    });
  });

  group('Wylogowanie', function () {
    http.post('https://example.com/api/logout', null, {
      tags: { endpoint: 'logout' }
    });
  });

  sleep(1);
}
```

## Najlepsze praktyki

- **Stosuj spójne nazewnictwo tagów** – np. `endpoint`, `method`, `module`, `team`.
- **Unikaj nadmiernego tagowania** – zbyt wiele tagów może utrudnić analizę.
- **Używaj `group()` dla czytelności i porządkowania logiki** – ułatwia debugowanie i raportowanie ale też nie dodawaj grupy do każdego zapytania.
