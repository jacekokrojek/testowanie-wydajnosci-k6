# Wysyłanie zapytań HTTP - zadania

## GET: Pobranie informacji o publicznych endpointach (zadanie wspólne)

Wyślij zapytanie GET na https://<ip>/realms/{realm}/.well-known/openid-configuration

Wyświetl odpowiedź i przeanalizuj szczegóły

## POST pobranie tokenu dostępu (zadanie wspólne)

* Przygotuj zapytanie POST do endpointa protokołu OpenID Connect w Keycloak, aby uzyskać token umożliwiający dostęp do API.
* W treści żądania prześlij dane zgodnie z wymaganiami
    * Należy wysłać zapytanie POST na adres `https://{hostname}/realms/sample-app/protocol/openid-connect/token`
    * Dane należy przesłać w formacie `application/x-www-form-urlencoded`, 
    * Ustaw "client_id" : "client-pat", "grant_type": "client_credentials" oraz odpowiedni "client_secret" 
    * Aby pobrać secret zaloguj się jako admin/admin, wybieramy realm: sample-app, wybieramy Clients > client-pat > Creadentials, skopiuj Client Secret 

**Kontekst:**
To zapytanie pozwala na uzyskanie tokenu dostępu, który jest niezbędny do autoryzacji wszystkich pozostałych żądań API Keycloak. Token zwracany jest w odpowiedzi jako JSON i powinien zostać umieszczony w nagłówku `Authorization: Bearer {token}` przy kolejnych żądaniach.

## Asercje

Dodaj asercje sprawdzające kody odpowiedzi, czas poniżej 100ms oraz wybrany inny element odpowiedzi


  

