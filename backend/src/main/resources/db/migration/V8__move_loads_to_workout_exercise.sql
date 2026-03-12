ALTER TABLE workout_exercise
  ADD COLUMN concentric_load NUMERIC(10,2),
  ADD COLUMN eccentric_load NUMERIC(10,2),
  ADD COLUMN isometric_load NUMERIC(10,2);

ALTER TABLE exercise
  DROP COLUMN concentric_load,
  DROP COLUMN eccentric_load,
  DROP COLUMN isometric_load;
