package org.entando.training.announcement.api;

import java.time.Instant;
import org.entando.training.announcement.persistence.Category;

/** Public search result: deliberately excludes body, status and author. */
public record AnnouncementSummary(Long id, String title, String summary, Category category, Instant publishedAt) {
}
