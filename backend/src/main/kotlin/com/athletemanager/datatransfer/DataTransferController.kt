package com.athletemanager.datatransfer

import org.springframework.core.io.ByteArrayResource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.time.Clock
import java.time.format.DateTimeFormatter

@RestController
@RequestMapping("/api/data")
class DataTransferController(
    private val dataTransferService: DataTransferService,
    private val clock: Clock
) {

    @GetMapping("/export")
    fun export(): ResponseEntity<ByteArrayResource> {
        val snapshot = dataTransferService.export()
        val timestamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
            .withZone(clock.zone)
            .format(clock.instant())
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"athlete-manager_$timestamp.zip\"")
            .contentType(MediaType.parseMediaType("application/zip"))
            .contentLength(snapshot.size.toLong())
            .body(ByteArrayResource(snapshot))
    }

    @PostMapping("/validate", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun validate(@RequestPart("file") file: MultipartFile): SnapshotSummary =
        dataTransferService.validate(file)

    @PostMapping("/import", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun import(
        @RequestPart("file") file: MultipartFile,
        @RequestParam confirm: Boolean
    ): SnapshotSummary {
        if (!confirm) {
            throw SnapshotValidationException(
                "Import confirmation is required",
                mapOf("confirm" to "Set confirm=true only after reviewing the validated snapshot")
            )
        }
        return dataTransferService.import(file)
    }
}
