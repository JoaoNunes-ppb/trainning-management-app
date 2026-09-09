package com.athletemanager.datatransfer

import com.athletemanager.config.AuditEventLogger
import com.athletemanager.exercise.KineoType
import com.athletemanager.exercise.Modality
import com.fasterxml.jackson.databind.ObjectMapper
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.apache.commons.csv.CSVPrinter
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.OutputStreamWriter
import java.math.BigDecimal
import java.nio.charset.StandardCharsets
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

@Service
class DataTransferService(
    private val jdbcTemplate: JdbcTemplate,
    private val objectMapper: ObjectMapper,
    private val auditEventLogger: AuditEventLogger,
    private val clock: Clock
) {

    companion object {
        private const val FORMAT_VERSION = 1
        private const val MAX_ARCHIVE_BYTES = 20L * 1024 * 1024
        private const val MAX_ENTRY_BYTES = 10L * 1024 * 1024
        private const val MAX_TOTAL_UNCOMPRESSED_BYTES = 50L * 1024 * 1024
        private const val MANIFEST = "manifest.json"

        private val schemas = linkedMapOf(
            "coaches.csv" to listOf("id", "name"),
            "athletes.csv" to listOf(
                "id", "name", "date_of_birth", "notes", "email", "weight_kg", "height_cm", "coach_id"
            ),
            "exercises.csv" to listOf(
                "id", "name", "description", "has_sets", "has_reps", "has_weight", "has_distance",
                "has_time", "modality", "kineo_type"
            ),
            "workouts.csv" to listOf(
                "id", "athlete_id", "label", "date", "notes", "status", "scheduled_time"
            ),
            "workout_exercises.csv" to listOf(
                "id", "workout_id", "exercise_id", "order_index", "notes", "sets_expected",
                "reps_expected", "weight_expected", "distance_expected", "time_expected",
                "concentric_load", "eccentric_load", "isometric_load"
            ),
            "exercise_results.csv" to listOf(
                "id", "workout_exercise_id", "sets", "reps", "weight", "distance", "time", "notes",
                "concentric_load", "eccentric_load", "isometric_load"
            )
        )
    }

    private data class ParsedSnapshot(
        val manifest: SnapshotManifest,
        val rows: Map<String, List<Map<String, String>>>
    )

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    fun export(): ByteArray {
        val rows = linkedMapOf(
            "coaches.csv" to query(
                "SELECT id::text AS id, name FROM coach ORDER BY id",
                schemas.getValue("coaches.csv")
            ),
            "athletes.csv" to query(
                """SELECT id::text AS id, name, date_of_birth::text AS date_of_birth, notes, email,
                   weight_kg::text AS weight_kg, height_cm::text AS height_cm, coach_id::text AS coach_id
                   FROM athlete ORDER BY id""",
                schemas.getValue("athletes.csv")
            ),
            "exercises.csv" to query(
                """SELECT id::text AS id, name, description, has_sets::text AS has_sets,
                   has_reps::text AS has_reps, has_weight::text AS has_weight,
                   has_distance::text AS has_distance, has_time::text AS has_time,
                   modality, kineo_type FROM exercise ORDER BY id""",
                schemas.getValue("exercises.csv")
            ),
            "workouts.csv" to query(
                """SELECT id::text AS id, athlete_id::text AS athlete_id, label, date::text AS date,
                   notes, status, scheduled_time::text AS scheduled_time FROM workout ORDER BY id""",
                schemas.getValue("workouts.csv")
            ),
            "workout_exercises.csv" to query(
                """SELECT id::text AS id, workout_id::text AS workout_id, exercise_id::text AS exercise_id,
                   order_index::text AS order_index, notes, sets_expected::text AS sets_expected,
                   reps_expected::text AS reps_expected, weight_expected::text AS weight_expected,
                   distance_expected::text AS distance_expected, time_expected::text AS time_expected,
                   concentric_load::text AS concentric_load, eccentric_load::text AS eccentric_load,
                   isometric_load::text AS isometric_load FROM workout_exercise ORDER BY id""",
                schemas.getValue("workout_exercises.csv")
            ),
            "exercise_results.csv" to query(
                """SELECT id::text AS id, workout_exercise_id::text AS workout_exercise_id,
                   sets::text AS sets, reps::text AS reps, weight::text AS weight,
                   distance::text AS distance, time::text AS time, notes,
                   concentric_load::text AS concentric_load, eccentric_load::text AS eccentric_load,
                   isometric_load::text AS isometric_load FROM exercise_result ORDER BY id""",
                schemas.getValue("exercise_results.csv")
            )
        )
        val manifest = SnapshotManifest(
            formatVersion = FORMAT_VERSION,
            exportedAt = clock.instant(),
            files = rows.mapValues { it.value.size }
        )

        val output = ByteArrayOutputStream()
        ZipOutputStream(output, StandardCharsets.UTF_8).use { zip ->
            putEntry(zip, MANIFEST, objectMapper.writeValueAsBytes(manifest))
            rows.forEach { (name, records) ->
                putEntry(zip, name, writeCsv(schemas.getValue(name), records))
            }
        }
        auditEventLogger.logEvent("EXPORT", "DataSnapshot", details = "records=${manifest.files.values.sum()}")
        return output.toByteArray()
    }

    fun validate(file: MultipartFile): SnapshotSummary {
        val parsed = parseAndValidate(file)
        return parsed.manifest.toSummary()
    }

    @Transactional
    fun import(file: MultipartFile): SnapshotSummary {
        val parsed = try {
            parseAndValidate(file)
        } catch (ex: SnapshotValidationException) {
            auditEventLogger.logEvent("IMPORT_REJECTED", "DataSnapshot", details = "validationErrors=${ex.errors.size}")
            throw ex
        }
        replaceData(parsed.rows)
        auditEventLogger.logEvent(
            "IMPORT",
            "DataSnapshot",
            details = "records=${parsed.manifest.files.values.sum()} formatVersion=${parsed.manifest.formatVersion}"
        )
        return parsed.manifest.toSummary()
    }

    private fun query(sql: String, columns: List<String>): List<Map<String, String>> =
        jdbcTemplate.query(sql) { rs, _ ->
            columns.associateWith { column -> rs.getString(column) ?: "" }
        }

    private fun writeCsv(headers: List<String>, rows: List<Map<String, String>>): ByteArray {
        val output = ByteArrayOutputStream()
        OutputStreamWriter(output, StandardCharsets.UTF_8).use { writer ->
            val format = CSVFormat.DEFAULT.builder()
                .setHeader(*headers.toTypedArray())
                .setSkipHeaderRecord(false)
                .setRecordSeparator("\r\n")
                .build()
            CSVPrinter(writer, format).use { printer ->
                rows.forEach { row -> printer.printRecord(headers.map { row[it].orEmpty() }) }
            }
        }
        return output.toByteArray()
    }

    private fun putEntry(zip: ZipOutputStream, name: String, bytes: ByteArray) {
        zip.putNextEntry(ZipEntry(name))
        zip.write(bytes)
        zip.closeEntry()
    }

    private fun parseAndValidate(file: MultipartFile): ParsedSnapshot {
        if (file.isEmpty) invalid("file", "Select a non-empty ZIP snapshot")
        if (file.size > MAX_ARCHIVE_BYTES) invalid("file", "ZIP snapshot exceeds the 20 MB limit")

        val entries = readZip(file.inputStream)
        val expected = schemas.keys + MANIFEST
        val missing = expected - entries.keys
        val unexpected = entries.keys - expected
        if (missing.isNotEmpty()) invalid("archive", "Missing files: ${missing.sorted().joinToString()}")
        if (unexpected.isNotEmpty()) invalid("archive", "Unexpected files: ${unexpected.sorted().joinToString()}")

        val manifest = try {
            objectMapper.readValue(entries.getValue(MANIFEST), SnapshotManifest::class.java)
        } catch (ex: Exception) {
            invalid("manifest.json", "Manifest is not valid JSON")
        }
        if (manifest.formatVersion != FORMAT_VERSION) {
            invalid("manifest.json", "Unsupported formatVersion ${manifest.formatVersion}; expected $FORMAT_VERSION")
        }
        if (manifest.files.keys != schemas.keys) {
            invalid("manifest.json", "Manifest file list does not match the snapshot contract")
        }
        if (manifest.files.values.any { it < 0 }) invalid("manifest.json", "Record counts cannot be negative")

        val rows = schemas.mapValues { (name, headers) ->
            parseCsv(name, headers, entries.getValue(name))
        }
        rows.forEach { (name, records) ->
            if (manifest.files[name] != records.size) {
                invalid(name, "Manifest count ${manifest.files[name]} does not match ${records.size} CSV records")
            }
        }
        validateRows(rows)
        return ParsedSnapshot(manifest, rows)
    }

    private fun readZip(input: InputStream): Map<String, ByteArray> {
        val entries = linkedMapOf<String, ByteArray>()
        var totalBytes = 0L
        try {
            ZipInputStream(input.buffered(), StandardCharsets.UTF_8).use { zip ->
                while (true) {
                    val entry = zip.nextEntry ?: break
                    val name = entry.name
                    if (entry.isDirectory || name.contains('/') || name.contains('\\') || name == "." || name == "..") {
                        invalid("archive", "Unsafe ZIP entry: $name")
                    }
                    if (entries.containsKey(name)) invalid("archive", "Duplicate ZIP entry: $name")
                    val bytes = readLimited(zip, MAX_ENTRY_BYTES, name)
                    totalBytes += bytes.size
                    if (totalBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
                        invalid("archive", "Uncompressed snapshot exceeds the 50 MB limit")
                    }
                    entries[name] = bytes
                    zip.closeEntry()
                }
            }
        } catch (ex: SnapshotValidationException) {
            throw ex
        } catch (ex: Exception) {
            invalid("archive", "File is not a readable ZIP snapshot")
        }
        return entries
    }

    private fun readLimited(input: InputStream, limit: Long, name: String): ByteArray {
        val output = ByteArrayOutputStream()
        val buffer = ByteArray(8192)
        var total = 0L
        while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            total += read
            if (total > limit) invalid(name, "ZIP entry exceeds the 10 MB limit")
            output.write(buffer, 0, read)
        }
        return output.toByteArray()
    }

    private fun parseCsv(name: String, headers: List<String>, bytes: ByteArray): List<Map<String, String>> {
        val format = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setAllowDuplicateHeaderNames(false)
            .setIgnoreEmptyLines(false)
            .build()
        val parser = try {
            CSVParser.parse(ByteArrayInputStream(bytes), StandardCharsets.UTF_8, format)
        } catch (ex: Exception) {
            invalid(name, "CSV cannot be parsed: ${ex.message ?: "invalid syntax"}")
        }
        return try {
            parser.use {
                if (it.headerNames != headers) {
                    invalid(name, "Headers must be exactly: ${headers.joinToString()}")
                }
                it.records.mapIndexed { index, record ->
                    if (!record.isConsistent) invalid("$name:${index + 2}", "Column count does not match the header")
                    headers.associateWith { header -> record.get(header) }
                }
            }
        } catch (ex: SnapshotValidationException) {
            throw ex
        } catch (ex: Exception) {
            invalid(name, "CSV cannot be parsed: ${ex.message ?: "invalid syntax"}")
        }
    }

    private fun validateRows(rows: Map<String, List<Map<String, String>>>) {
        val errors = linkedMapOf<String, String>()
        val ids = mutableMapOf<String, Set<UUID>>()

        schemas.keys.forEach { file ->
            val seen = mutableSetOf<UUID>()
            rows.getValue(file).forEachIndexed { index, row ->
                val location = "$file:${index + 2}"
                val id = parseUuid(row.getValue("id"), "$location.id", errors)
                if (id != null && !seen.add(id)) errors["$location.id"] = "Duplicate id $id"
            }
            ids[file] = seen
        }

        rows.getValue("coaches.csv").forEachIndexed { i, row ->
            required(row, "name", "coaches.csv:${i + 2}", errors)
        }
        rows.getValue("athletes.csv").forEachIndexed { i, row ->
            val loc = "athletes.csv:${i + 2}"
            required(row, "name", loc, errors)
            required(row, "email", loc, errors, allowEmpty = true)
            parseDate(row["date_of_birth"], "$loc.date_of_birth", errors, nullable = true)
            parseDecimal(row["weight_kg"], "$loc.weight_kg", errors, nullable = true)
            parseInt(row["height_cm"], "$loc.height_cm", errors, nullable = true)
            reference(row["coach_id"], "$loc.coach_id", ids.getValue("coaches.csv"), errors)
        }
        rows.getValue("exercises.csv").forEachIndexed { i, row ->
            val loc = "exercises.csv:${i + 2}"
            required(row, "name", loc, errors)
            listOf("has_sets", "has_reps", "has_weight", "has_distance", "has_time")
                .forEach { parseBoolean(row[it], "$loc.$it", errors) }
            enumValue<Modality>(row["modality"], "$loc.modality", errors)
            enumValue<KineoType>(row["kineo_type"], "$loc.kineo_type", errors, nullable = true)
        }
        rows.getValue("workouts.csv").forEachIndexed { i, row ->
            val loc = "workouts.csv:${i + 2}"
            reference(row["athlete_id"], "$loc.athlete_id", ids.getValue("athletes.csv"), errors)
            required(row, "label", loc, errors)
            parseDate(row["date"], "$loc.date", errors)
            if (row["status"] !in setOf("PENDING", "COMPLETED", "MISSED")) {
                errors["$loc.status"] = "Must be PENDING, COMPLETED, or MISSED"
            }
            parseTime(row["scheduled_time"], "$loc.scheduled_time", errors, nullable = true)
        }
        rows.getValue("workout_exercises.csv").forEachIndexed { i, row ->
            val loc = "workout_exercises.csv:${i + 2}"
            reference(row["workout_id"], "$loc.workout_id", ids.getValue("workouts.csv"), errors)
            reference(row["exercise_id"], "$loc.exercise_id", ids.getValue("exercises.csv"), errors)
            parseInt(row["order_index"], "$loc.order_index", errors)
            listOf("sets_expected", "reps_expected", "time_expected")
                .forEach { parseInt(row[it], "$loc.$it", errors, nullable = true) }
            listOf("weight_expected", "distance_expected", "concentric_load", "eccentric_load", "isometric_load")
                .forEach { parseDecimal(row[it], "$loc.$it", errors, nullable = true) }
        }
        rows.getValue("exercise_results.csv").forEachIndexed { i, row ->
            val loc = "exercise_results.csv:${i + 2}"
            reference(
                row["workout_exercise_id"],
                "$loc.workout_exercise_id",
                ids.getValue("workout_exercises.csv"),
                errors
            )
            listOf("sets", "reps", "time").forEach { parseInt(row[it], "$loc.$it", errors, nullable = true) }
            listOf("weight", "distance", "concentric_load", "eccentric_load", "isometric_load")
                .forEach { parseDecimal(row[it], "$loc.$it", errors, nullable = true) }
        }

        val duplicateOrder = rows.getValue("workout_exercises.csv")
            .groupBy { it["workout_id"] to it["order_index"] }
            .filterValues { it.size > 1 }
        if (duplicateOrder.isNotEmpty()) errors["workout_exercises.csv"] = "Duplicate order_index within a workout"

        val duplicateResult = rows.getValue("exercise_results.csv")
            .groupBy { it["workout_exercise_id"] }
            .filterValues { it.size > 1 }
        if (duplicateResult.isNotEmpty()) errors["exercise_results.csv"] = "Multiple results for one workout exercise"

        if (errors.isNotEmpty()) throw SnapshotValidationException("Snapshot validation failed", errors)
    }

    private fun replaceData(rows: Map<String, List<Map<String, String>>>) {
        jdbcTemplate.update("DELETE FROM exercise_result")
        jdbcTemplate.update("DELETE FROM workout_exercise")
        jdbcTemplate.update("DELETE FROM workout")
        jdbcTemplate.update("DELETE FROM athlete")
        jdbcTemplate.update("DELETE FROM exercise")
        jdbcTemplate.update("DELETE FROM coach")

        rows.getValue("coaches.csv").forEach { row ->
            jdbcTemplate.update("INSERT INTO coach (id, name) VALUES (?, ?)", uuid(row, "id"), row["name"])
        }
        rows.getValue("athletes.csv").forEach { row ->
            jdbcTemplate.update(
                """INSERT INTO athlete (id, name, date_of_birth, notes, email, weight_kg, height_cm, coach_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                uuid(row, "id"), row["name"], date(row, "date_of_birth"), text(row, "notes"), row["email"],
                decimal(row, "weight_kg"), int(row, "height_cm"), uuid(row, "coach_id")
            )
        }
        rows.getValue("exercises.csv").forEach { row ->
            jdbcTemplate.update(
                """INSERT INTO exercise (id, name, description, has_sets, has_reps, has_weight, has_distance,
                   has_time, modality, kineo_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                uuid(row, "id"), row["name"], text(row, "description"), row.getValue("has_sets").toBooleanStrict(),
                row.getValue("has_reps").toBooleanStrict(), row.getValue("has_weight").toBooleanStrict(),
                row.getValue("has_distance").toBooleanStrict(), row.getValue("has_time").toBooleanStrict(),
                row["modality"], text(row, "kineo_type")
            )
        }
        rows.getValue("workouts.csv").forEach { row ->
            jdbcTemplate.update(
                """INSERT INTO workout (id, athlete_id, label, date, notes, status, scheduled_time)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                uuid(row, "id"), uuid(row, "athlete_id"), row["label"], date(row, "date"), text(row, "notes"),
                row["status"], time(row, "scheduled_time")
            )
        }
        rows.getValue("workout_exercises.csv").forEach { row ->
            jdbcTemplate.update(
                """INSERT INTO workout_exercise (id, workout_id, exercise_id, order_index, notes, sets_expected,
                   reps_expected, weight_expected, distance_expected, time_expected, concentric_load,
                   eccentric_load, isometric_load) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                uuid(row, "id"), uuid(row, "workout_id"), uuid(row, "exercise_id"), int(row, "order_index"),
                text(row, "notes"), int(row, "sets_expected"), int(row, "reps_expected"),
                decimal(row, "weight_expected"), decimal(row, "distance_expected"), int(row, "time_expected"),
                decimal(row, "concentric_load"), decimal(row, "eccentric_load"), decimal(row, "isometric_load")
            )
        }
        rows.getValue("exercise_results.csv").forEach { row ->
            jdbcTemplate.update(
                """INSERT INTO exercise_result (id, workout_exercise_id, sets, reps, weight, distance, time, notes,
                   concentric_load, eccentric_load, isometric_load) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                uuid(row, "id"), uuid(row, "workout_exercise_id"), int(row, "sets"), int(row, "reps"),
                decimal(row, "weight"), decimal(row, "distance"), int(row, "time"), text(row, "notes"),
                decimal(row, "concentric_load"), decimal(row, "eccentric_load"), decimal(row, "isometric_load")
            )
        }
    }

    private fun required(
        row: Map<String, String>,
        field: String,
        location: String,
        errors: MutableMap<String, String>,
        allowEmpty: Boolean = false
    ) {
        if (!allowEmpty && row[field].isNullOrBlank()) errors["$location.$field"] = "Required value is missing"
    }

    private fun reference(
        value: String?,
        location: String,
        validIds: Set<UUID>,
        errors: MutableMap<String, String>
    ) {
        val id = parseUuid(value, location, errors)
        if (id != null && id !in validIds) errors[location] = "References an id not present in the snapshot"
    }

    private fun parseUuid(value: String?, location: String, errors: MutableMap<String, String>): UUID? =
        try {
            UUID.fromString(value)
        } catch (ex: Exception) {
            errors[location] = "Must be a valid UUID"
            null
        }

    private fun parseDate(
        value: String?,
        location: String,
        errors: MutableMap<String, String>,
        nullable: Boolean = false
    ) {
        parseValue(value, location, errors, nullable, "ISO date (yyyy-MM-dd)") { LocalDate.parse(it) }
    }

    private fun parseTime(
        value: String?,
        location: String,
        errors: MutableMap<String, String>,
        nullable: Boolean = false
    ) {
        parseValue(value, location, errors, nullable, "ISO time") { LocalTime.parse(it) }
    }

    private fun parseInt(
        value: String?,
        location: String,
        errors: MutableMap<String, String>,
        nullable: Boolean = false
    ) {
        parseValue(value, location, errors, nullable, "integer") { it.toInt() }
    }

    private fun parseDecimal(
        value: String?,
        location: String,
        errors: MutableMap<String, String>,
        nullable: Boolean = false
    ) {
        parseValue(value, location, errors, nullable, "decimal with a dot separator") { it.toBigDecimal() }
    }

    private fun parseBoolean(value: String?, location: String, errors: MutableMap<String, String>) {
        parseValue(value, location, errors, false, "true or false") { it.toBooleanStrict() }
    }

    private inline fun <reified T : Enum<T>> enumValue(
        value: String?,
        location: String,
        errors: MutableMap<String, String>,
        nullable: Boolean = false
    ) {
        parseValue(value, location, errors, nullable, enumValues<T>().joinToString()) { enumValueOf<T>(it) }
    }

    private fun parseValue(
        value: String?,
        location: String,
        errors: MutableMap<String, String>,
        nullable: Boolean,
        expected: String,
        parser: (String) -> Any
    ) {
        if (value.isNullOrEmpty()) {
            if (!nullable) errors[location] = "Required value is missing"
            return
        }
        try {
            parser(value)
        } catch (ex: Exception) {
            errors[location] = "Must be $expected"
        }
    }

    private fun invalid(location: String, message: String): Nothing =
        throw SnapshotValidationException("Snapshot validation failed", mapOf(location to message))

    private fun SnapshotManifest.toSummary() = SnapshotSummary(formatVersion, exportedAt, files)
    private fun uuid(row: Map<String, String>, field: String): UUID = UUID.fromString(row.getValue(field))
    private fun text(row: Map<String, String>, field: String): String? = row[field]?.takeIf { it.isNotEmpty() }
    private fun date(row: Map<String, String>, field: String): LocalDate? = text(row, field)?.let(LocalDate::parse)
    private fun time(row: Map<String, String>, field: String): LocalTime? = text(row, field)?.let(LocalTime::parse)
    private fun int(row: Map<String, String>, field: String): Int? = text(row, field)?.toInt()
    private fun decimal(row: Map<String, String>, field: String): BigDecimal? = text(row, field)?.toBigDecimal()
}
