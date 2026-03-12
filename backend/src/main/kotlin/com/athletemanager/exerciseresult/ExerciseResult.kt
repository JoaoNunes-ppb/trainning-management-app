package com.athletemanager.exerciseresult

import com.athletemanager.workoutexercise.WorkoutExercise
import jakarta.persistence.*
import java.math.BigDecimal
import java.util.UUID

@Entity
@Table(name = "exercise_result")
class ExerciseResult(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    var sets: Int? = null,

    var reps: Int? = null,

    @Column(precision = 10, scale = 2)
    var weight: BigDecimal? = null,

    @Column(precision = 10, scale = 2)
    var distance: BigDecimal? = null,

    var time: Int? = null,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "concentric_load", columnDefinition = "NUMERIC(10,2)")
    var concentricLoad: BigDecimal? = null,

    @Column(name = "eccentric_load", columnDefinition = "NUMERIC(10,2)")
    var eccentricLoad: BigDecimal? = null,

    @Column(name = "isometric_load", columnDefinition = "NUMERIC(10,2)")
    var isometricLoad: BigDecimal? = null,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_exercise_id", nullable = false, unique = true)
    var workoutExercise: WorkoutExercise = WorkoutExercise()
)
