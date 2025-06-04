# Budowanie rozproszonego środowiska do testów

W czasie pracy nad skyptami k6, test uruchamiamy na jednej maszynie. Na potrzeby przeprowadzenia testów możliwości jednej maszyny mogą być jednak niewystarczające. W takim przypadku będziemy musieli oprzeć się na rozwiązaniu, które pozwoli uruchomić testy na większej liczbie maszyn. 

Mamy do wybory kilka komercyjnych serwisów takich jak:
* Grafana Cloud
* Azure Load Testing
* Red Line 13

Jeśli nie chcemy z nich korzystać możemy z nich skorzystać możemy również zbudować własne środowisko do testów k6 oparte o Kubernetes (k8s). Mamy dwie możliwości:

* Uruchamianie testów na dedykowanych serwerach
* Uruchamianie testów w Kubernetes

## Środowisko

Budując środowisko do testów na dedykowanych serwerach musimy w pierwszej kolejności zadbać o dostrojenie ich konfiguracji. Najważniejszymi parametrami o jakie należy zadbać to

* maksymalna liczba otwartych plików (plikami są też połączenia)
* zakres otwatych portów
* reużywanie połączeń tcp

Szczegółowe informacje na ten temat znajdziesz pod linkami
* https://grafana.com/docs/k6/latest/set-up/fine-tune-os/
* https://grafana.com/docs/k6/latest/testing-guides/running-large-tests/#os-fine-tuning

K6 umożliwia podzielenie obciążenia pomiędzy wykorzystywane maszyny korzystając z dedykowanych opcji. Przykład poniżej pokazuje jak podzielić obciążenie na kilka maszyn.

```
## podział obciążenia my-script.js na dwie maszyny
k6 run --execution-segment "0:1/2"   --execution-segment-sequence "0,1/2,1" my-script.js
k6 run --execution-segment "1/2:1"   --execution-segment-sequence "0,1/2,1" my-script.js

## podział obciążenia my-script.js na trzy maszyny
k6 run --execution-segment "0:1/3"   --execution-segment-sequence "0,1/3,2/3,1" my-script.js
k6 run --execution-segment "1/3:2/3" --execution-segment-sequence "0,1/3,2/3,1" my-script.js
k6 run --execution-segment "2/3:1"   --execution-segment-sequence "0,1/3,2/3,1" my-script.js

## podział obciążenia my-script.js na cztery maszyny
k6 run --execution-segment "0:1/4"     --execution-segment-sequence "0,1/4,2/4,3/4,1" my-script.js
k6 run --execution-segment "1/4:2/4"   --execution-segment-sequence "0,1/4,2/4,3/4,1" my-script.js
k6 run --execution-segment "2/4:3/4"   --execution-segment-sequence "0,1/4,2/4,3/4,1" my-script.js
k6 run --execution-segment "3/4:1"     --execution-segment-sequence "0,1/4,2/4,3/4,1" my-script.js
```

Rozwiązanie to ma jednak kilka ograniczeń:

* Start instancji nie będzie zsynchronizowany. Możesz poprawić synchronizajcję startując test z opcjami `--paused --address localhost:6565` a następnie wystartować je korzystając z k6 REST API np. komendą `curl -X PATCH http://localhost:6565/v1/status -H "Content-Type: application/json" -d '{"paused": false}'`

* Każda instancja k6 ocenia Thresholds (progi) niezależnie — bez uwzględniania wyników pozostałych instancji. Aby je wyłączyć, użyj flagi --no-thresholds.

* k6 raportuje metryki indywidualnie dla każdej instancji. W zależności od sposobu przechowywania wyników testów obciążeniowych, może być konieczna ręczna agregacja metryk, aby prawidłowo je obliczyć. 

* Funkcje `setup()` oraz `tearDown()` wykonają się na każdej instancji.

Problemów tych pozbawiony jest sposób druga opcja druka opcja budowy rozproszonego środowiska testowego.

## Przygotowanie środowiska k8s

Na potrzeby budowy środowiska do testów rozproszonych k6 będziesz potrzebował dostępu do klastra k8s. Skonfiguruj odpowiednio narzędzie `kubectl` aby mieć do niego dostęp.

Następnie zainstaluj k6-operator, najłatwiej zrobisz to korzystając z narzędzia helm

```bash
helm repo add k6 https://grafana.github.io/k6-operator/
helm repo update
helm install k6-operator k6/k6-operator --namespace k6-operator --create-namespace
```
## 2. Parametryzacja testu
Do przekazania skryptu do PODów wykonujących testy wykorzystamy mechanizm ConfigMap. To jeden z natywnych obiektów w Kubernetes, który umożliwia przechowywanie par klucz-wartość reprezentujących konfigurację aplikacji. Zamiast „twardo kodować” dane konfiguracyjne wewnątrz kontenera, można je oddzielić i wstrzykiwać do aplikacji dynamicznie w czasie uruchamiania lub działania.

```bash
kubectl create configmap single-test --from-file test\single-test.js
```
Polecenie to spowoduje utworzenie ConfigMap o nazwie single-test. Do tej ConfigMap zostanie dodany plik jako osobne pary klucz-wartość, gdzie:
* nazwa klucza odpowiada nazwie pliku (bez ścieżki),
* wartością każdego klucza będzie zawartość danego pliku.

Możesz sprawdzić jaką wartość ma obiekt configMap poleceniem
```bash
  kubectl describe configmap single-test
```

Jeśli projekt testowy składa się z kilku plików możesz wykorzystać polecenie [Archive](https://grafana.com/docs/k6/latest/reference/archive/) do spakowania skryptów do pliku tar lub wykorzysać np. narzędzie [Rollup]](https://github.com/grafana/k6-rollup-example) do zagregowania potrzebnych skryptów do jednego pliku.

## 3. Definiowanie zasobow 

```yaml
# k6-resource.yml

apiVersion: k6.io/v1alpha1
kind: TestRun
metadata:
  name: k6-sample
spec:
  parallelism: 1
  script:
    configMap:
      name: single-test
      file: single-test.js
  separate: false
  runner:
    resources:
      limits:
        cpu: 200m
        memory: 1000Mi
      requests:
        cpu: 100m
        memory: 500Mi
```
W pliku powyżej określamy wykorzystujemy dedykowane parametry:
* parallelism - określa liczbę równoległych workerów (podów), które będą uruchamiać test.
* separate - decyduje, czy każdy worker powinien działać niezależnie (separate = true) czy jako część rozproszonego testu (shared execution) (false).

Określamy również typowe parametry pod'ów k8s:
* requests - minimalne zasoby gwarantowane dla podów z testami. Scheduler Kubernetes używa tych wartości do planowania rozmieszczenia podów (100m CPU = 10% rdzenia, 500Mi = 500 MB RAM).
* limits - maksymalne zasoby, jakie pod może wykorzystać, przekroczenie limitu CPU skutkuje ograniczeniem wydajności, a przekroczenie limitu RAM – ubiciem poda przez OOM (Out of Memory).

### 4. Uruchamianie testu

Uruchomienie testów następuje po stworzeniu zasobów polecenium

```bash
kubectl apply -f k6-test.yaml
```

Możemy obserwować działające kontenery poleceniem 
```bash
kubectl get jobs
```
### Przekazywanie parametrów

```yaml
apiVersion: k6.io/v1alpha1
kind: TestRun
metadata:
  name: run-k6-with-vars
spec:
  parallelism: 4
  script:
    configMap:
      name: my-test
      file: test.js
  arguments: --tag testid=run-k6-with-args --log-format json
  runner:
    env:
      - name: MY_CUSTOM_VARIABLE
        value: 'this is my variable value'
    envFrom:
      - configMapRef:
          name: prometheus-config
      - secretRef:
          name: prometheus-secrets
```

Parametry w sekcji envFrom zdefiniujemy jak w przykładzie poniżej

```bash
# Stworzenie ConfigMap nie zawierającej informacji wrażliwych
kubectl create configmap -n k6-demo prometheus-config \
 --from-literal=K6_PROMETHEUS_RW_SERVER_URL=[YOUR REMOTE WRITE ENDPOINT] \
 --from-literal=K6_PROMETHEUS_RW_STALE_MARKERS=true

# Stworzenie obiektu secret z informacjami wrażliwymi
kubectl create secret -n k6-demo generic prometheus-secrets \
 --from-literal=K6_PROMETHEUS_RW_USERNAME=[YOUR USERNAME] \
 --from-literal=K6_PROMETHEUS_RW_PASSWORD=[YOUR PASSWORD] 
```

### Usuwanie zasobów
Po zakończeniu testu należy usunąć zasoby poniższym poleceniem

```
kubectl delete -f /path/to/your/k6-resource.yaml
```

Możesz też dodać parametr `cleanup` aby zasoby automatycznie usunęły się po teście

```yaml
apiVersion: k6.io/v1alpha1
kind: TestRun
metadata:
  name: run-k6-with-realtime
spec:
  parallelism: 4
  # Removes all resources upon completion
  cleanup: post
  script:
    configMap:
      name: my-test
      file: test.js
  arguments: -o experimental-prometheus-rw
```

Więcej informacji znajdziesz pod linkiami
* [https://github.com/javaducky/demo-k6-operator](https://github.com/javaducky/demo-k6-operator)