
# Modelowanie obciążenia

Model obciążenia naszej aplikacji często wymaga symulowania różnych grupy użytkowników. Testując sklep internetowym będziemy chcieli zdefiniować inne akcje dla osób przeglądających produkty, dodających je do koszyka oraz finalizujących zamówienie. W poniższym artykule pokażę jak zrobić to w k6.

## Scenariusze
W poznanych do tej pory przykładach k6 definiowanie ruchu odbywa się w funkcji `default`, która zawiera instrukcje dla wirtualnych użytkowników (VU – *Virtual Users*). Jednakże w sytuacji, gdy chcemy przeprowadzić bardziej zaawansowane testy, takie jak symulacja różnych grup użytkowników wykonujących odmienne zadania w różnych momentach czasu, potrzebujemy bardziej elastycznego podejścia – i tu właśnie pojawiają się scenariusze.

Scenariusze w k6 umożliwiają równoczesne uruchamianie wielu „ścieżek użytkownika”, z różnymi ustawieniami dotyczącymi liczby VU, czasów startu oraz trwania testu. Ich konfiguracja odbywa się w sekcji `options.scenarios`, gdzie można zdefiniować dowolną liczbę scenariuszy.

```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  scenarios: {
    home_page_users: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'visitHomePage',
    },
    login_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
      ],
      exec: 'login',
    },
  },
};

export function visitHomePage() {
    //...
}

export function login() {
   //...
}
```

W powyższym przykładzie mamy dwa różne zestawy użytkowników, wykonujących różne działania w tym samym czasie. Dzięki funkcji `exec` wskazujemy, którą funkcję ma wykonać dany scenariusz. To podejście znacząco zwiększa możliwości projektowania testów przypominających rzeczywiste zachowania użytkowników w systemie.

## Typy *executorów* – czyli jak sterować scenariuszami

k6 udostępnia różne typy tzw. **executorów**, czyli mechanizmów kontrolujących sposób uruchamiania scenariuszy. Każdy z nich pozwala na symulację innego rodzaju obciążenia. Oto ich lista:

* Shared Iterations (domyślny typ): W tym scenariuszu iteracje są rozdzielane równomiernie między wirtualnych użytkowników. Oznacza to, że jeśli masz 10 wirtualnych użytkowników i 100 iteracji, każdy użytkownik wykona 10 iteracji. Jest to domyślne zachowanie, jeśli nie zdefiniujemy jawnie innego typu scenariusza.

* Ramping VUs: Ten scenariusz pozwala na stopniowe zwiększanie lub zmniejszanie liczby wirtualnych użytkowników w czasie. Jest to idealne rozwiązanie do testów obciążeniowych, które mają na celu znalezienie punktu nasycenia systemu lub obserwowanie jego zachowania pod narastającym obciążeniem.

* Constant VUs: Utrzymuje stałą liczbę wirtualnych użytkowników przez określony czas. Idealny do testów wytrzymałościowych (ang. soak tests) lub testów dymnych (ang. smoke tests).

* Constant Arrival Rate: Ten scenariusz koncentruje się na stałej liczbie nowych iteracji na sekundę (lub minutę), niezależnie od tego, ilu użytkowników jest obecnie aktywnych. K6 automatycznie dostosowuje liczbę wirtualnych użytkowników, aby utrzymać zdefiniowane tempo. Jest to bardzo przydatne do testów obciążeniowych, które symulują stały napływ nowych żądań, niezależnie od wydajności systemu.

* Ramping Arrival Rate: Połączenie Constant Arrival Rate z Ramping VUs. Pozwala na stopniowe zwiększanie lub zmniejszanie tempa nowych iteracji.

W zależności od wybranego egzekutora mamy nieco inne opcje konfiguracji. Szczegóły znajdziesz pod linkiem [https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/)

Więcej informacji oraz dokumentacja scenariuszy dostępna jest na oficjalnej stronie: [https://grafana.com/docs/k6/latest/using-k6/scenarios/](https://grafana.com/docs/k6/latest/using-k6/scenarios/)


