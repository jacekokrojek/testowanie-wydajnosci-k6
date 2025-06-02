## Autoryzacja Basic 

**Opis zadania:**

* Przygotuj zapytanie zgodnie z opisem https://httpbin.org/#/Auth/get_basic_auth__user___passwd_ 
* Prześlij nazwę użytkownika oraz hasło w adresie URL tak aby je poprawnie uwiarzytelnić

## Autoryzacja klienta z Client credentials – pobranie tokenu dostępu

**Opis zadania:**

* Przygotuj zapytanie POST do endpointa protokołu OpenID Connect w Keycloak, aby uzyskać token umożliwiający dostęp do API.
* W treści żądania prześlij dane zgodnie z wymaganiami
    * Należy wysłać zapytanie POST na adres `https://{hostname}/realms/sample-app/protocol/openid-connect/token`
    * Dane należy przesłać w formacie `application/x-www-form-urlencoded`, 
    * Ustaw "client_id" : "client-pat", "grant_type": "client_credentials" oraz odpowiedni "client_secret" 
    * Aby pobrać secret zaloguj się jako admin/admin, wybieramy realm: sample-app, wybieramy Clients > client-pat > Creadentials, skopiuj Client Secret 

**Kontekst:**
To zapytanie pozwala na uzyskanie tokenu dostępu, który jest niezbędny do autoryzacji wszystkich pozostałych żądań API Keycloak. Token zwracany jest w odpowiedzi jako JSON i powinien zostać umieszczony w nagłówku `Authorization: Bearer {token}` przy kolejnych żądaniach.


## Wysłanie zapytania GET – pobranie listy użytkowników

**Opis zadania:**

* Wykonaj zapytanie GET do endpointa API Keycloak, które pobiera listę wszystkich użytkowników w wybranym realmie.
* Upewnij się, że w żądaniu przesyłasz nagłówek `Authorization` z prawidłowym tokenem dostępu.
* **Adres URL:** `https://{hostname}/admin/realms/{realm}/users`

**Kontekst:**
Ta operacja służy do pobrania pełnej listy użytkowników z systemu. Może być używana np. do sprawdzenia, ilu użytkowników istnieje w danym momencie lub do pobrania ich danych do dalszej analizy. API Keycloak w odpowiedzi zwróci listę obiektów użytkowników w formacie JSON.
