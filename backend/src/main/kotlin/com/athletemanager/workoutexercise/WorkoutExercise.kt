package com.athletemanager.workoutexercise

import com.athletemanager.exercise.Exercise
import com.athletemanager.workout.Workout
import jakarta.persistence.*
import java.math.BigDecimal
import java.util.UUID

@Entity
@Table(name = "workout_exercise")
class WorkoutExercise(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "order_index", nullable = false)
    var orderIndex: Int = 0,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "sets_expected")
    var setsExpected: Int? = null,

    @Column(name = "reps_expected")
    var repsExpected: Int? = null,

    @Column(name = "weight_expected", precision = 10, scale = 2)
    var weightExpected: BigDecimal? = null,

    @Column(name = "distance_expected", precision = 10, scale = 2)
    var distanceExpected: BigDecimal? = null,

    @Column(name = "time_expected")
    var timeExpected: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id", nullable = false)
    var workout: Workout = Workout(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    var exercise: Exercise = Exercise()
)
