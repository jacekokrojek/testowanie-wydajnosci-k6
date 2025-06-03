# Budowanie rozproszonego środowiska do testów
W czasie pracy nad skyptami k6, test uruchamiamy na jednej maszynie. Na potrzeby przeprowadzenia testów możliwości jednej maszyny mogą być jednak niewystarczające. W takim przypadku będziemy musieli oprzeć się na rozwiązaniu, które pozwoli uruchomić testy na większej liczbie maszyn. 

Mamy do wybory kilka komercyjnych serwisów takich jak:
* Grafana Cloud
* Azure Load Testing
* Red Line 13

Jeśli nie chcemy z nich korzystać możemy z nich skorzystać możemy również zbudować własne środowisko do testów k6 oparte o Kubernetes (k8s).

## Przygotowanie środowiska

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