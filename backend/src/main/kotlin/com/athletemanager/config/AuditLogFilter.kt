package com.athletemanager.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
class AuditLogFilter : OncePerRequestFilter() {

    private val auditLog = LoggerFactory.getLogger("AUDIT")

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val startTime = System.currentTimeMillis()

        try {
            filterChain.doFilter(request, response)
        } finally {
            val duration = System.currentTimeMillis() - startTime
            val username = SecurityContextHolder.getContext().authentication?.name ?: "anonymous"
            val clientIp = request.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim()
                ?: request.remoteAddr

            auditLog.info(
                "method={} uri={} user={} ip={} status={} duration={}ms",
                request.method,
                request.requestURI,
                username,
                clientIp,
                response.status,
                duration
            )
        }
    }
}
