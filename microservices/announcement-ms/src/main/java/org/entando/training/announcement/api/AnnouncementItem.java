package org.entando.training.announcement.api;

import java.time.Instant;
import org.entando.training.announcement.persistence.Category;
import org.entando.training.announcement.persistence.Status;

/** Full representation used by detail and management operations. */
public record AnnouncementItem(
        Long id,
        String title,
        String summary,
        String body,
        Category category,
        Status status,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy) {
}
