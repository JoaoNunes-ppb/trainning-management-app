ALTER TABLE exercise
  ADD COLUMN modality VARCHAR(10) NOT NULL DEFAULT 'LIVRE',
  ADD COLUMN kineo_type VARCHAR(30),
  ADD COLUMN concentric_load NUMERIC(10,2),
  ADD COLUMN eccentric_load NUMERIC(10,2),
  ADD COLUMN isometric_load NUMERIC(10,2);
