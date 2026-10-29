package org.entando.training.announcement.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@DataJpaTest
class AnnouncementRepositoryTest {

    private static final Sort NEWEST = Sort.by(Sort.Order.desc("publishedAt"), Sort.Order.desc("id"));

    @Autowired
    private AnnouncementRepository repository;

    @BeforeEach
    void setUp() {
        save("Cluster maintenance", "Saturday downtime", Category.MAINTENANCE, Status.PUBLISHED, "2026-11-01T10:00:00Z");
        save("Meetup", "Community MAINTENANCE talk", Category.EVENT, Status.PUBLISHED, "2026-11-03T10:00:00Z");
        save("50% discount", "Certification voucher", Category.TRAINING, Status.PUBLISHED, "2026-11-02T10:00:00Z");
        save("Secret maintenance draft", "Not public", Category.MAINTENANCE, Status.DRAFT, null);
    }

    @Test
    void searchReturnsOnlyPublishedNewestFirst() {
        var page = repository.searchPublished(null, null, PageRequest.of(0, 10, NEWEST));

        assertThat(page.getContent()).extracting(Announcement::getTitle)
                .containsExactly("Meetup", "50% discount", "Cluster maintenance");
    }

    @Test
    void searchMatchesTitleOrSummaryCaseInsensitively() {
        var page = repository.searchPublished("%maintenance%", null, PageRequest.of(0, 10, NEWEST));

        assertThat(page.getContent()).extracting(Announcement::getTitle)
                .containsExactly("Meetup", "Cluster maintenance");
    }

    @Test
    void searchCombinesTextAndCategory() {
        var page = repository.searchPublished("%maintenance%", Category.MAINTENANCE, PageRequest.of(0, 10, NEWEST));

        assertThat(page.getContent()).extracting(Announcement::getTitle).containsExactly("Cluster maintenance");
    }

    @Test
    void escapedWildcardsMatchLiterally() {
        assertThat(repository.searchPublished("%50\\%%", null, PageRequest.of(0, 10, NEWEST)).getContent())
                .extracting(Announcement::getTitle).containsExactly("50% discount");
        assertThat(repository.searchPublished("%\\_%", null, PageRequest.of(0, 10, NEWEST)).getContent()).isEmpty();
    }

    @Test
    void searchPaginates() {
        var page = repository.searchPublished(null, null, PageRequest.of(1, 2, NEWEST));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.getContent()).extracting(Announcement::getTitle).containsExactly("Cluster maintenance");
    }

    private void save(String title, String summary, Category category, Status status, String publishedAt) {
        var a = new Announcement();
        a.setTitle(title);
        a.setSummary(summary);
        a.setBody("Body of " + title);
        a.setCategory(category);
        a.setStatus(status);
        a.setPublishedAt(publishedAt == null ? null : Instant.parse(publishedAt));
        a.setCreatedAt(Instant.parse("2026-10-01T00:00:00Z"));
        a.setUpdatedAt(Instant.parse("2026-10-01T00:00:00Z"));
        a.setCreatedBy("test");
        repository.save(a);
    }
}
