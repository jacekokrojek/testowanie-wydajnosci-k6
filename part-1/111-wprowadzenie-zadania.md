# Weryfikujemy stabilność połączenia.
W naszym pierwszym zadaniu pobierzemy nieduży obrazek ze strony głównej aby sprawdzić czasy odpowiedzi i ocenić stabilność naszego środowiska testowego.

1. Otwrórz w przeglądarce stronę główną, zaakceptuj przejście do strony niezweryfikowanego wydawcy
2. Otwórz narzędzia developerskie, wejdź do zakładki sieć, przeładuj stronę i znajdź obrazek o nazwie 'keycloak-logo-text.svg'. Zapisz jego adres url
3. Stwórz nowy skrypt poleceniem `k6 new`
4. Zmodyfikuj skrypt aby pobirtał obrazek z logo co 5 sekund.
5. Uruchom test na okres 5 minutut z jednym wątkiem
