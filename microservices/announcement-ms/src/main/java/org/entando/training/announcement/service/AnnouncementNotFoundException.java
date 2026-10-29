package org.entando.training.announcement.service;

public class AnnouncementNotFoundException extends RuntimeException {

    public AnnouncementNotFoundException(long id) {
        super("Announcement " + id + " not found");
    }
}
