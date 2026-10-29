package org.entando.training.announcement.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import org.entando.training.announcement.api.AnnouncementInput;
import org.entando.training.announcement.api.AnnouncementItem;
import org.entando.training.announcement.api.AnnouncementSummary;
import org.entando.training.announcement.api.PageResponse;
import org.entando.training.announcement.persistence.Announcement;
import org.entando.training.announcement.persistence.AnnouncementRepository;
import org.entando.training.announcement.persistence.Category;
import org.entando.training.announcement.persistence.Status;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AnnouncementService {

    private static final Sort NEWEST_PUBLISHED = Sort.by(Sort.Order.desc("publishedAt"), Sort.Order.desc("id"));
    private static final Sort RECENTLY_UPDATED = Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id"));

    private final AnnouncementRepository repository;
    private final Clock clock;

    public AnnouncementService(AnnouncementRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    /** Searches published announcements only; never exposes drafts or bodies. */
    @Transactional(readOnly = true)
    public PageResponse<AnnouncementSummary> search(String text, Category category, int page, int size) {
        var result = repository.searchPublished(toLikePattern(text), category, PageRequest.of(page, size, NEWEST_PUBLISHED));
        return PageResponse.from(result.map(AnnouncementService::toSummary));
    }

    @Transactional(readOnly = true)
    public PageResponse<AnnouncementItem> list(Status status, int page, int size) {
        var pageable = PageRequest.of(page, size, RECENTLY_UPDATED);
        var result = status == null ? repository.findAll(pageable) : repository.findByStatus(status, pageable);
        return PageResponse.from(result.map(AnnouncementService::toItem));
    }

    @Transactional(readOnly = true)
    public AnnouncementItem get(long id) {
        return toItem(find(id));
    }

    public AnnouncementItem create(AnnouncementInput input, String author) {
        var now = clock.instant();
        var announcement = new Announcement();
        announcement.setCreatedAt(now);
        announcement.setCreatedBy(author);
        apply(input, announcement, now);
        return toItem(repository.save(announcement));
    }

    public AnnouncementItem update(long id, AnnouncementInput input) {
        var announcement = find(id);
        apply(input, announcement, clock.instant());
        return toItem(announcement);
    }

    public void delete(long id) {
        repository.delete(find(id));
    }

    private Announcement find(long id) {
        return repository.findById(id).orElseThrow(() -> new AnnouncementNotFoundException(id));
    }

    private static void apply(AnnouncementInput input, Announcement announcement, Instant now) {
        announcement.setTitle(input.title());
        announcement.setSummary(input.summary());
        announcement.setBody(input.body());
        announcement.setCategory(input.category());
        announcement.setStatus(input.status());
        announcement.setUpdatedAt(now);
        if (input.status() == Status.DRAFT) {
            announcement.setPublishedAt(null);
        } else if (announcement.getPublishedAt() == null) {
            announcement.setPublishedAt(now);
        }
    }

    static String toLikePattern(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        var escaped = text.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private static AnnouncementSummary toSummary(Announcement a) {
        return new AnnouncementSummary(a.getId(), a.getTitle(), a.getSummary(), a.getCategory(), a.getPublishedAt());
    }

    private static AnnouncementItem toItem(Announcement a) {
        return new AnnouncementItem(a.getId(), a.getTitle(), a.getSummary(), a.getBody(), a.getCategory(),
                a.getStatus(), a.getPublishedAt(), a.getCreatedAt(), a.getUpdatedAt(), a.getCreatedBy());
    }
}
