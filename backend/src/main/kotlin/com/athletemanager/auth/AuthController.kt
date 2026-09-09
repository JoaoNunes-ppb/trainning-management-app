package com.athletemanager.auth

import com.athletemanager.config.AuditEventLogger
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.DisabledException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService,
    private val appUserRepository: AppUserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val auditEventLogger: AuditEventLogger
) {

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<LoginResponse> {
        try {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.username, request.password)
            )
        } catch (e: BadCredentialsException) {
            auditEventLogger.logEvent("LOGIN_FAILURE", "User", details = "username=${request.username}")
            return ResponseEntity.status(401).build()
        } catch (e: DisabledException) {
            auditEventLogger.logEvent("LOGIN_FAILURE", "User", details = "username=${request.username} reason=disabled")
            return ResponseEntity.status(401).build()
        }

        val user = appUserRepository.findByUsername(request.username)
            ?: return ResponseEntity.status(401).build()

        val token = jwtService.generateToken(user)
        auditEventLogger.logEvent("LOGIN_SUCCESS", "User", user.id, "username=${user.username}")

        return ResponseEntity.ok(
            LoginResponse(
                token = token,
                username = user.username
            )
        )
    }

    @GetMapping("/me")
    fun me(): ResponseEntity<MeResponse> {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: return ResponseEntity.status(401).build()

        val username = authentication.name
        val user = appUserRepository.findByUsername(username)
            ?: return ResponseEntity.status(401).build()

        return ResponseEntity.ok(
            MeResponse(username = user.username)
        )
    }

    @PutMapping("/change-password")
    fun changePassword(@Valid @RequestBody request: ChangePasswordRequest): ResponseEntity<Void> {
        if (request.newPassword.length < 8) {
            return ResponseEntity.badRequest().build()
        }

        val authentication = SecurityContextHolder.getContext().authentication
            ?: return ResponseEntity.status(401).build()

        val user = appUserRepository.findByUsername(authentication.name)
            ?: return ResponseEntity.status(401).build()

        if (!passwordEncoder.matches(request.oldPassword, user.passwordHash)) {
            return ResponseEntity.badRequest().build()
        }

        user.passwordHash = passwordEncoder.encode(request.newPassword)
        user.updatedAt = java.time.Instant.now()
        appUserRepository.save(user)

        return ResponseEntity.noContent().build()
    }
}
