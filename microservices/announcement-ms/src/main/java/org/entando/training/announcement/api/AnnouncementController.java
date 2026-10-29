package org.entando.training.announcement.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import org.entando.training.announcement.persistence.Category;
import org.entando.training.announcement.persistence.Status;
import org.entando.training.announcement.service.AnnouncementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    static final String ANONYMOUS_AUTHOR = "anonymous";

    private final AnnouncementService service;

    public AnnouncementController(AnnouncementService service) {
        this.service = service;
    }

    /** O1 — public search of published announcements. */
    @GetMapping("/search")
    public PageResponse<AnnouncementSummary> search(
            @RequestParam(required = false) @Size(max = 100) String q,
            @RequestParam(required = false) Category category,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        return service.search(q, category, page, size);
    }

    /** O2 — management list, drafts included. */
    @GetMapping
    public PageResponse<AnnouncementItem> list(
            @RequestParam(required = false) Status status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(status, page, size);
    }

    /** O3 — full detail. */
    @GetMapping("/{id:\\d+}")
    public AnnouncementItem get(@PathVariable long id) {
        return service.get(id);
    }

    /** O4 — create. */
    @PostMapping
    public ResponseEntity<AnnouncementItem> create(@Valid @RequestBody AnnouncementInput input, Principal principal) {
        var created = service.create(input, principal == null ? ANONYMOUS_AUTHOR : principal.getName());
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    /** O5 — replace, including status changes. */
    @PutMapping("/{id:\\d+}")
    public AnnouncementItem update(@PathVariable long id, @Valid @RequestBody AnnouncementInput input) {
        return service.update(id, input);
    }

    /** O6 — delete. */
    @DeleteMapping("/{id:\\d+}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
