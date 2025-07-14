namespace project1;

entity Products {
  key product_id : Integer;
  name           : String(50) @title : '물품명' @unique;
  unit           : String(20);
  price          : Integer;
  maxQty         : Integer;
  image          : String(255);
  note           : String(200);
  createdAt      : Timestamp @default : $now;
}