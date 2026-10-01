# k6 Agent — przygotowanie testów z pomocą AI

Stan dokumentacji: 30 września 2026, k6 2.3.x.

## Czym jest k6 Agent

`k6 x agent` przygotowuje projekt do pracy z asystentem AI: dodaje instrukcje dotyczące testowania i konfigurację połączenia z narzędziami k6. Kod piszesz następnie w rozmowie z asystentem w swoim edytorze.

W tej integracji występują trzy elementy:

| Element | Rola |
| --- | --- |
| Asystent AI w edytorze | Interpretuje wymagania i proponuje kod. |
| Skills | Instrukcje pomagające planować i przygotowywać testy. |
| Serwer MCP uruchamiany przez `k6 x mcp` | Udostępnia asystentowi dokumentację i narzędzia wykonujące operacje związane z k6. |

MCP oznacza **Model Context Protocol** — protokół komunikacji asystenta z narzędziami. Samo skonfigurowanie integracji nie tworzy jeszcze scenariusza ani nie generuje obciążenia. Wygenerowany skrypt pozostaje plikiem projektu, który możesz przeglądać i uruchamiać za pomocą k6.

Serwer k6 MCP jest obecnie oznaczony jako **preview**, dlatego przed warsztatem warto sprawdzić działanie używanej wersji. [Dokumentacja integracji AI](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/).

## Przygotowanie projektu

Poniższy przykład dotyczy VS Code z GitHub Copilot. Polecenia wykonaj w katalogu własnego projektu z ćwiczeniami:

```powershell
k6 version
k6 x agent list
k6 x agent init --dry-run vscode-copilot
k6 x agent init vscode-copilot
k6 x agent status
```

`--dry-run` pokazuje plan zmian. `init` zapisuje konfigurację MCP i instrukcje dla asystenta, a `status` sprawdza stan konfiguracji. Dla Copilota używane są m.in. `.vscode/mcp.json` i `.github/copilot/skills/`.

> Aktualnia wersja posiada błąd i tworzy pliki w nieodpowiednim katalogu. Katalog `skills` należy przenieść bezpośrednio do katalogu `.github`

Inne obsługiwane identyfikatory to `claude-code`, `cursor`, `codex-cli`, `opencode` i `cline`. Dla Cline fragment konfiguracji MCP trzeba wkleić ręcznie zgodnie z komunikatem narzędzia. Wybierz identyfikator odpowiadający swojemu klientowi.

Szczegóły konfiguracji i obsługiwanych klientów: [Bootstrap your editor with k6 x agent](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/bootstrap-with-k6-x-agent/).

## Co asystent może zrobić przez MCP

| Narzędzie | Zastosowanie |
| --- | --- |
| `info` | Sprawdzenie wersji serwera MCP i wykrytego k6. |
| `list_sections`, `get_documentation` | Wyszukanie i odczyt dokumentacji k6. |
| `validate_script` | Próbne wykonanie skryptu: 1 VU, 1 iteracja, limit 30 sekund. |
| `run_script` | Lokalne uruchomienie testu i odczyt wyniku. |

**`validate_script` wykonuje kod**, więc może wysłać żądania i utworzyć dane w aplikacji. Nie traktuj tej operacji jako samego sprawdzenia składni.

Według bieżącej dokumentacji `run_script` domyślnie używa 1 VU i 30 sekund, a limity parametrów tego narzędzia wynoszą 50 VU i 5 minut. Nie są to limity samego k6 CLI. Integracja udostępnia również gotowe prompty do tworzenia skryptów i konwersji Playwright do `k6/browser`.

Nazwy w tabeli są nazwami narzędzi MCP, a nie poleceniami do wpisania w PowerShell. [Narzędzia, prompty i zasoby k6 MCP](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/tools-prompts-resources/).

## Przykład pracy 

Poniższy prompt możesz przekazać asystentowi:

> Przygotuj prosty skrypt k6 w pliku oidc-smoke.js. Adres serwera pobierz
> z BASE_URL, a nazwę realmu z REALM. Wykonaj GET na
> /realms/{REALM}/.well-known/openid-configuration.
> Użyj jednego VU i jednej iteracji. Dodaj check statusu 200 i obecności
> token_endpoint w JSON. Nie dodawaj klas ani dodatkowych bibliotek.
> Sprawdź używane API w dokumentacji przez k6 MCP. Na tym etapie zapisz
> skrypt i wyjaśnij jego działanie, bez uruchamiania validate_script lub testu.

Przeczytaj wynik i porównaj go z wymaganiami. Następnie ustaw dane własnego środowiska w terminalu, z którego będziesz uruchamiać test:

```powershell
$env:BASE_URL = 'http://localhost:8080'
$env:REALM = 'sample-app'
k6 run oidc-smoke.js
```

Podany adres jest przykładem — zastąp go adresem szkoleniowego Keycloak. Jeżeli uruchomienie zlecasz asystentowi przez MCP, sprawdź, skąd proces MCP otrzymuje zmienne. Zmienne ustawione w osobnym terminalu nie zmieniają środowiska już działającego procesu edytora.

Po uruchomieniu poproś o analizę konkretnych wyników:

> Wyjaśnij wynik testu: liczbę żądań, status odpowiedzi oraz wyniki checks.
> Oddziel problemy konfiguracji od problemów skryptu. Nie zwiększaj obciążenia.
> Jeśli proponujesz poprawkę, wskaż, który wynik ją uzasadnia.

## Jak formułować wymagania

Samo polecenie „przetestuj Keycloak” pozostawia wiele decyzji asystentowi. W opisie uwzględnij:

- **Operację:** konkretne żądania i ich kolejność, np. pobranie tokenu, następnie odczyt użytkowników.
- **Dane:** realm, identyfikator klienta, źródło sekretu i sposób tworzenia unikalnych nazw.
- **Obciążenie:** liczbę VU, czas, pauzy albo tempo rozpoczęcia iteracji.
- **Wynik:** statusy, wymagane pola odpowiedzi i uzgodnione progi wydajnościowe.
- **Zakres pracy:** przygotowanie kodu, przegląd istniejącego skryptu czy uruchomienie konkretnego testu.

Przy scenariuszu tworzącym użytkownika określ także, co ma się stać po błędzie. Bez poprawnego `userId` następny krok ustawiania hasła nie ma sensu. Wygenerowany kod oceń według zasad z [rozdziału o asercjach](../part-1/135-asercje.md).

## Ocena wygenerowanego testu

Sprawdź, czy skrypt rzeczywiście odtwarza zamierzone zachowanie. Token pobierany przed każdą operacją tworzy inny ruch niż token pobrany raz i wielokrotnie używany. Stałe 10 VU nie oznacza automatycznie 10 żądań na sekundę. Poprawna składnia nie rozstrzyga żadnej z tych kwestii.

Porównaj wygenerowane żądania z działającym przykładem lub kontraktem API. Przejrzyj metodę HTTP, adres, format treści, obsługę tokenów oraz warunki zakończenia zależnych kroków. Po próbnym wykonaniu sprawdź, czy test osiągnął właściwy rezultat w aplikacji.

Większe obciążenie wprowadzaj dopiero po potwierdzeniu poprawności przepływu. W interpretacji wyników korzystaj z [modelowania obciążenia](../part-1/160-modelowanie-obciazenia.md) i [progów zaliczenia testu](290-tresholds.md). Asystent może pomóc przygotować test, ale wymagania biznesowe i reprezentatywność ruchu nadal trzeba ustalić na podstawie badanej aplikacji.

## Gdy integracja nie działa

Najpierw sprawdź `k6 version` i pomoc `k6 x agent --help`. Następnie odczytaj `k6 x agent status` oraz log połączenia MCP w edytorze. Jeśli konfiguracja istnieje, ale narzędzia nie są widoczne, sprawdź, czy klient ją wczytał i czy jego proces ma dostęp do k6. Udane ręczne wykonanie w terminalu i udane uruchomienie przez MCP to dwa osobne etapy weryfikacji.
