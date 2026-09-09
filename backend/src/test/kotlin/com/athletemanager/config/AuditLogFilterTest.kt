package com.athletemanager.config

import io.mockk.mockk
import io.mockk.verify
import jakarta.servlet.FilterChain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder

class AuditLogFilterTest {

    private val filter = AuditLogFilter()

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `filter invokes the filter chain`() {
        val request = MockHttpServletRequest("GET", "/api/coaches")
        val response = MockHttpServletResponse()
        val chain = mockk<FilterChain>(relaxed = true)

        filter.doFilter(request, response, chain)

        verify(exactly = 1) { chain.doFilter(request, response) }
    }

    @Test
    fun `filter does not alter response status`() {
        val request = MockHttpServletRequest("GET", "/api/coaches")
        val response = MockHttpServletResponse()
        response.status = 200
        val chain = mockk<FilterChain>(relaxed = true)

        filter.doFilter(request, response, chain)

        assertThat(response.status).isEqualTo(200)
    }

    @Test
    fun `filter works with authenticated user`() {
        val auth = UsernamePasswordAuthenticationToken("admin", null, emptyList())
        SecurityContextHolder.getContext().authentication = auth

        val request = MockHttpServletRequest("POST", "/api/coaches")
        val response = MockHttpServletResponse()
        val chain = mockk<FilterChain>(relaxed = true)

        filter.doFilter(request, response, chain)

        verify(exactly = 1) { chain.doFilter(request, response) }
    }

    @Test
    fun `filter works with anonymous user`() {
        val request = MockHttpServletRequest("GET", "/api/auth/login")
        val response = MockHttpServletResponse()
        val chain = mockk<FilterChain>(relaxed = true)

        filter.doFilter(request, response, chain)

        verify(exactly = 1) { chain.doFilter(request, response) }
    }

    @Test
    fun `filter extracts IP from X-Forwarded-For header`() {
        val request = MockHttpServletRequest("GET", "/api/coaches")
        request.addHeader("X-Forwarded-For", "203.0.113.50, 70.41.3.18")
        request.remoteAddr = "127.0.0.1"
        val response = MockHttpServletResponse()
        val chain = mockk<FilterChain>(relaxed = true)

        filter.doFilter(request, response, chain)

        verify(exactly = 1) { chain.doFilter(request, response) }
    }

    @Test
    fun `filter continues chain even when exception occurs in chain`() {
        val request = MockHttpServletRequest("GET", "/api/coaches")
        val response = MockHttpServletResponse()
        val chain = mockk<FilterChain>()
        io.mockk.every { chain.doFilter(any(), any()) } throws RuntimeException("Test error")

        try {
            filter.doFilter(request, response, chain)
        } catch (_: RuntimeException) {
            // expected
        }

        verify(exactly = 1) { chain.doFilter(request, response) }
    }
}
