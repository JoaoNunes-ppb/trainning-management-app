package com.athletemanager.datatransfer

import com.athletemanager.config.AuditEventLogger
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.mock.web.MockMultipartFile
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class DataTransferServiceTest {

    private val jdbcTemplate = mockk<JdbcTemplate>(relaxed = true)
    private val objectMapper = jacksonObjectMapper().registerModule(JavaTimeModule())
    private val service = DataTransferService(
        jdbcTemplate,
        objectMapper,
        mockk<AuditEventLogger>(relaxed = true),
        Clock.fixed(Instant.parse("2026-09-01T08:00:00Z"), ZoneOffset.UTC)
    )

    @Test
    fun `validates a complete relational snapshot`() {
        val summary = service.validate(snapshot())

        assertThat(summary.formatVersion).isEqualTo(1)
        assertThat(summary.files).containsEntry("coaches.csv", 1)
        assertThat(summary.files).containsEntry("exercise_results.csv", 1)
    }

    @Test
    fun `rejects broken references before touching the database`() {
        val error = assertThrows<SnapshotValidationException> {
            service.import(snapshot(athleteCoachId = "00000000-0000-0000-0000-000000000099"))
        }

        assertThat(error.errors).containsKey("athletes.csv:2.coach_id")
        verify(exactly = 0) { jdbcTemplate.update(any<String>()) }
    }

    @Test
    fun `rejects unsafe zip entries`() {
        val error = assertThrows<SnapshotValidationException> {
            service.validate(zip(mapOf("../coaches.csv" to "id,name\r\n")))
        }

        assertThat(error.errors["archive"]).contains("Unsafe ZIP entry")
    }

    private fun snapshot(
        athleteCoachId: String = "00000000-0000-0000-0000-000000000001"
    ): MockMultipartFile {
        val files = linkedMapOf(
            "coaches.csv" to """
                id,name
                00000000-0000-0000-0000-000000000001,"Coach, One"
            """.trimIndent() + "\r\n",
            "athletes.csv" to """
                id,name,date_of_birth,notes,email,weight_kg,height_cm,coach_id
                00000000-0000-0000-0000-000000000002,Ana,1995-04-03,"line 1
                line 2",ana@example.com,65.5,170,$athleteCoachId
            """.trimIndent() + "\r\n",
            "exercises.csv" to """
                id,name,description,has_sets,has_reps,has_weight,has_distance,has_time,modality,kineo_type
                00000000-0000-0000-0000-000000000003,Squat,,true,true,true,false,false,LIVRE,
            """.trimIndent() + "\r\n",
            "workouts.csv" to """
                id,athlete_id,label,date,notes,status,scheduled_time
                00000000-0000-0000-0000-000000000004,00000000-0000-0000-0000-000000000002,Strength,2026-09-01,,PENDING,09:30:00
            """.trimIndent() + "\r\n",
            "workout_exercises.csv" to """
                id,workout_id,exercise_id,order_index,notes,sets_expected,reps_expected,weight_expected,distance_expected,time_expected,concentric_load,eccentric_load,isometric_load
                00000000-0000-0000-0000-000000000005,00000000-0000-0000-0000-000000000004,00000000-0000-0000-0000-000000000003,0,,3,8,40.00,,,10.00,,
            """.trimIndent() + "\r\n",
            "exercise_results.csv" to """
                id,workout_exercise_id,sets,reps,weight,distance,time,notes,concentric_load,eccentric_load,isometric_load
                00000000-0000-0000-0000-000000000006,00000000-0000-0000-0000-000000000005,3,8,42.50,,,ok,11.00,,
            """.trimIndent() + "\r\n"
        )
        val manifest = SnapshotManifest(
            1,
            Instant.parse("2026-09-01T08:00:00Z"),
            files.mapValues { 1 }
        )
        return zip(linkedMapOf("manifest.json" to objectMapper.writeValueAsString(manifest)) + files)
    }

    private fun zip(entries: Map<String, String>): MockMultipartFile {
        val output = ByteArrayOutputStream()
        ZipOutputStream(output, StandardCharsets.UTF_8).use { zip ->
            entries.forEach { (name, content) ->
                zip.putNextEntry(ZipEntry(name))
                zip.write(content.toByteArray(StandardCharsets.UTF_8))
                zip.closeEntry()
            }
        }
        return MockMultipartFile("file", "snapshot.zip", "application/zip", output.toByteArray())
    }
}
