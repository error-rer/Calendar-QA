-- Migration 0002: per-assignment purpose
--
-- Purpose used to live only on `orders`, frozen at creation time, so editing
-- an appointment's Purpose (Customer type) never persisted anywhere - matches
-- the denormalization already applied to site1/customer/endCustomer/etc. in
-- migration 0001.

ALTER TABLE assignments ADD COLUMN purpose TEXT NOT NULL DEFAULT '';
