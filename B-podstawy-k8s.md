
# Wprowadzenie do Kubernetes

Kubernetes powstał w 2014 roku jako wewnętrzny projekt Google. Głównym powodem powstania Kubernetes była potrzeba łatwego zarządzania kontenerami, które w tamtym czasie zyskiwały popularność dzięki Dockerowi. Platforma rozwiązuje problemy związane z automatyzacją wdrożeń, skalowaniem aplikacji i odpornością na awarie. Dziś jest standardem w świecie chmur i mikrousług, używanym przez firmy każdej wielkości. Poniżej znajdziesz omówienie podstawowych pojęć i komend. Informacje pomogą Ci rozpocząć pracę z tą platformą.

---

## Podstawowe pojęcia Kubernetes

Kubernetes opiera się na kilku fundamentalnych pojęciach, które pomagają organizować i zarządzać aplikacjami w kontenerach.

**Klaster** to zbiór maszyn (nazywanych node’ami), które działają razem jako jedna platforma. Dzięki temu użytkownik klastra może bydować aplikacje nie znając szczegółów fizycznej infrastruktury. Korzystając z odpowiednich poleceń tworzy kolejne elementy, które będą automatycznie dystrybuowane i uruchamiane na maszynach klastra. 

Podstawową jednostką w Kubernetes jest **Pod**. Jest to „opakowanie” dla jednego lub kilku kontenerów (np. Docker), które współdzielą tę samą przestrzeń sieciową i system plików. Prosty przykład definicji Pod'a znajdziesz poniżej. 

```yml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
    - name: nginx-container
      image: nginx:latest
      ports:
        - containerPort: 80
```

W praktyce Pody tworzymy zwykle na potrzeby budowania i testowania rozwiązania, ponieważ jest on elementem, który w przypadku awarii nie zostanie odtworzony. Aby zapewnić automatyczne skalowanie i utrzymywanie żądanej liczby podów, Kubernetes korzysta z obiektów **Deployment**, którego definicję znajdziesz poniżej.

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:latest
          ports:
            - containerPort: 80

```

Za dostę i dystrybucje ruchu pomiędzy Pod'ami oraz komunikację ze światem zewnętrznym odpowiedzialny jest **Service**. Możesz myśleć o nich jak o routerze działającym w klastrze.

Do organizacji i izolacji zasobów Kubernetes używa **Namespace**. Dzięki namespace można wydzielić osobne środowiska (np. dev, test, prod) w jednym klastrze. 

**ConfigMap** i **Secret** to obiekty, które pozwalają przechowywać konfigurację i dane wrażliwe. ConfigMap nadaje się do zwykłych ustawień, a Secret do haseł czy kluczy API. 

Jeśli aplikacje lub testy potrzebują trwałego miejsca na dane, Kubernetes zapewnia **PersistentVolume** (PV) i **PersistentVolumeClaim (PVC)**. PV to zasób magazynowy, a PVC to żądanie dostępu do tego magazynu. To rozwiązanie przydaje się np. do zapisywania wyników testów lub danych z baz.

👉 Dokumentacja: [Kubernetes Concepts](https://kubernetes.io/docs/concepts/overview/)

---

## Zarządzanie klastrem

Do zarządzania klastrem wykorzystujemy narzędzie **kubectl**. Instrukę instalacji narzędzia znajdziesz pod linkime [Kubernetes Documentation - Install Tools](https://kubernetes.io/docs/tasks/tools/). Przed rozpoczęciem pracy należy odpowiednio skonfigurować dostęp do klastra. Konfiguracja przechowywana jest w pliku `~/.kube/config`. Nie musisz go edytować samodzielnie. Zwykle wykorzystasz odpowiednie polecenie dostawcy usługi Kubernetes. Dla przykładu Elastic Kubernetes Services (EKS) w AWS polecenie to ma postać:

```bash
aws eks update-kubeconfig --region eu-central-1 --name my-cluster
```

Może sprawdzić czy poprawnie skonfiugurowałeś dostęp do klastra i jego zasoby poleceniem

```bash
kubectl cluster-info
kubectl get nodes
```

### 1️⃣ Dodawanie zasobów (np. poda, deploymentu, joba)  

Chcąc dodać zasoby do klastra korzystamy również z komendy kubectl. Poniżej przykład tworzący Pod o nazwie test-nginx korzystając z obrazu nginx oraz nasłuchujący na porcie 80.

```bash
kubectl run nginx-pod --image=nginx:latest --port=80
```

Liczba parametrów kofiguracyjnych dla elementów k8s jest bardzo duża i komendy mogły by być bardzo długie dlatego k8s umożliwia zapisanie parametrów w pliku yaml. Poniżej przykład jak dodać zasób mając konfigurację w pliku (treść pliku znajdziesz w poprzednim rozdziale). 

```bash
kubectl apply -f nginx-pod.yaml
```

### Sprawdzanie statusu poda  

Chcąc sprawdzić, które pody działają i jaki jest ich status wykorzystujemy komendę poniżej.

```
> kubectl get pods

NAME                              READY   STATUS    RESTARTS   AGE
nginx-pod                         1/1     Running   0          30s
```

### Sprawdzanie logów poda  

Oprócz statusu Możemy również sprawdzić logi poda, a dokładniej to co aplikacja wysyła na standardowe wyjście. Wykorzystujemy do tego poniższą komendę.

```
> kubectl logs nginx-pod

running (10s), 5/10 VUs, 100 complete and 0 interrupted iterations
```
Dzięki tej komendzie możemy debugować błędy i analizować problemy w aplikacjach. Jeśli to jest niewystarczające to możemy zalogować się na Pod i sprawdzić inne elementy aplikacji.

```bash
kubectl exec -it nginx-pod -- bash
```

### Usuwanie zasobów  
Jeśli Pod nie jest nam już potrzeby możemy usunąć go komendą. Pomaga to utrzymywać porządek w klastrze.

```bash
kubectl delete -f nginx-pod.yaml
```

👉 Dokumentacja: 
* [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
* [Kubectl Cheet Sheet](https://kubernetes.io/docs/reference/kubectl/quick-reference/)

---

## Helm 

Kiedy Kubernetes zyskał popularność jako platforma do zarządzania kontenerami, szybko okazało się, że ręczne pisanie i zarządzanie plikami YAML dla każdej aplikacji staje się skomplikowane, powtarzalne i trudne do utrzymania w większych projektach. Rozwiązaniem tego problemu było narzędzie **Helm**, które działa jako menedżer pakietów dla Kubernetes. Pakiety w Helm nazywamy **Chart**. Chart to w praktyce zdefiniowany zestaw plików, który opisuje aplikację do uruchomienia w Kubernetesie. 

## 📌 Przykład – instalacja NGINX Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install my-nginx ingress-nginx/ingress-nginx
```

To automatycznie:
- pobierze chart,
- wygeneruje szablony YAML,
- uruchomi aplikację w klastrze.

---


- 🔗 [Oficjalna dokumentacja Helm](https://helm.sh/docs/)
- 🔗 [Repozytoria chartów na ArtifactHub](https://artifacthub.io)
- 🔧 `helm create mychart` — komenda tworząca szkielet własnego charta

---
