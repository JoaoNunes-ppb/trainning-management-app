CREATE TABLE coach (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE athlete (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    coach_id UUID NOT NULL,
    notes TEXT,
    CONSTRAINT fk_athlete_coach FOREIGN KEY (coach_id) REFERENCES coach(id) ON DELETE CASCADE
);

CREATE INDEX idx_athlete_coach_id ON athlete(coach_id);

CREATE TABLE exercise (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    has_sets BOOLEAN NOT NULL DEFAULT false,
    has_reps BOOLEAN NOT NULL DEFAULT false,
    has_weight BOOLEAN NOT NULL DEFAULT false,
    has_distance BOOLEAN NOT NULL DEFAULT false,
    has_time BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE workout (
    id UUID PRIMARY KEY,
    athlete_id UUID NOT NULL,
    label VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    CONSTRAINT fk_workout_athlete FOREIGN KEY (athlete_id) REFERENCES athlete(id) ON DELETE CASCADE
);

CREATE INDEX idx_workout_athlete_date ON workout(athlete_id, date);

CREATE TABLE workout_exercise (
    id UUID PRIMARY KEY,
    workout_id UUID NOT NULL,
    exercise_id UUID NOT NULL,
    order_index INT NOT NULL,
    notes TEXT,
    sets_expected INT,
    reps_expected INT,
    weight_expected DECIMAL(10,2),
    distance_expected DECIMAL(10,2),
    time_expected INT,
    CONSTRAINT fk_we_workout FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
    CONSTRAINT fk_we_exercise FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE RESTRICT,
    CONSTRAINT uq_we_order UNIQUE (workout_id, order_index)
);

CREATE INDEX idx_we_workout_id ON workout_exercise(workout_id);

CREATE TABLE exercise_result (
    id UUID PRIMARY KEY,
    workout_exercise_id UUID NOT NULL UNIQUE,
    sets INT,
    reps INT,
    weight DECIMAL(10,2),
    distance DECIMAL(10,2),
    time INT,
    notes TEXT,
    CONSTRAINT fk_er_workout_exercise FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercise(id) ON DELETE CASCADE
);
