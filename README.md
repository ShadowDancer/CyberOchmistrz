# Cyber Ochmistrz
To jest cybernetyczny podręcznik ochmistrza / drugiego oficera, pomagający w przygotowaniu zaopatrzenia na rejsach.
Docelowo składać się będzie z książki kucharskiej, do której można dodawać przepisy i modułu pozwalającego zaplanować posiłki, a finalnie wygenerować z nich listę zakupów.

## Statyczna strona

https://shadowdancer.github.io/CyberOchmistrz/

## Uruchomienie lokalne

1. Zainstaluj zależności
    ```bash
    npm install
    ```
1. Uruchom serwer developerski (z live reloadedm)
    ```bash
    npm run dev 
    ```
1. Uruchom linery
    ```bash
    npm run build
    ```


## Problemy i TODO
- Przeciąganie między dniami nie działa
- Dane zapisywane są w local storage, więc nie są współdzielone między urządzeniami
- Brak możliwości modyfikacji przepisów/składników online
- Brak możliwości dodawania/usuwania dni z rejsu