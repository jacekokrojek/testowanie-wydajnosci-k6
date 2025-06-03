# Nagrywanie zapytań i konwersja HAR do skryptu k6

W tym rozdziale omówię, jak wykorzystać możliwość nagrania ruchu HTTP w przeglądarce i przekształcenia go w test wydajnościowy w narzędziu k6. To podejście bywa szczególnie przydatne, gdy testujesz aplikację webową z wieloma zależnościami (np. żądania AJAX, zasoby statyczne, itd.),

## Nagrywanie testów
k6 udostępnia narzędzie har-to-k6, które konwertuje plik w formacie HAR do skryptu k6. Będziemy zatem potrzebować pliku HAR z zapisem ruchem jaki chcemy symulować. Możemy stworzyć go jedną z poniższych opcji:  

1. Dodatek Grafana k6 Browser Recorder
2. Narzędzia developerskie Przeglądarki np. Chrome DevTools 

Z dodatku Grafana k6 Browser Recorder możesz korzystać bez logowania do Grafana i zapisując plik lokalnie. Korzystanie z niego jest intuicyjne. Będąc na wybranej zakładce włączany nagrywanie i kolejne zapytania będą nagrane aż do zakończenia nagrania. Mamy również możliwość zatrzymania i wznowienia nagrania w wybranym momencie. Sam dodatek filtruje zapisany ruch z mniej ważnych nagłówków HTTP co poprawia czytelność później wygenerowanego skryptu.

Jeśli nie mamy możliwości zainstalowania dodatku możemy wykorzystać opcje DevTools i zakładki Sieć w przeglądarce. Daje ona możliwość wyeksportowania zapytań. Możemy je również odfiltrować przed zapisaniem korzystając z wbudowanych opcji przeglądarki.

## Konwertowanie pliku HAR do skryptu k6
Jeśli posiadasz plik HAR, który chciałbyś przekształcić na test skorzystaj z narzędzia `har-to-k6`. Możesz je zainstalować poleceniem

```bash
npm install -g har-to-k6
```

Kolejnym krokiem będzie wykorzystanie go to konwercji. Robimy to poleceniem poniżej

```
har-to-k6 sample.har -o sample.js
```

Więcej na ten temat przeczytasz pod linkiem https://grafana.com/docs/k6/latest/using-k6/test-authoring/create-tests-from-recordings
