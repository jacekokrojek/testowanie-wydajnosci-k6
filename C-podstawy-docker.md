
# Podstawy Docker

Docker to platforma do tworzenia, wdrażania i uruchamiania aplikacji w kontenerach. Kontener to lekkie, przenośne środowisko uruchomieniowe, które zawiera wszystko, co potrzebne do działania aplikacji – kod, biblioteki, narzędzia systemowe, ustawienia.

W przeciwieństwie do maszyn wirtualnych, kontenery nie zawierają całego systemu operacyjnego, a jedynie to, co niezbędne. Dzięki temu są znacznie lżejsze, szybsze w uruchamianiu i łatwiejsze w przenoszeniu między środowiskami – lokalnym, testowym, produkcyjnym.

## Jakie problemy rozwiązuje Docker?

1. **„U mnie działa”** – czyli problem niekompatybilności środowisk między developerami, testami a produkcją.
2. **Łatwość konfiguracji** – aplikację można opisać za pomocą pliku `Dockerfile`, co sprawia, że środowisko jest powtarzalne i łatwe do odtworzenia.
3. **Izolacja aplikacji** – różne aplikacje i ich zależności nie wpływają na siebie nawzajem.
4. **Szybkie skalowanie** – kontenery mogą być łatwo uruchamiane w wielu instancjach, co jest szczególnie ważne w środowiskach chmurowych.

---

## Kluczowe pojęcia

- **Obraz (image)** – szablon służący do tworzenia kontenerów. Tworzony jest na podstawie pliku `Dockerfile`.
- **Kontener (container)** – działająca instancja obrazu.
- **Dockerfile** – plik konfiguracyjny, który określa jak zbudować obraz Dockera.
- **Docker Hub** – publiczne repozytorium, z którego można pobierać gotowe obrazy lub publikować własne.

## Przykład: tworzymy obraz z prostą aplikacją w Pythonie

Załóżmy, że mamy aplikację w Pythonie w pliku `app.py`:

```python
print("Hello from Docker!")
```

Obraz pozwalający uruchomić nasz program definiujemy w pliku `Dockerfile`, w którym wskazujemy obraz na bazie, którego chcemy zbudować nasze rozwiązanie, kopiujemy do niego kod nasze aplikcji oraz podajemy komendę jaką należy go uruchomić:

```Dockerfile
FROM python:3.11-slim
COPY app.py .
CMD ["python", "app.py"]
```

Aby zbudować obraz i uruchomić kontener wydajemy poniższe polecenia:

```bash
docker build -t hello-python .
docker run hello-python
```


Możliwości konfiguracji skonteryzowanej aplikacji są znacznie większe od pokazanych w pliku Dockerfile powyżej. Możemy m.in. ustawić zmienne środowiskowe, skonfigurować otwierane porty czy ustawić uprawnienia użytkownika wewnątrz kontenera i uruchomić polecenia w konkretnym kontekście systemowym. Nasz obraz może stać się również obrazem bazowym dla kolejnego rozwiązania. Dzięki temu możemy budować rozwiązania warstwowo bazując na obrazach przygotowanych przez innych 

## Docker – Cheatsheet

### Podstawowe komendy

```bash
# Budowanie obrazu z Dockerfile
docker build -t <nazwa_obrazu> .

# Uruchamianie kontenera
docker run <nazwa_obrazu>

# Uruchamianie w tle
docker run -d <nazwa_obrazu>

# Mapowanie portów
docker run -p 8080:80 <nazwa_obrazu>

# Nadanie nazwy kontenerowi
docker run --name moj_kontener <nazwa_obrazu>

# Lista kontenerów
docker ps               # działające
docker ps -a            # wszystkie

# Zatrzymywanie kontenera
docker stop <id|nazwa>

# Usuwanie kontenera lub obrazu
docker rm <id|nazwa>
docker rmi <nazwa_obrazu>

# Wejście do działającego kontenera
docker exec -it <nazwa_kontenera> /bin/bash

# Sprawdzanie logów
docker logs <nazwa_kontenera>
```

### Docker Compose (gdy potrzebujemy wielu kontenerów)

Docker Compose to narzędzie, które umożliwia definiowanie i uruchamianie wielokontenerowych aplikacji Docker w prosty i deklaratywny sposób. Zamiast uruchamiać każdy kontener osobno z poziomu linii poleceń, możemy opisać całą konfigurację – kontenery, sieci, woluminy i zależności – w jednym pliku docker-compose.yml. Dzięki temu możemy jednym poleceniem (docker-compose up) uruchomić całą aplikację składającą się np. z serwera aplikacyjnego, bazy danych i narzędzi pomocniczych. Compose automatycznie zadba o właściwą kolejność startu usług, połączenia sieciowe między nimi oraz o przechowywanie danych w woluminach, jeśli jest to potrzebne. Dzięki niemy możemy szybko odtworzyć środowiska na innym komputerze – wystarczy sklonować repozytorium z plikiem docker-compose.yml i wykonać jedno polecenie.

Plik `docker-compose.yml`:
```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "5000:5000"
```

Uruchomienie:

```bash
docker-compose up
```

---

## Podsumowanie

Docker to narzędzie, które zrewolucjonizowało sposób tworzenia i wdrażania aplikacji. Dzięki konteneryzacji możemy łatwiej zarządzać zależnościami, zapewnić spójność środowisk i znacząco uprościć procesy CI/CD. Choć początki mogą wydawać się nieco techniczne, warto poświęcić czas na opanowanie podstaw, ponieważ Docker jest obecnie standardem w świecie nowoczesnego developmentu.
