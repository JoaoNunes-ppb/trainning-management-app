package com.athletemanager.common

import com.athletemanager.common.exception.BusinessRuleException
import com.athletemanager.common.exception.GlobalExceptionHandler
import com.athletemanager.common.exception.ResourceNotFoundException
import io.mockk.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.validation.BindingResult
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException

class GlobalExceptionHandlerTest {

    private val handler = GlobalExceptionHandler()

    @Test
    fun `handleNotFound returns 404 with correct message`() {
        val ex = ResourceNotFoundException("Athlete not found with id: abc")

        val response = handler.handleNotFound(ex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        assertThat(response.body!!.status).isEqualTo(404)
        assertThat(response.body!!.error).isEqualTo("Not Found")
        assertThat(response.body!!.message).isEqualTo("Athlete not found with id: abc")
    }

    @Test
    fun `handleBusinessRule returns 409 with correct message`() {
        val ex = BusinessRuleException("Status must be one of: PENDING, COMPLETED, MISSED")

        val response = handler.handleBusinessRule(ex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.CONFLICT)
        assertThat(response.body!!.status).isEqualTo(409)
        assertThat(response.body!!.error).isEqualTo("Conflict")
        assertThat(response.body!!.message).isEqualTo("Status must be one of: PENDING, COMPLETED, MISSED")
    }

    @Test
    fun `handleValidation returns 400 with field errors`() {
        val fieldError = FieldError("createWorkoutRequest", "label", "must not be blank")
        val bindingResult = mockk<BindingResult> {
            every { fieldErrors } returns listOf(fieldError)
        }
        val ex = mockk<MethodArgumentNotValidException>(relaxed = true) {
            every { this@mockk.bindingResult } returns bindingResult
        }

        val response = handler.handleValidation(ex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(response.body!!.status).isEqualTo(400)
        assertThat(response.body!!.error).isEqualTo("Bad Request")
        assertThat(response.body!!.message).isEqualTo("Validation failed")
        assertThat(response.body!!.fieldErrors).containsEntry("label", "must not be blank")
    }

    @Test
    fun `handleValidation returns 400 with empty field errors when none present`() {
        val bindingResult = mockk<BindingResult> {
            every { fieldErrors } returns emptyList()
        }
        val ex = mockk<MethodArgumentNotValidException>(relaxed = true) {
            every { this@mockk.bindingResult } returns bindingResult
        }

        val response = handler.handleValidation(ex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(response.body!!.fieldErrors).isEmpty()
    }

    @Test
    fun `handleGeneral returns 500 with message`() {
        val ex = RuntimeException("Something went wrong")

        val response = handler.handleGeneral(ex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
        assertThat(response.body!!.status).isEqualTo(500)
        assertThat(response.body!!.error).isEqualTo("Internal Server Error")
        assertThat(response.body!!.message).isEqualTo("Something went wrong")
    }

    @Test
    fun `handleGeneral returns default message when exception message is null`() {
        val ex = mockk<Exception> {
            every { message } returns null
        }

        val response = handler.handleGeneral(ex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
        assertThat(response.body!!.message).isEqualTo("An unexpected error occurred")
    }

    @Test
    fun `response body contains timestamp`() {
        val ex = ResourceNotFoundException("test")

        val response = handler.handleNotFound(ex)

        assertThat(response.body!!.timestamp).isNotNull()
    }
}
