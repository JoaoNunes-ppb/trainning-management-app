package com.athletemanager.auth

import com.athletemanager.config.AuditEventLogger
import io.mockk.*
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.DisabledException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.UUID

@ExtendWith(MockKExtension::class)
class AuthControllerTest {

    @MockK
    private lateinit var authenticationManager: AuthenticationManager

    @MockK
    private lateinit var jwtService: JwtService

    @MockK
    private lateinit var appUserRepository: AppUserRepository

    @MockK
    private lateinit var passwordEncoder: PasswordEncoder

    @MockK(relaxed = true)
    private lateinit var auditEventLogger: AuditEventLogger

    private val controller by lazy {
        AuthController(authenticationManager, jwtService, appUserRepository, passwordEncoder, auditEventLogger)
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    private fun setAuthenticatedUser(username: String) {
        val auth = UsernamePasswordAuthenticationToken(username, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun createAppUser(username: String = "admin", passwordHash: String = "hashed") = AppUser(
        id = UUID.randomUUID(),
        username = username,
        passwordHash = passwordHash,
        role = Role.ADMIN,
        enabled = true
    )

    @Test
    fun `login returns token on successful authentication`() {
        val user = createAppUser(username = "admin")
        val request = LoginRequest(username = "admin", password = "password")
        val auth = mockk<Authentication>()

        every {
            authenticationManager.authenticate(any<UsernamePasswordAuthenticationToken>())
        } returns auth
        every { appUserRepository.findByUsername("admin") } returns user
        every { jwtService.generateToken(user) } returns "jwt-token"

        val response = controller.login(request)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body!!.token).isEqualTo("jwt-token")
        assertThat(response.body!!.username).isEqualTo("admin")
    }

    @Test
    fun `login returns 401 on bad credentials`() {
        val request = LoginRequest(username = "admin", password = "wrong")

        every {
            authenticationManager.authenticate(any<UsernamePasswordAuthenticationToken>())
        } throws BadCredentialsException("Bad credentials")

        val response = controller.login(request)

        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

    @Test
    fun `login returns 401 when user is disabled`() {
        val request = LoginRequest(username = "disabled", password = "password")

        every {
            authenticationManager.authenticate(any<UsernamePasswordAuthenticationToken>())
        } throws DisabledException("User is disabled")

        val response = controller.login(request)

        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

    @Test
    fun `login returns 401 when user not found in repository`() {
        val request = LoginRequest(username = "ghost", password = "password")
        val auth = mockk<Authentication>()

        every {
            authenticationManager.authenticate(any<UsernamePasswordAuthenticationToken>())
        } returns auth
        every { appUserRepository.findByUsername("ghost") } returns null

        val response = controller.login(request)

        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

    @Test
    fun `changePassword succeeds with correct old password`() {
        val user = createAppUser(passwordHash = "encoded-old")
        setAuthenticatedUser("admin")

        every { appUserRepository.findByUsername("admin") } returns user
        every { passwordEncoder.matches("oldpass123", "encoded-old") } returns true
        every { passwordEncoder.encode("newpass123") } returns "encoded-new"
        every { appUserRepository.save(any<AppUser>()) } answers { firstArg() }

        val request = ChangePasswordRequest(oldPassword = "oldpass123", newPassword = "newpass123")
        val response = controller.changePassword(request)

        assertThat(response.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        assertThat(user.passwordHash).isEqualTo("encoded-new")
        verify { appUserRepository.save(user) }
    }

    @Test
    fun `changePassword returns 400 when old password is wrong`() {
        val user = createAppUser(passwordHash = "encoded-old")
        setAuthenticatedUser("admin")

        every { appUserRepository.findByUsername("admin") } returns user
        every { passwordEncoder.matches("wrongpass", "encoded-old") } returns false

        val request = ChangePasswordRequest(oldPassword = "wrongpass", newPassword = "newpass123")
        val response = controller.changePassword(request)

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        verify(exactly = 0) { appUserRepository.save(any()) }
    }

    @Test
    fun `changePassword returns 400 when new password is too short`() {
        setAuthenticatedUser("admin")

        val request = ChangePasswordRequest(oldPassword = "oldpass123", newPassword = "short")
        val response = controller.changePassword(request)

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        verify(exactly = 0) { appUserRepository.save(any()) }
    }
}
