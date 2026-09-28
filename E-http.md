# Protokół HTTP

Protokół HTTP służy do wymiany informacji pomiędzy serwerem a przeglądarką internetową lub innymi aplikacjami. Jest to protokół tekstowy. Oznacza to, że przesyłane zapytania i odpowiedzi mają formę tekstu. Tekst ten ma określoną strukturę i dzięki temu jest rozumiany przez strony komunikacji. 
Przykład poniżej pokazuje zapytanie jakie przeglądarka wysyła jeśli użytkownik chce zobaczyć treść strony głównej serwisu Wikipedia jaki znajduje się pod adresem https://pl.wikipedia.org/. 

```http
GET / HTTP/1.1 
Accept : text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 
Accept-Encoding : gzip, deflate, br 
Accept-Language : pl,en-US;q=0.7,en;q=0.3 
Connection : keep-alive 
Host : pl.wikipedia.org 
User-Agent : Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0 
```

Pierwsza linia zawiera identyfikator metody protokołu HTTP, adres strony oraz informacje o obsługiwanej wersji protokołu HTTP. Na podstawie tych informacji serwer może rozpoznać jaką stronę chce zobaczyć użytkownik oraz jakich danych może spodziewać się w dalszej części zapytania. Kolejne linie zapytania to nagłówki, które informują serwer o szczegółach dalszej komunikacji. W przykładzie znajdziemy m.in. nagłówki mówiące to tym, że klient to przeglądarka Firefox w wersji 59, która w odpowiedzi spodziewa się danych text/html lub podobnych oraz obsługuje metody kompresji gzip i br a także preferuje język polski. Listę nagłówków kończy pusta linia. W przypadku metody GET kończy ona zapytanie. W przypadku innych metod mogą znajdować się za nią dodatkowe dane np. wpisane przez użytkownika w formularzu strony. 

Kolejny przykład przedstawia fragment odpowiedzi serwera. Podobnie jak w przypadku zapytania pierwsza linia informuje o wykorzystywanej wersji protokołu HTTP a także zawiera kod odpowiedzi i jej status. Kolejne linie to nagłówki zawierające dodatkowe informacje o odpowiedzi. Listę nagłówków kończy pusta linia. Za nią znajduje się treść odpowiedzi. 

```http
HTTP/2.0 200 OK 
Content-Encoding : gzip content-language : pl 
Content-Length : 18982 
Content-Type : text/html; charset=UTF-8 
Last-Modified : Sat, 24 Mar 2018 11:29:49 GMT 
<!DOCTYPE html> <html class = "client-nojs" lang = "pl" dir = "ltr" > 
...
``` 

Protokół HTTP definiuje zestaw standardowych nagłówków ale każdy użytkownik może definiować również własne nagłówki. 

# Przesyłanie danych 

W wielu przypadkach klient chciałby dołączyć dodatkowe dane do przesłanego zapytania. Protokół HTTP daje dwie możliwości: 

1. Przesłanie dodatkowych parametrów w adresie zapytania po znaku ‘?’ 
2. Przesłanie danych w treści zapytania umieszczając je jako w postaci tekstowej za nagłówkami 

W drugim przypadku klient musi określić w jakim formacie przesyła dane aby serwer mógł je poprawnie odczytać. Robi to wykorzystując standardowy nagłówek Content-Type a także informuje serwer jak długa jest sekcja zawierająca dane. Przykład poniżej pokazuje jak wyglądać może zapytanie zawierające dane wymagane do logowania. 

```http
POST /login/index.php HTTP/1.1 
Content-Type : application/x-www-form-urlencoded 
Content-Length: 46 

anchor=&username=admin&password=abcdefg 
```

Kodowanie Analizują poprzedni przykład można zauważyć, że serwer będzie mieć problem jeśli użytkownik będzie mieć np. hasło o postaci abcd&defg. W takim wypadku serwer nie będzie w stanie rozpoznać czy znak ten jest częścią danych czy też oddziela parametry. 

```http
anchor=&username=admin&password=abcd&defg 
```

W celu rozwiązania tego problemu znaki specjalne należy zakodować wykorzystując [kodowanie procentowe](https://pl.wikipedia.org/wiki/Kodowanie_procentowe) nazywane też po prostu kodowaniem URL (ang. URL encoding). W poprawnie przesyłanym zapytaniu omawiany znak równości zostanie zastąpiony ciągiem %26, który to serwer odpowiednio odkoduje. 

```http
anchor=&username=admin&password=abcd%26defg
```

Kodowanie procentowe używane jest również przy przesyłaniu parametrów zarówno w adresie jak i w treści zapytania. Inny problem stwarza przesyłanie danych binarnych (np. plik ze zdjęciem). HTTP to protokół tekstowy zatem umożliwia on przesyłanie tylko tekstu a co za tym idzie wartości liczbowych z ograniczonego zakresu. Rozwiązaniem jest tu wykorzystanie kodowania [base64](https://pl.wikipedia.org/wiki/Base64), które umożliwia zamianę danych binarnych na tekst. 

## Ciasteczka i sesja 

Serwer może wymagać aby przeglądarka zapamiętała pewne dane (np. preferencje użytkownika) i przesyłała je w kolejnych zapytaniach. W tym celu serwer dołącza do odpowiedzi nagłówki `Set-Cookie` 

```http
Set-Cookie : MoodleSession=eua9d225e67iqdac1iokf6c5r0; path=/; secure  
```
Po otrzymaniu takiej odpowiedzi przeglądarka powinna w kolejnych zapytaniach przesyłać w nagłówku `Cookie` wartość parametru MoodleSession.

```http
Cookie : MoodleSession=eua9d225e67iqdac1iokf6c5r0; ... 
```

Bardzo często z ciasteczkami kojarzone jest pojęcie sesji. W kontekście protokołu HTTP oznacza ono obiekt zawierający dane związane z aktualnym połączeniu serwera z użytkownikiem. Sesja posada identyfikator, który przechowywany jest przez przeglądarkę i przesyłany z wykorzystaniem mechanizmu ciasteczek. Dzięki temu serwer jest w stanie rozpoznać np. czy dany użytkownik zalogował się. Wyłączenie bądź wadliwe działanie mechanizm ciasteczek w przeglądarce może skutkować w błędnym działaniu aplikacji. 

Podobnie sprawa ma się w przypadku narzędzi do testów wydajności. Jeśli pominiemy informacje przesyłane w ciasteczkach symulacja działań użytkownika może być niepoprawna. 

# Kody odpowiedzi 
Kod odpowiedzi serwera to 3 cyfrowy identyfikator informujący o statusie odpowiedzi. Znajomość wszystkich kodów nie jest konieczna natomiast warto wiedzieć, że wyróżniono 5 grup odpowiedzi i identyfikowane są one przez pierwszą cyfrę kodu odpowiedzi. Grupy te to 

* 1xx Kody informacyjne 
* 2xx Kody powodzenia 
* 3xx Kody przekierowania 
* 4xx Kody błędu aplikacji klienta 
* 5xx Kody błędu serwera HTTP 

W przykładzie widzieliśmy kod 200, który mówi nam o tym, że serwer odczytał zapytanie i był w stanie przesłać odpowiedź. Zwykle w odpowiedzi widzimy również, krótki tekst opisujący kod. W przykładzie jest to tekst OK. 
Większość narzędzi interpretuje odpowiedzi o kodzie błędu z grup 4xx lub 5xx jako błędy. 

Przekierowania 
Serwer przetwarzając zapytanie od klienta może przekierować go na inny adres. Może być to przydatne gdy strona zmieniła na stałe lub chwilowo adres. Często przekierowania wykorzystuje się przy logowaniu lub próbie dostępu do zasobów wymagających logowania. Dla przykładu użytkownik niezalogowany może chcieć pobrać dane dostępne tylko po zalogowaniu.

```http
GET /course/view.php?id=3 HTTP/1.1 
... 
```
W takim przypadku serwer odsyła użytkownika na stronę logowania, której adres przekazuje w nagłówku `Location` 

```http
HTTP/1.1 303 See Other 
... 
Location : https://mymoodle.com/login/index.php
```

W następstwie otrzymania odpowiedzi o kodzie 303 przeglądarka wysyła następne zapytania na wskazany adres 

```http
GET /login/index.php HTTP/1.1
```` 
Tym razem serwer odpowiada kodem 200 i przesyła kod strony umożliwiającej logowanie. 

```http
HTTP/1.1 200 OK ... 
```

# Podsumowanie 
Komunikacja z wykorzystaniem protokołu HTTP wykorzystuje proste mechanizmy. Za każdym razem komunikacja inicjowana jest przez klienta, który przesyła dane wprowadzone bezpośrednio lub pośrednio przez użytkownika oraz dodatkowo dane odebrane wcześniej od serwera. Zadaniem testera jest dokładne przeanalizowanie komunikacji pomiędzy klientem i serwerem a następnie zbudowanie skryptów, które ją symulują. Pamiętaj, że w komunikacji tej nie ma wartości pojawiających się znikąd i zawsze jesteś w stanie znaleźć jej źródło i zrozumieć jak system ją wykorzystuje.
