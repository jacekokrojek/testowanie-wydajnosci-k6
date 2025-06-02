# Przygotowanie do warsztatu

Przed warsztatem z testowania w k6 zainstaluj poniższe komponenty a także sprawdź połączenia

## Narzędzia
* [Visual Studio Code](https://code.visualstudio.com/)
* [Grafana k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)
opcjonalnie
* [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
* [Node.js](https://nodejs.org/en/) - najnowszą wersję LTS
* [k6 Studio](https://grafana.com/docs/k6/latest/k6-studio/)

## Połączenia
Będziemy pracować z przeglądarką, najlepiej korzystać z Chrome lub FireFox oraz 
* [Dodatek Grafana k6 Browser Record](https://chromewebstore.google.com/search/grafana-k6-browser-record) 

Sprawdź czy możesz odwiedzić witryny 
* https://3.71.14.30 (zignoruj informacje o niebezpiecznym certyfikacie)
* http://3.71.14.30:3000
* https://www.keycloak.org/
* https://httpbin.org/

Do częsci związanej z testami w trybie Distributed będzie nam potrzebny również:
* Klient SSL (wystarczy klient wbudowany w Git Bash lub np. Putty)

Sprawdź czy możesz zalogować się korzystając z poniższych danych:

ip:3.71.14.30
user:tester
hasło:ckLkcoywf74jyDj
