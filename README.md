# Testowania wydajnosci z Grafana k6

W repozytorium znajdziesz materiały, które pomogą Ci rozpocząć pracę z narzędziem Grafana k6. W kolejnych częściach poznasz krok po kroku jak wykorzystać k6 do testowania aplikacji webowych. Dowiesz się między innymi, jak efektywnie modularizować skrypty, zarządzać autoryzacją, oraz jak symulować różnorodne profile użytkowników. W drugiej części instrukcji rozwiniemy umiejętności o bardziej zaawansowane techniki, takie jak obsługa formatów XML, nagrywanie sesji użytkowników oraz integracja k6 z popularnymi narzędziami deweloperskimi, a także uruchamianie testów w środowisku Docker i rozproszenie ich na wiele instancji.

## Przygotowanie

Przed warsztatem zapoznaj się z [instrukcją](./000-installation-and-verification.md) zawierającą informacje o wymaganym oprogramowaniu oraz połączeniach. Zachęcam też do zapoznania się z [podstawami języka JavaScript](./A-podstawy-JS.md), które pomogą w zrozumieniu materiału oraz pisaniu własnych testów. Jeśli planujesz budowanie rozproszonego środowiska do testów zapoznaj się też z podstawami pracy w [środowisku k8s](./B-podstawy-k8s.md).

## Agenda

### Część 1
* [Wprowadzenie do k6](part-1/110-wprowadzenie.md)
* [Zapytania i odpowiedzi HTTP](part-1/120-zapytania.md)
* [Autoryzacja](part-1/130-autoryzacja.md)
* [Praca z treścią html](part-1/170-html.md)
* [Dane testowe](part-1/140-dane-testowe.md)
* [Modularyzacja skryptów](part-1/150-modularyzacja.md)
* [Modelowanie obciążenia](part-1/160-modelowanie-obciazenia.md)

### Część 2
* [Prezentacja wyników testów](part-2/280-result-output.md)
* [Praca z XML](part-2/210-xml.md)
* [Nagrywanie zapytań i konwersja HAR do skryptu k6](part-2/220-nagrywanie-zapytan.md)
* [Praca z k6 Studio](part-2/230-k6-studio.md)
* [Testy z wykorzystaniem przeglądarki](part-2/240-k6-browser.md)
* [Docker i k6](part-2/250-running-in-docker.md)
* [Budowanie rozproszonego środowiska do testów](part-2/260-distributed-testing.md)
* [Grupowanie i tagowanie](part-2/270-tagowanie-i-grupowanie.md)
* [Thresholds](part-2/290-tresholds.md)
* [Biblioteki i inne możliwości k6]()

Jeśli czujesz niedosyt zachęcam Cię do odwiedzenia repozytorium [Awsome k6](https://github.com/grafana/awesome-k6)

