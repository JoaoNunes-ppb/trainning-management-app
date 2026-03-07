package com.athletemanager.workout

import com.athletemanager.athlete.Athlete
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@Entity
@Table(name = "workout")
class Workout(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(nullable = false)
    var label: String = "",

    @Column(nullable = false)
    var date: LocalDate = LocalDate.now(),

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(nullable = false)
    var status: String = "PENDING",

    @Column(name = "scheduled_time")
    var scheduledTime: LocalTime? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "athlete_id", nullable = false)
    var athlete: Athlete = Athlete()
)
