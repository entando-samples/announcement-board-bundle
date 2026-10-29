package org.entando.training.announcement.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    /**
     * Published announcements only. {@code pattern} is a lower-case LIKE pattern
     * with {@code \} as escape character, or {@code null} to match everything.
     */
    @Query("""
            select a from Announcement a
            where a.status = org.entando.training.announcement.persistence.Status.PUBLISHED
              and (:category is null or a.category = :category)
              and (:pattern is null
                   or lower(a.title) like :pattern escape '\\'
                   or lower(a.summary) like :pattern escape '\\')
            """)
    Page<Announcement> searchPublished(@Param("pattern") String pattern,
                                       @Param("category") Category category,
                                       Pageable pageable);

    Page<Announcement> findByStatus(Status status, Pageable pageable);
}
