ALTER TABLE exercise DROP CONSTRAINT exercise_name_key;

ALTER TABLE exercise
  ADD CONSTRAINT uq_exercise_name_modality_kineo
  UNIQUE (name, modality, kineo_type);
