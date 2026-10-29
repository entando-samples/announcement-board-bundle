package org.entando.training.announcement.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.entando.training.announcement.persistence.Category;
import org.entando.training.announcement.persistence.Status;

/** Request body of create and update. Text fields are trimmed before validation. */
public record AnnouncementInput(
        @NotBlank @Size(min = 3, max = 120) String title,
        @NotBlank @Size(max = 280) String summary,
        @NotBlank @Size(max = 4000) String body,
        @NotNull Category category,
        @NotNull Status status) {

    public AnnouncementInput {
        title = strip(title);
        summary = strip(summary);
        body = strip(body);
    }

    private static String strip(String value) {
        return value == null ? null : value.strip();
    }
}
