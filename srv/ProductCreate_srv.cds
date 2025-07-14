using { project1 as db } from '../db/CreateProduct';

service ProductService {
  entity Products as projection on db.Products;
}
