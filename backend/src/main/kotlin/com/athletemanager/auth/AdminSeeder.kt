package com.athletemanager.auth

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

@Component
class AdminSeeder(
    private val appUserRepository: AppUserRepository,
    private val passwordEncoder: PasswordEncoder,
    @Value("\${app.admin.username}") private val adminUsername: String,
    @Value("\${app.admin.password}") private val adminPassword: String
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(AdminSeeder::class.java)

    override fun run(args: ApplicationArguments?) {
        if (appUserRepository.count() > 0) {
            log.info("Users already exist, skipping admin seed")
            return
        }

        if (adminUsername == "admin" && adminPassword == "admin") {
            log.warn("Creating admin user with DEFAULT credentials — change them in production!")
        }

        val admin = AppUser(
            username = adminUsername,
            passwordHash = passwordEncoder.encode(adminPassword),
            role = Role.ADMIN,
            enabled = true
        )

        appUserRepository.save(admin)
        log.info("Admin user '{}' created successfully", adminUsername)
    }
}
