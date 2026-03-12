package com.athletemanager.exercise

import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(
    name = "exercise",
    uniqueConstraints = [UniqueConstraint(columnNames = ["name", "modality", "kineo_type"])]
)
class Exercise(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(nullable = false)
    var name: String = "",

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "has_sets", nullable = false)
    var hasSets: Boolean = false,

    @Column(name = "has_reps", nullable = false)
    var hasReps: Boolean = false,

    @Column(name = "has_weight", nullable = false)
    var hasWeight: Boolean = false,

    @Column(name = "has_distance", nullable = false)
    var hasDistance: Boolean = false,

    @Column(name = "has_time", nullable = false)
    var hasTime: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var modality: Modality = Modality.LIVRE,

    @Enumerated(EnumType.STRING)
    @Column(name = "kineo_type")
    var kineoType: KineoType? = null
)
