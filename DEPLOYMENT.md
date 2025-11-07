# Instrukcje Wdrożenia Aplikacji

Ten przewodnik opisuje, jak wdrożyć aplikację z grami na serwerze VPS przy użyciu Dockera i Traefika.

## Wymagania Wstępne

1.  **Serwer VPS:** Dowolny serwer z publicznym adresem IP i zainstalowanym systemem Linux.
2.  **Docker i Docker Compose:** Upewnij się, że na serwerze są zainstalowane.
3.  **Domena:** Domena `xsus.site` musi być Twoją własnością, a subdomena `gry.xsus.site` musi wskazywać na publiczny adres IP Twojego serwera VPS (rekord A w ustawieniach DNS).
4.  **Zwolniony port 443:** Port 443 na serwerze musi być wolny, aby Traefik mógł go używać do obsługi ruchu HTTPS.

## Kroki Wdrożenia

### 1. Przygotowanie Serwera

Połącz się z serwerem VPS przez SSH i zainstaluj `git`:

```bash
sudo apt-get update
sudo apt-get install -y git
```

### 2. Klonowanie Repozytorium

Sklonuj repozytorium z aplikacją na swój serwer:

```bash
git clone <URL_TWOJEGO_REPOZYTORIUM>
cd <NAZWA_KATALOGU_REPOZYTORIUM>
```

### 3. Konfiguracja

Przed pierwszym uruchomieniem, musisz wprowadzić jedną zmianę w pliku `docker-compose.yml`:

*   **Zmień adres e-mail:** Otwórz plik `docker-compose.yml` i w sekcji `services.traefik.command` zmień `twoj-email@example.com` na swój prawdziwy adres e-mail. Jest on potrzebny do generowania certyfikatu SSL przez Let's Encrypt.

### 4. Pierwsze Uruchomienie

Uruchom aplikację za pomocą Docker Compose:

```bash
docker-compose up -d --build
```

*   `-d` uruchomi kontenery w tle.
*   `--build` zbuduje obraz aplikacji przy pierwszym uruchomieniu.

Traefik automatycznie wykryje kontener z aplikacją, skonfiguruje subdomenę `gry.xsus.site` i wygeneruje dla niej certyfikat SSL. Po kilku chwilach aplikacja powinna być dostępna pod adresem `https://gry.xsus.site`.

**Uwaga:** Ponieważ port 80 na Twoim serwerze jest już zajęty, automatyczne przekierowanie z HTTP na HTTPS nie będzie działać. Upewnij się, że zawsze łączysz się ze stroną, używając `https://` na początku adresu.

### 5. Panel Traefika

Panel administracyjny Traefika będzie dostępny pod adresem `http://<IP_TWOJEGO_SERWERA>:8088`.

## Aktualizacja Aplikacji

Dzięki Docker Compose, proces aktualizacji jest bardzo prosty.

1.  **Pobierz zmiany:** Połącz się z serwerem i w katalogu z aplikacją pobierz najnowsze zmiany z repozytorium Git:

    ```bash
    git pull
    ```

2.  **Przebuduj i zrestartuj:** Użyj Docker Compose, aby przebudować obraz aplikacji i zrestartować kontener:

    ```bash
    docker-compose up -d --build
    ```

    Docker Compose automatycznie zatrzyma stary kontener, zbuduje nowy obraz z najnowszymi zmianami i uruchomi go ponownie, bez przerywania działania serwera proxy.
