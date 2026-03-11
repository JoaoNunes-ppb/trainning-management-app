package com.athletemanager.athlete

import com.athletemanager.coach.Coach
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "athlete")
class Athlete(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(nullable = false)
    var name: String = "",

    @Column(name = "date_of_birth")
    var dateOfBirth: LocalDate? = null,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(nullable = false)
    var email: String = "",

    @Column(name = "weight_kg")
    var weightKg: BigDecimal? = null,

    @Column(name = "height_cm")
    var heightCm: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    var coach: Coach = Coach()
)
