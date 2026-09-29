1. Stwórz skrypt pobierający dane z losowego endpointu

/groups
/roles

2. Utwórz skrypt pobierający listę użytkowników, wykorzystaj opis dostępnych funkcji ze strony https://www.keycloak.org/docs-api/latest/rest-api/index.html#_users, uwzględnij paginacje. Przykłady zapytań sa pniżej

```
GET /admin/realms/sample-app/users?first=0&max=20
GET /admin/realms/sample-app/users?first=20&max=20
GET /admin/realms/sample-app/users?first=40&max=20
```