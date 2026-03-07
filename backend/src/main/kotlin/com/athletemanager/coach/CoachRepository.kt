package com.athletemanager.coach

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CoachRepository : JpaRepository<Coach, UUID>
