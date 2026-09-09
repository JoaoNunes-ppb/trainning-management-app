package com.athletemanager.auth

import jakarta.validation.constraints.NotBlank

data class LoginRequest(
    @field:NotBlank
    val username: String,

    @field:NotBlank
    val password: String
)

data class LoginResponse(
    val token: String,
    val username: String
)

data class MeResponse(
    val username: String
)

data class ChangePasswordRequest(
    @field:NotBlank
    val oldPassword: String,

    @field:NotBlank
    val newPassword: String
)
