# Zadania praktyczne – logi Nginx w Loki i budowa dashboardu

Poniżej znajdują się zadania, w których wykorzystasz Grafana Loki do analizy logów Nginx zebranych podczas testów k6 uderzających w Keycloak przez rate limit. Środowisko (Loki, Promtail, Grafana z zaprowizjonowanymi źródłami danych) powinno już działać – jeśli nie, uruchom `docker compose up -d`.

## 1. Przeszukiwanie logów w Explore

**Opis zadania:**

* Otwórz Grafanę (`http://localhost:3000`, `admin`/`admin`) i przejdź do zakładki **Explore**.
* Wybierz źródło danych **Loki** i uruchom zapytanie `{container="nginx"}`.
* Wygeneruj trochę ruchu (uruchom dowolny skrypt k6 uderzający w endpoint tokenów Keycloak, najlepiej taki, który przekroczy limit i wygeneruje kilka odpowiedzi `429`).
* Odśwież zapytanie i odnajdź w logach linie ze statusem `429`.

**Kontekst:**
To ćwiczenie ma oswoić Cię z podstawowym selektorem strumienia w LogQL oraz pokazać, że logi z kontenera trafiają do Loki bez żadnej dodatkowej konfiguracji po Twojej stronie – zajął się tym Promtail.

---

## 2. Filtrowanie po polu z JSON-a

**Opis zadania:**

* W tym samym oknie Explore zmodyfikuj zapytanie tak, aby pokazywało tylko żądania zakończone kodem `429`.
* Następnie zmień je tak, aby pokazywało wszystkie błędy (status `>= 400`).
* Sprawdź, ile linii logów nie udaje się sparsować jako JSON (`__error__ != ""`) i spróbuj ustalić, skąd się biorą (podpowiedź: to nie tylko access log).

**Kontekst:**
Ćwiczysz tu etap pipeline'u `| json` oraz filtrowanie po wyciągniętym polu — podstawowa umiejętność potrzebna do budowy własnych paneli.

---

## 3. Liczba żądań per ścieżka

**Opis zadania:**

* W rozdziale teoretycznym budowaliśmy zapytanie `sum by (status) (count_over_time(...))`, które zlicza żądania per kod odpowiedzi. Napisz analogiczne zapytanie, które zamiast tego zliczy żądania **per ścieżka** (`request_path`).
* Pamiętaj, że `request_uri` zawiera też query string (np. `?username=test&max=5`) – zanim pogrupujesz po tym polu, musisz je oczyścić. Podpowiedź: `| line_format` \`{{.request_uri}}\` nadpisze treść linii samym `request_uri`, a `| regexp` \`(?P<request_path>[^?]*)\` wytnie z niej wszystko od znaku `?`.
* Uruchom zapytanie w Explore i sprawdź, czy widzisz osobną serię dla każdej ścieżki (a nie osobną dla każdego zapytania z inną wartością parametru).
* Gdy zapytanie działa, dodaj je jako nowy panel *Time series* do dashboardu **„Nginx - Keycloak requests”** (i tak jak w zadaniu 5 – zapisz zmianę w pliku `nginx-overview.json`, żeby przetrwała restart).

**Kontekst:**
To samo zadanie, które rozwiązywaliśmy dla `status`, tylko na polu o dużo większej liczbie możliwych wartości – dlatego zanim pogrupujemy, musimy najpierw ograniczyć kardynalność, odcinając query string.

---

## 4. Średni czas odpowiedzi per ścieżka

**Opis zadania:**

* Analogicznie do przykładu `avg by (status) (avg_over_time(... | unwrap request_time ...))` z rozdziału teoretycznego, napisz zapytanie liczące **średni `request_time` per ścieżka** (wykorzystaj to samo czyszczenie `request_uri` co w poprzednim zadaniu).
* Dodaj to zapytanie jako kolejny panel do dashboardu, obok panelu *„Średni czas odpowiedzi wg kodu odpowiedzi”* (który grupuje po `status`, nie po ścieżce).
* Który endpoint ma najwyższy średni czas odpowiedzi? Czy to zgodne z Twoimi oczekiwaniami?

**Kontekst:**
To zadanie łączy wynik testu k6 (widoczny w podsumowaniu terminala) z tym, co faktycznie zaobserwował serwer — kluczowa umiejętność przy diagnozowaniu, czy rate limit i wydajność poszczególnych endpointów działają zgodnie z oczekiwaniami.

---

## 5. Dodaj własny panel: percentyl czasu odpowiedzi

**Opis zadania:**

* Dodaj do dashboardu nowy panel typu *Time series*.
* Zbuduj zapytanie LogQL liczące **95. percentyl** (`quantile_over_time`) pola `request_time` dla endpointa tokenów (podpowiedź: analogicznie do panelu ze średnim czasem odpowiedzi, tylko inna funkcja i dodatkowy parametr kwantyla).
* Ustaw jednostkę panelu na sekundy.
* Wyeksportuj model dashboardu (Dashboard settings → JSON Model) i dopisz nowy panel do pliku `grafana-provisioning/dashboards/nginx-overview.json`, żeby został zapamiętany na stałe.

**Kontekst:**
Średnia bywa myląca przy long-tail latency — percentyle lepiej pokazują, jak wygląda doświadczenie najwolniejszych żądań, co jest standardem przy raportowaniu wyników testów wydajnościowych.

## Uwagi dodatkowe:

* Jeśli panel w Explore albo na dashboardzie nie pokazuje danych, sprawdź czy filtr czasu w prawym górnym rogu obejmuje moment, w którym uruchamiałeś test k6.
* Etykiety (`container`, `compose_service`) są ustalone przez konfigurację Promtail – pełną listę zobaczysz klikając ikonę informacji przy selektorze zapytania w Explore.
* Zmiany w panelach wprowadzone tylko przez UI (bez edycji pliku JSON) znikną po restarcie kontenera Grafany – provisioning zawsze nadpisze dashboard wersją z repozytorium.
