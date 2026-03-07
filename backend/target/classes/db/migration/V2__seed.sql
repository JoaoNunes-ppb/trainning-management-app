-- Coaches
INSERT INTO coach (id, name) VALUES
    ('a1b2c3d4-0001-0000-0000-000000000001', 'Coach Nunes'),
    ('a1b2c3d4-0001-0000-0000-000000000002', 'Coach Pires');

-- Athletes (Coach Mike)
INSERT INTO athlete (id, name, date_of_birth, coach_id, notes) VALUES
    ('a1b2c3d4-0002-0000-0000-000000000001', 'Zé Manel', '1995-03-15', 'a1b2c3d4-0001-0000-0000-000000000001', 'Marathon runner'),
    ('a1b2c3d4-0002-0000-0000-000000000002', 'Tó Silva', '1998-07-22', 'a1b2c3d4-0001-0000-0000-000000000001', NULL);

-- Athletes (Coach Sarah)
INSERT INTO athlete (id, name, date_of_birth, coach_id, notes) VALUES
    ('a1b2c3d4-0002-0000-0000-000000000003', 'James Lee', '2000-01-10', 'a1b2c3d4-0001-0000-0000-000000000002', 'Beginner');

-- Exercises
INSERT INTO exercise (id, name, description, has_sets, has_reps, has_weight, has_distance, has_time) VALUES
    ('a1b2c3d4-0003-0000-0000-000000000001', 'Bench Press', 'Flat barbell bench press', true, true, true, false, false),
    ('a1b2c3d4-0003-0000-0000-000000000002', 'Squat', 'Barbell back squat', true, true, true, false, false),
    ('a1b2c3d4-0003-0000-0000-000000000003', '5K Run', 'Outdoor 5 kilometer run', false, false, false, true, true),
    ('a1b2c3d4-0003-0000-0000-000000000004', 'Plank', 'Static hold plank', true, false, false, false, true);
