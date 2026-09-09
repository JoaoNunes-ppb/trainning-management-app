package com.athletemanager.config

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap

@Component
class RateLimitFilter(
    private val objectMapper: ObjectMapper
) : OncePerRequestFilter() {

    private val loginBuckets = ConcurrentHashMap<String, Bucket>()
    private val apiBuckets = ConcurrentHashMap<String, Bucket>()

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val isLoginRequest = request.method == "POST" && request.requestURI == "/api/auth/login"

        if (isLoginRequest) {
            val clientIp = extractClientIp(request)
            val bucket = loginBuckets.computeIfAbsent(clientIp) { createLoginBucket() }

            if (!bucket.tryConsume(1)) {
                writeRateLimitResponse(response)
                return
            }
        } else if (request.requestURI.startsWith("/api/")) {
            val auth = SecurityContextHolder.getContext().authentication
            if (auth != null && auth.isAuthenticated && auth.name != "anonymousUser") {
                val bucket = apiBuckets.computeIfAbsent(auth.name) { createApiBucket() }

                if (!bucket.tryConsume(1)) {
                    writeRateLimitResponse(response)
                    return
                }
            }
        }

        filterChain.doFilter(request, response)
    }

    private fun createLoginBucket(): Bucket =
        Bucket.builder()
            .addLimit(Bandwidth.simple(5, Duration.ofMinutes(1)))
            .build()

    private fun createApiBucket(): Bucket =
        Bucket.builder()
            .addLimit(Bandwidth.simple(100, Duration.ofMinutes(1)))
            .build()

    private fun extractClientIp(request: HttpServletRequest): String =
        request.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim()
            ?: request.remoteAddr

    private fun writeRateLimitResponse(response: HttpServletResponse) {
        response.status = HttpStatus.TOO_MANY_REQUESTS.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        val body = mapOf(
            "status" to 429,
            "error" to "Too Many Requests",
            "message" to "Rate limit exceeded. Please try again later."
        )
        response.writer.write(objectMapper.writeValueAsString(body))
    }

    fun resetBuckets() {
        loginBuckets.clear()
        apiBuckets.clear()
    }
}
