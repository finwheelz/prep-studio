import type { Dataset } from "@/lib/types";

/**
 * Seeded PostgreSQL datasets. "default" is the visible sample the problem statement refers to;
 * other seeds are hidden variants that hit edge cases (ties, same-day duplicates, year
 * boundaries, users with no rows).
 */
export const DATASETS: Dataset[] = [
  {
    id: "qc",
    label: "Quick-commerce orders",
    tables: [
      {
        name: "users",
        description: "One row per registered user.",
        columns: [
          { name: "user_id", type: "INT", key: "PK" },
          { name: "signup_date", type: "DATE" },
          { name: "city", type: "TEXT" },
          { name: "channel", type: "TEXT", note: "organic | paid | referral" },
        ],
      },
      {
        name: "orders",
        description: "One row per delivered order. A user can place several orders on the same day.",
        columns: [
          { name: "order_id", type: "INT", key: "PK" },
          { name: "user_id", type: "INT", key: "FK", ref: "users.user_id" },
          { name: "order_date", type: "DATE" },
          { name: "amount", type: "NUMERIC(10,2)", note: "order value in ₹" },
          { name: "category", type: "TEXT", note: "grocery | snacks | pharma" },
        ],
      },
      {
        name: "events",
        description: "App activity. Several events per user per day are possible.",
        columns: [
          { name: "user_id", type: "INT", key: "FK", ref: "users.user_id" },
          { name: "event_date", type: "DATE" },
          { name: "event", type: "TEXT", note: "app_open | search | add_to_cart" },
          { name: "platform", type: "TEXT", note: "android | ios" },
        ],
      },
    ],
    ddl: `
CREATE TABLE users (user_id INT PRIMARY KEY, signup_date DATE NOT NULL, city TEXT NOT NULL, channel TEXT NOT NULL);
CREATE TABLE orders (order_id INT PRIMARY KEY, user_id INT NOT NULL REFERENCES users(user_id), order_date DATE NOT NULL, amount NUMERIC(10,2) NOT NULL, category TEXT NOT NULL);
CREATE TABLE events (user_id INT NOT NULL REFERENCES users(user_id), event_date DATE NOT NULL, event TEXT NOT NULL, platform TEXT NOT NULL);`,
    seeds: {
      default: `
INSERT INTO users VALUES
 (1,'2025-12-20','Hyderabad','organic'),(2,'2025-12-28','Mumbai','referral'),(3,'2026-01-25','Hyderabad','paid'),
 (4,'2026-02-01','Bengaluru','organic'),(5,'2026-02-05','Mumbai','paid'),(6,'2026-03-01','Pune','organic');
INSERT INTO orders VALUES
 (1,1,'2026-01-01',250,'grocery'),(2,1,'2026-01-02',120,'snacks'),(3,1,'2026-01-02',80,'grocery'),
 (4,1,'2026-01-03',300,'grocery'),(5,1,'2026-01-05',150,'pharma'),(6,1,'2026-01-06',90,'snacks'),
 (7,2,'2026-01-10',400,'grocery'),(8,2,'2026-01-12',220,'grocery'),(9,2,'2026-01-14',180,'pharma'),
 (10,3,'2026-01-30',500,'grocery'),(11,3,'2026-01-31',260,'snacks'),(12,3,'2026-02-01',140,'grocery'),
 (13,3,'2026-02-02',310,'grocery'),(14,4,'2026-02-10',275,'pharma'),(15,2,'2026-02-15',350,'grocery'),
 (16,1,'2026-02-20',200,'grocery'),(17,3,'2026-03-03',450,'grocery'),(18,4,'2026-03-04',125,'snacks'),
 (19,2,'2026-03-10',600,'grocery'),(20,1,'2026-03-11',330,'pharma'),(21,4,'2026-03-12',210,'grocery');
INSERT INTO events VALUES
 (1,'2026-01-01','app_open','android'),(1,'2026-01-01','search','android'),(1,'2026-01-02','app_open','android'),
 (1,'2026-01-03','add_to_cart','android'),(2,'2026-01-01','app_open','ios'),(2,'2026-01-03','app_open','ios'),
 (3,'2026-01-02','app_open','android'),(3,'2026-01-03','search','android'),(3,'2026-01-03','add_to_cart','android'),
 (4,'2026-01-02','app_open','ios'),(5,'2026-01-03','app_open','android'),(5,'2026-01-04','app_open','android'),
 (6,'2026-01-04','app_open','ios');`,
      edge: `
INSERT INTO users VALUES
 (10,'2025-12-01','Delhi','organic'),(11,'2025-12-15','Delhi','paid'),(12,'2026-01-02','Chennai','referral'),
 (13,'2026-01-09','Chennai','organic'),(14,'2026-02-11','Kolkata','paid');
INSERT INTO orders VALUES
 (100,10,'2025-12-30',100,'grocery'),(101,10,'2025-12-31',100,'grocery'),(102,10,'2026-01-01',50,'snacks'),
 (103,10,'2026-01-02',70,'snacks'),(104,10,'2026-01-03',90,'grocery'),
 (105,11,'2026-01-05',200,'pharma'),(106,11,'2026-01-05',300,'grocery'),(107,11,'2026-01-05',10,'snacks'),
 (108,12,'2026-01-07',40,'grocery'),(109,12,'2026-01-08',60,'grocery'),(110,12,'2026-01-10',80,'snacks'),
 (111,12,'2026-01-11',20,'snacks'),(112,12,'2026-02-27',500,'grocery'),(113,12,'2026-02-28',500,'grocery'),
 (114,12,'2026-03-01',500,'grocery');
INSERT INTO events VALUES
 (10,'2026-01-01','app_open','android'),(10,'2026-01-01','app_open','android'),(10,'2026-01-02','search','android'),
 (11,'2026-01-01','app_open','ios'),(12,'2026-01-05','app_open','android'),(12,'2026-01-07','app_open','android'),
 (13,'2026-01-05','app_open','ios'),(13,'2026-01-06','add_to_cart','ios'),(13,'2026-01-06','search','ios'),
 (14,'2026-01-06','app_open','android');`,
    },
  },
  {
    id: "hr",
    label: "Employees",
    tables: [
      {
        name: "employees",
        description: "One row per employee. manager_id points at another employee; NULL for department heads.",
        columns: [
          { name: "emp_id", type: "INT", key: "PK" },
          { name: "name", type: "TEXT" },
          { name: "dept", type: "TEXT" },
          { name: "salary", type: "INT", note: "annual, ₹" },
          { name: "manager_id", type: "INT", key: "FK", ref: "employees.emp_id", note: "nullable" },
        ],
      },
    ],
    ddl: `
CREATE TABLE employees (emp_id INT PRIMARY KEY, name TEXT NOT NULL, dept TEXT NOT NULL, salary INT NOT NULL, manager_id INT REFERENCES employees(emp_id));`,
    seeds: {
      default: `
INSERT INTO employees VALUES
 (1,'Asha','Engineering',1800000,NULL),(2,'Bharat','Engineering',1500000,1),(3,'Chitra','Engineering',1500000,1),
 (4,'Dev','Engineering',1200000,1),(5,'Esha','Engineering',1100000,2),(13,'Mohan','Engineering',1900000,2),
 (6,'Farhan','Sales',900000,NULL),(7,'Gita','Sales',950000,6),(8,'Hari','Sales',700000,6),
 (9,'Isha','Analytics',1300000,NULL),(10,'Jay','Analytics',1300000,9),(11,'Kiran','Analytics',1000000,9),
 (12,'Lata','Analytics',850000,9);`,
      edge: `
INSERT INTO employees VALUES
 (1,'Noor','Ops',500000,NULL),(2,'Omar','Ops',500000,1),(3,'Priya','Ops',500000,1),(4,'Qadir','Ops',500000,2),
 (5,'Ravi','Legal',2000000,NULL),
 (6,'Sara','Design',800000,NULL),(7,'Tara','Design',800001,6),(8,'Uma','Design',799999,6),(9,'Vik','Design',600000,7),
 (10,'Wren','Design',600000,7);`,
    },
  },
  {
    id: "shop",
    label: "Online store",
    tables: [
      {
        name: "customers",
        description: "One row per customer. city can be NULL. Some customers have no orders.",
        columns: [
          { name: "customer_id", type: "INT", key: "PK" },
          { name: "name", type: "TEXT" },
          { name: "city", type: "TEXT", note: "nullable" },
          { name: "signup_date", type: "DATE" },
          { name: "segment", type: "TEXT", note: "retail | business" },
        ],
      },
      {
        name: "products",
        description: "Catalogue. Some products have never been ordered.",
        columns: [
          { name: "product_id", type: "INT", key: "PK" },
          { name: "name", type: "TEXT" },
          { name: "category", type: "TEXT", note: "Electronics | Furniture | Stationery" },
          { name: "price", type: "INT", note: "list price, ₹" },
        ],
      },
      {
        name: "orders",
        description: "One row per order.",
        columns: [
          { name: "order_id", type: "INT", key: "PK" },
          { name: "customer_id", type: "INT", key: "FK", ref: "customers.customer_id" },
          { name: "order_date", type: "DATE" },
          { name: "status", type: "TEXT", note: "delivered | cancelled | returned" },
        ],
      },
      {
        name: "order_items",
        description: "Lines of an order. Revenue of a line = qty × unit_price (the price actually charged).",
        columns: [
          { name: "order_id", type: "INT", key: "FK", ref: "orders.order_id" },
          { name: "product_id", type: "INT", key: "FK", ref: "products.product_id" },
          { name: "qty", type: "INT" },
          { name: "unit_price", type: "INT", note: "₹ charged per unit" },
        ],
      },
    ],
    ddl: `
CREATE TABLE customers (customer_id INT PRIMARY KEY, name TEXT NOT NULL, city TEXT, signup_date DATE NOT NULL, segment TEXT NOT NULL);
CREATE TABLE products (product_id INT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price INT NOT NULL);
CREATE TABLE orders (order_id INT PRIMARY KEY, customer_id INT NOT NULL REFERENCES customers(customer_id), order_date DATE NOT NULL, status TEXT NOT NULL);
CREATE TABLE order_items (order_id INT NOT NULL REFERENCES orders(order_id), product_id INT NOT NULL REFERENCES products(product_id), qty INT NOT NULL, unit_price INT NOT NULL);`,
    seeds: {
      default: `
INSERT INTO customers VALUES
 (1,'Aarav','Hyderabad','2025-01-10','retail'),(2,'Bhavna','Mumbai','2025-02-14','retail'),(3,'Chirag','Mumbai','2025-03-01','business'),
 (4,'Divya','Bengaluru','2025-03-20','retail'),(5,'Eshan',NULL,'2025-04-05','business'),(6,'Farah','Delhi','2025-05-11','retail'),
 (7,'Gaurav','Hyderabad','2025-06-02','retail'),(8,'Hema','Pune','2025-06-15','business');
INSERT INTO products VALUES
 (1,'Laptop','Electronics',60000),(2,'Phone','Electronics',30000),(3,'Headphones','Electronics',2000),(4,'Desk','Furniture',8000),
 (5,'Chair','Furniture',5000),(6,'Notebook','Stationery',100),(7,'Pen','Stationery',20),(8,'Monitor','Electronics',12000);
INSERT INTO orders VALUES
 (1,1,'2025-07-01','delivered'),(2,1,'2025-07-15','delivered'),(3,2,'2025-07-03','delivered'),(4,3,'2025-07-20','cancelled'),
 (5,3,'2025-08-02','delivered'),(6,4,'2025-08-05','delivered'),(7,2,'2025-08-18','returned'),(8,5,'2025-08-21','delivered'),
 (9,1,'2025-09-01','delivered'),(10,6,'2025-09-09','delivered'),(11,3,'2025-09-12','delivered'),(12,8,'2025-09-25','returned'),
 (13,2,'2025-10-02','delivered'),(14,4,'2025-10-10','cancelled'),(15,6,'2025-10-15','delivered'),(16,1,'2025-10-28','delivered');
INSERT INTO order_items VALUES
 (1,1,1,60000),(1,3,2,2000),(2,6,10,100),(2,7,20,20),(3,2,1,30000),(4,4,2,8000),(5,4,1,8000),(5,5,4,5000),
 (6,3,1,2000),(6,6,5,100),(7,2,1,28000),(8,1,2,58000),(9,5,1,5000),(10,2,1,30000),(10,3,1,1800),(11,7,100,18),
 (12,4,3,7500),(12,5,6,4800),(13,3,2,2000),(14,1,1,60000),(15,6,20,90),(16,2,1,29000),(16,6,2,100);`,
      edge: `
INSERT INTO customers VALUES
 (1,'Ira','Chennai','2025-01-01','retail'),(2,'Jai','Chennai','2025-01-01','retail'),(3,'Kai',NULL,'2025-02-01','business'),(4,'Lia','Kochi','2025-03-01','retail');
INSERT INTO products VALUES (1,'Tablet','Electronics',20000),(2,'Sofa','Furniture',20000),(3,'Lamp','Furniture',1500),(4,'Glue','Stationery',50);
INSERT INTO orders VALUES
 (1,1,'2025-12-30','delivered'),(2,1,'2025-12-31','delivered'),(3,2,'2026-01-01','delivered'),(4,2,'2026-01-01','cancelled'),
 (5,3,'2026-01-15','returned'),(6,1,'2026-02-01','delivered');
INSERT INTO order_items VALUES (1,1,1,20000),(2,2,1,20000),(3,1,1,20000),(3,3,2,1500),(4,4,10,50),(5,2,1,20000),(6,3,1,1500),(6,4,4,50);`,
    },
  },
];

export const datasetById = (id: string) => DATASETS.find((d) => d.id === id)!;
