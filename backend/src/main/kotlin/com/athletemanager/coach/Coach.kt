package com.athletemanager.coach

import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(name = "coach")
class Coach(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(nullable = false)
    var name: String = ""
)
