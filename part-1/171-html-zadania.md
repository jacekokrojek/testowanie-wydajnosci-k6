Zasymulujemy logowanie do systemu z udziałem Keycloak.

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

