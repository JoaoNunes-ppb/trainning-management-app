package com.athletemanager.datatransfer

import java.time.Instant

data class SnapshotManifest(
    val formatVersion: Int,
    val exportedAt: Instant,
    val files: Map<String, Int>
)

data class SnapshotSummary(
    val formatVersion: Int,
    val exportedAt: Instant,
    val files: Map<String, Int>
)

class SnapshotValidationException(
    message: String,
    val errors: Map<String, String>
) : RuntimeException(message)
