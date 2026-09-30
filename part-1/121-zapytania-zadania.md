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

Wykorzystaj poniższy kod do zapisania wyników

export function handleSummary(data) {
  const d = data.metrics.http_req_duration.values;
  const reqs = data.metrics.http_reqs.values;
  const failed = data.metrics.http_req_failed ? data.metrics.http_req_failed.values.rate * 100 : 0;
  const recv = data.metrics.data_received.values.rate / 1024;
  const sent = data.metrics.data_sent.values.rate / 1024;

  const row = [
    options.vus, 'TOTAL', reqs.count,
    d.avg.toFixed(0), d.med.toFixed(0),
    d['p(90)'].toFixed(0), d['p(95)'].toFixed(0), d['p(99)'].toFixed(0),
    d.min.toFixed(0), d.max.toFixed(0),
    failed.toFixed(2), reqs.rate.toFixed(1),
    recv.toFixed(1), sent.toFixed(1),
  ].join(',');

  return { [`vu${options.vus}.csv`]: row + '\n' };
}


  

