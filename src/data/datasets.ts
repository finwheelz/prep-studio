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
];

export const datasetById = (id: string) => DATASETS.find((d) => d.id === id)!;
