# Zadania do rozdziału XML

## Ustawienie wymaganej liczby produktów w magazynie dla wybranej wersji produktu
Testując serwisy e-commerce musimy zadbać o właściwą liczbę produktów, które będziemy wykorzystywać (kupować) w czasie testów.

Poniżej znajdziesz zapytanie, które pobiera aktualną liczbę produktów w sklepie. 
```
GET http://<ip-address>:8001/api/stock_availables/1
Authorization: Basic MVBCREhLNUpFTDFYRk5OVTEzQVZCRzY0SUxFS1JMVUU6
```
Na podstawie odpowiedzi skonstruuj zapytanie zmieniające liczbę produktów w magazynie. Wykorzystaj specyfikację zapytania przedstawioną poniżej. Aby zapewnić powodzenie zmiany, dane inne niż quantity powinny pochodzić z odpowiedzi.

```
PUT http://3.71.14.30:8001/api/stock_availables/1
Authorization: Basic MVBCREhLNUpFTDFYRk5OVTEzQVZCRzY0SUxFS1JMVUU6
Content-Type: application/xml

<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_available>
    <id>1</id>
    <id_product>1</id_product>
    <id_product_attribute>0</id_product_attribute> 
    <id_shop>1</id_shop> 
    <id_shop_group>0</id_shop_group> 
    <depends_on_stock>0</depends_on_stock>
    <out_of_stock>0</out_of_stock>
    <quantity>600</quantity>
  </stock_available>
</prestashop>
```

## Zmiana liczby produktów w magazynie dla dowolnego produktu

Zapytanie poniżej pobiera dane o produkcie i jego wersjach. Wykorzystaj odpowiedź do zmiany liczby produktów danej wersji.

```
GET http://3.71.14.30:8001/api/products/1
Authorization: Basic MVBCREhLNUpFTDFYRk5OVTEzQVZCRzY0SUxFS1JMVUU6
```
