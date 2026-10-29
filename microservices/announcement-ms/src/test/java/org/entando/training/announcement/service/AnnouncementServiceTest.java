package org.entando.training.announcement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.entando.training.announcement.api.AnnouncementInput;
import org.entando.training.announcement.persistence.Announcement;
import org.entando.training.announcement.persistence.AnnouncementRepository;
import org.entando.training.announcement.persistence.Category;
import org.entando.training.announcement.persistence.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceTest {

    private static final Instant T0 = Instant.parse("2026-11-02T09:00:00Z");
    private static final Instant T1 = Instant.parse("2026-11-03T09:00:00Z");

    @Mock
    private AnnouncementRepository repository;

    private MutableClock clock;
    private AnnouncementService service;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(T0);
        service = new AnnouncementService(repository, clock);
        lenient().when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createPublishedSetsPublicationAndAuditFields() {
        var created = service.create(input(Status.PUBLISHED), "alice");

        assertThat(created.publishedAt()).isEqualTo(T0);
        assertThat(created.createdAt()).isEqualTo(T0);
        assertThat(created.updatedAt()).isEqualTo(T0);
        assertThat(created.createdBy()).isEqualTo("alice");
    }

    @Test
    void createDraftHasNoPublicationDate() {
        assertThat(service.create(input(Status.DRAFT), "alice").publishedAt()).isNull();
    }

    @Test
    void updateKeepsFirstPublicationDateAndUnpublishClearsIt() {
        var existing = new Announcement();
        existing.setPublishedAt(T0);
        existing.setCreatedAt(T0);
        existing.setCreatedBy("alice");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        clock.set(T1);

        var republished = service.update(1L, input(Status.PUBLISHED));
        assertThat(republished.publishedAt()).isEqualTo(T0);
        assertThat(republished.updatedAt()).isEqualTo(T1);
        assertThat(republished.createdBy()).isEqualTo("alice");

        assertThat(service.update(1L, input(Status.DRAFT)).publishedAt()).isNull();
    }

    @Test
    void unknownIdsRaiseNotFound() {
        when(repository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(9L)).isInstanceOf(AnnouncementNotFoundException.class)
                .hasMessage("Announcement 9 not found");
        assertThatThrownBy(() -> service.update(9L, input(Status.DRAFT)))
                .isInstanceOf(AnnouncementNotFoundException.class);
        assertThatThrownBy(() -> service.delete(9L)).isInstanceOf(AnnouncementNotFoundException.class);
        verify(repository, never()).delete(any());
    }

    @Test
    void likePatternIsLowerCasedTrimmedAndEscaped() {
        assertThat(AnnouncementService.toLikePattern(null)).isNull();
        assertThat(AnnouncementService.toLikePattern("   ")).isNull();
        assertThat(AnnouncementService.toLikePattern("  Maintenance ")).isEqualTo("%maintenance%");
        assertThat(AnnouncementService.toLikePattern("50%_off\\")).isEqualTo("%50\\%\\_off\\\\%");
    }

    private static AnnouncementInput input(Status status) {
        return new AnnouncementInput("Title", "Summary", "Body", Category.GENERAL, status);
    }

    private static final class MutableClock extends Clock {

        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void set(Instant now) {
            this.now = now;
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }
}
