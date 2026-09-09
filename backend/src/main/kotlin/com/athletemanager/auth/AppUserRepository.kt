package com.athletemanager.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface AppUserRepository : JpaRepository<AppUser, UUID> {
    fun findByUsername(username: String): AppUser?
    fun existsByUsername(username: String): Boolean
}
