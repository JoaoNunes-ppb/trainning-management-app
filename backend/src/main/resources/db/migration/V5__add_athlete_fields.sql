ALTER TABLE athlete ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE athlete ADD COLUMN weight_kg DECIMAL(5,1);
ALTER TABLE athlete ADD COLUMN height_cm INT;

-- Update seed athletes with sample data
UPDATE athlete SET email = 'ze.manel@email.com', weight_kg = 75.0, height_cm = 178 WHERE name = 'Zé Manel';
UPDATE athlete SET email = 'to.silva@email.com', weight_kg = 82.5, height_cm = 183 WHERE name = 'Tó Silva';
UPDATE athlete SET email = 'james.lee@email.com', weight_kg = 70.0, height_cm = 172 WHERE name = 'James Lee';
