# Przygotowanie do warsztatu

Przed warsztatem z testowania w k6 zainstaluj poniższe komponenty a także sprawdź połączenia

## Narzędzia
* [Visual Studio Code](https://code.visualstudio.com/)
* [Grafana k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)
* [Google Chrome](https://www.google.com/chrome/)
* [Dodatek Grafana k6 Browser Record](https://chromewebstore.google.com/search/grafana-k6-browser-record) 
* [k6 Studio](https://grafana.com/docs/k6/latest/k6-studio/)

opcjonalnie
* [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

## Weryfikacja połączeń

Sprawdź czy możesz odwiedzić witryny 
* https://{podane-ip} (zignoruj informacje o niebezpiecznym certyfikacie)
* http://{podane-ip}:3000
* https://www.keycloak.org/
* https://httpbin.org/

Do częsci związanej z testami w trybie Distributed będzie nam potrzebny również:
* Klient SSL (wystarczy klient wbudowany w Git Bash lub np. Putty)

Sprawdź czy możesz zalogować się do serwera o adresie <ip> korzystając z poniższych poświadczeń:

user:tester
hasło:ckLkcoywf74jyDj
