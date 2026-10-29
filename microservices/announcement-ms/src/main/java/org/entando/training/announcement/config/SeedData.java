package org.entando.training.announcement.config;

import org.entando.training.announcement.api.AnnouncementInput;
import org.entando.training.announcement.persistence.AnnouncementRepository;
import org.entando.training.announcement.persistence.Category;
import org.entando.training.announcement.persistence.Status;
import org.entando.training.announcement.service.AnnouncementService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Inserts demo announcements into an empty database. Disable with announcement.seed.enabled=false. */
@Component
@ConditionalOnProperty(name = "announcement.seed.enabled", havingValue = "true")
public class SeedData implements ApplicationRunner {

    private final AnnouncementRepository repository;
    private final AnnouncementService service;

    public SeedData(AnnouncementRepository repository, AnnouncementService service) {
        this.repository = repository;
        this.service = service;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }
        service.create(new AnnouncementInput("Welcome to the Entando developer training",
                "Day 2 covers bundles, micro frontends and microservices.",
                "Bring a laptop with Docker, JDK 17 and Node.js 20 installed.",
                Category.TRAINING, Status.PUBLISHED), "seed");
        service.create(new AnnouncementInput("Planned maintenance of the training cluster",
                "The cluster is unavailable on Saturday from 08:00 to 12:00 UTC.",
                "Deployments started before the window are kept; new installs are blocked.",
                Category.MAINTENANCE, Status.PUBLISHED), "seed");
        service.create(new AnnouncementInput("Community meetup",
                "Join the Entando community meetup after the course.",
                "Talks on micro frontends, Keycloak and multitenancy.",
                Category.EVENT, Status.PUBLISHED), "seed");
        service.create(new AnnouncementInput("Draft: certification exam dates",
                "Exam dates will be announced soon.",
                "Internal draft - not visible in the public search.",
                Category.TRAINING, Status.DRAFT), "seed");
    }
}
