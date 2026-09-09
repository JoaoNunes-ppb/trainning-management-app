package com.athletemanager.config

import com.fasterxml.jackson.databind.ObjectMapper
import io.mockk.every
import io.mockk.mockk
import jakarta.servlet.FilterChain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder

class RateLimitFilterTest {

    private val objectMapper = ObjectMapper()
    private lateinit var filter: RateLimitFilter
    private lateinit var filterChain: FilterChain

    @BeforeEach
    fun setUp() {
        filter = RateLimitFilter(objectMapper)
        filterChain = mockk(relaxed = true)
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `login endpoint allows 5 requests per IP then returns 429`() {
        repeat(5) { i ->
            val request = MockHttpServletRequest("POST", "/api/auth/login")
            request.remoteAddr = "192.168.1.1"
            val response = MockHttpServletResponse()

            filter.doFilter(request, response, filterChain)

            assertThat(response.status).withFailMessage("Request ${i + 1} should succeed").isEqualTo(200)
        }

        val request = MockHttpServletRequest("POST", "/api/auth/login")
        request.remoteAddr = "192.168.1.1"
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        assertThat(response.status).isEqualTo(429)
        val body = objectMapper.readValue(response.contentAsString, Map::class.java)
        assertThat(body["status"]).isEqualTo(429)
        assertThat(body["error"]).isEqualTo("Too Many Requests")
    }

    @Test
    fun `login rate limit is per IP - different IPs have separate limits`() {
        repeat(5) {
            val request = MockHttpServletRequest("POST", "/api/auth/login")
            request.remoteAddr = "10.0.0.1"
            val response = MockHttpServletResponse()
            filter.doFilter(request, response, filterChain)
        }

        val request = MockHttpServletRequest("POST", "/api/auth/login")
        request.remoteAddr = "10.0.0.2"
        val response = MockHttpServletResponse()
        filter.doFilter(request, response, filterChain)

        assertThat(response.status).isEqualTo(200)
    }

    @Test
    fun `API endpoint allows 100 requests per user then returns 429`() {
        val auth = UsernamePasswordAuthenticationToken("testuser", null, emptyList())
        SecurityContextHolder.getContext().authentication = auth

        repeat(100) { i ->
            val request = MockHttpServletRequest("GET", "/api/coaches")
            val response = MockHttpServletResponse()

            filter.doFilter(request, response, filterChain)

            assertThat(response.status).withFailMessage("Request ${i + 1} should succeed").isEqualTo(200)
        }

        val request = MockHttpServletRequest("GET", "/api/coaches")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        assertThat(response.status).isEqualTo(429)
    }

    @Test
    fun `unauthenticated non-login API requests are not rate limited`() {
        repeat(150) {
            val request = MockHttpServletRequest("GET", "/api/coaches")
            val response = MockHttpServletResponse()
            filter.doFilter(request, response, filterChain)
            assertThat(response.status).isEqualTo(200)
        }
    }

    @Test
    fun `login uses X-Forwarded-For header for IP extraction`() {
        repeat(5) {
            val request = MockHttpServletRequest("POST", "/api/auth/login")
            request.addHeader("X-Forwarded-For", "203.0.113.50, 70.41.3.18")
            request.remoteAddr = "127.0.0.1"
            val response = MockHttpServletResponse()
            filter.doFilter(request, response, filterChain)
        }

        val request = MockHttpServletRequest("POST", "/api/auth/login")
        request.addHeader("X-Forwarded-For", "203.0.113.50")
        request.remoteAddr = "127.0.0.1"
        val response = MockHttpServletResponse()
        filter.doFilter(request, response, filterChain)

        assertThat(response.status).isEqualTo(429)
    }

    @Test
    fun `429 response has correct JSON body`() {
        repeat(5) {
            val request = MockHttpServletRequest("POST", "/api/auth/login")
            request.remoteAddr = "1.2.3.4"
            filter.doFilter(request, MockHttpServletResponse(), filterChain)
        }

        val request = MockHttpServletRequest("POST", "/api/auth/login")
        request.remoteAddr = "1.2.3.4"
        val response = MockHttpServletResponse()
        filter.doFilter(request, response, filterChain)

        assertThat(response.status).isEqualTo(429)
        assertThat(response.contentType).isEqualTo("application/json")

        val body = objectMapper.readValue(response.contentAsString, Map::class.java)
        assertThat(body["status"]).isEqualTo(429)
        assertThat(body["error"]).isEqualTo("Too Many Requests")
        assertThat(body["message"]).isEqualTo("Rate limit exceeded. Please try again later.")
    }
}
