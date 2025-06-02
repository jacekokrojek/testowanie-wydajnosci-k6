# Zadania praktyczne – testowanie API Keycloak z k6

Poniżej znajdują się opisy zadań, które uczestnicy szkolenia powinni wykonać, wykorzystując narzędzie k6 do testowania API Keycloak. Każde zadanie zawiera opis operacji, kontekst oraz informacje niezbędne do przygotowania odpowiedniego zapytania HTTP.

## 1. Wysłanie zapytania POST – utworzenie nowego użytkownika

**Opis zadania:**

* Przygotuj zapytanie POST do endpointa API Keycloak służącego do tworzenia użytkownika.
* W ciele żądania prześlij dane nowego użytkownika, takie jak `username`, `email` oraz ustawienie `enabled`.
* Pamiętaj o przesłaniu nagłówków `Content-Type: application/json` oraz `Authorization` z tokenem dostępu.
* **Adres URL:** `https://{hostname}/admin/realms/sample-app/users`
* W treści zapytania prześlij dane:

```json
{
    "username": "testuser1",
    "email": "testuser1@example.com",
    "enabled": true,
    "firstName": "Test",
    "lastName": "User"
}
```

**Kontekst:**
To zapytanie odpowiada za tworzenie nowych użytkowników w systemie. Wysyłając odpowiednio przygotowany JSON z danymi użytkownika, możemy zarejestrować nową osobę w Keycloak. W odpowiedzi serwer zwróci status 201 (Created), jeśli operacja zakończy się sukcesem.

---

## 2. Wysłanie zapytania PUT – Reset hasła

**Opis zadania:**
* Przygotuj zapytanie PUT do API Keycloak, które zresetuje hasło wybranego użytkownika.
* Adres endpointa musi zawierać identyfikator użytkownika (`userId`).
* W treści żądania prześlij zmienione dane użytkownika.
* Do żądania dodaj nagłówki `Content-Type: application/json` oraz `Authorization`.
* **Adres URL:** `https://${hostname}/admin/realms/sample-app/users/${userId}/reset-password`
* Dane jakie należy przesłać mają format:

```json
{
    "type": "password",
    "temporary": false,
    "value": "testpassword123"
}
```

**Kontekst:**
To zadanie pomoże nam w przyszłości zalogować się do serwisu korzystając z ustawionego hasła

## Uwagi dodatkowe:

* Wszystkie zapytania wymagają przesłania nagłówka `Authorization` zawierającego token dostępu uzyskanego wcześniej z Keycloak (oprócz zapytania o token).
* Operacje wykonujemy na serwerze Keycloak działającym pod adresem `https://{hostname}` lub na wskazanym adresie URL.
* Przed wykonaniem żądań należy upewnić się, że konto ma uprawnienia do wywoływania API administracyjnego.

