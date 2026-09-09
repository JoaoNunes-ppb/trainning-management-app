package com.athletemanager.auth

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import java.util.UUID

class JwtServiceTest {

    private lateinit var jwtService: JwtService

    private val secret = "test-secret-key-that-is-at-least-32-characters-long!!"
    private val expirationMs = 86400000L

    @BeforeEach
    fun setUp() {
        jwtService = JwtService(secret, expirationMs)
    }

    private fun createAppUser(username: String = "testuser") = AppUser(
        id = UUID.randomUUID(),
        username = username,
        passwordHash = "hashed",
        role = Role.ADMIN,
        enabled = true
    )

    private fun createUserDetails(username: String = "testuser") =
        User.builder()
            .username(username)
            .password("hashed")
            .authorities(SimpleGrantedAuthority("ROLE_ADMIN"))
            .build()

    @Test
    fun `generateToken creates a valid token`() {
        val user = createAppUser()
        val token = jwtService.generateToken(user)

        assertThat(token).isNotBlank()
        assertThat(token.split(".")).hasSize(3)
    }

    @Test
    fun `extractUsername returns correct username`() {
        val user = createAppUser(username = "admin1")
        val token = jwtService.generateToken(user)

        val username = jwtService.extractUsername(token)

        assertThat(username).isEqualTo("admin1")
    }

    @Test
    fun `extractRole returns correct role`() {
        val user = createAppUser()
        val token = jwtService.generateToken(user)

        val role = jwtService.extractRole(token)

        assertThat(role).isEqualTo("ADMIN")
    }

    @Test
    fun `isTokenValid returns true for valid token and matching user`() {
        val user = createAppUser(username = "admin1")
        val token = jwtService.generateToken(user)
        val userDetails = createUserDetails(username = "admin1")

        val valid = jwtService.isTokenValid(token, userDetails)

        assertThat(valid).isTrue()
    }

    @Test
    fun `isTokenValid returns false for mismatched username`() {
        val user = createAppUser(username = "admin1")
        val token = jwtService.generateToken(user)
        val userDetails = createUserDetails(username = "admin2")

        val valid = jwtService.isTokenValid(token, userDetails)

        assertThat(valid).isFalse()
    }

    @Test
    fun `isTokenValid returns false for expired token`() {
        val expiredService = JwtService(secret, -1000)
        val user = createAppUser(username = "admin1")
        val token = expiredService.generateToken(user)
        val userDetails = createUserDetails(username = "admin1")

        val valid = jwtService.isTokenValid(token, userDetails)

        assertThat(valid).isFalse()
    }

    @Test
    fun `isTokenValid returns false for tampered token`() {
        val user = createAppUser(username = "admin1")
        val token = jwtService.generateToken(user)
        val tampered = token.dropLast(5) + "XXXXX"
        val userDetails = createUserDetails(username = "admin1")

        val valid = jwtService.isTokenValid(tampered, userDetails)

        assertThat(valid).isFalse()
    }

    @Test
    fun `extractUsername returns null for invalid token`() {
        val username = jwtService.extractUsername("invalid.token.here")

        assertThat(username).isNull()
    }
}
