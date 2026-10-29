package org.entando.training.announcement.api;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import org.entando.training.announcement.config.ProblemDetailsSecurityHandler;
import org.entando.training.announcement.config.SecurityConfig;
import org.entando.training.announcement.persistence.Category;
import org.entando.training.announcement.persistence.Status;
import org.entando.training.announcement.service.AnnouncementNotFoundException;
import org.entando.training.announcement.service.AnnouncementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** REST contract with the real security rules; protected calls carry a mock JWT. */
@WebMvcTest(AnnouncementController.class)
@Import({SecurityConfig.class, ProblemDetailsSecurityHandler.class})
class AnnouncementControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-02T09:00:00Z");
    private static final String VALID_BODY = """
            {"title":"Kick-off","summary":"Starts at nine","body":"Room 1","category":"EVENT","status":"PUBLISHED"}
            """;

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private AnnouncementService service;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    /** Mock JWT; the post-processor bypasses the converter, so the name comes from sub. */
    private static RequestPostProcessor alice() {
        return jwt().jwt(token -> token.subject("alice").claim("preferred_username", "alice"));
    }

    @Test
    void searchReturnsSummariesWithoutBodyOrStatus() throws Exception {
        var summary = new AnnouncementSummary(1L, "Kick-off", "Starts at nine", Category.EVENT, NOW);
        when(service.search("kick", Category.EVENT, 0, 10)).thenReturn(new PageResponse<>(List.of(summary), 0, 10, 1, 1));

        mvc.perform(get("/api/announcements/search").param("q", "kick").param("category", "EVENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value("Kick-off"))
                .andExpect(jsonPath("$.items[0].body").doesNotExist())
                .andExpect(jsonPath("$.items[0].status").doesNotExist())
                .andExpect(jsonPath("$.items[0].createdBy").doesNotExist())
                .andExpect(jsonPath("$.totalItems").value(1));
    }

    @Test
    void searchRejectsOutOfRangeParameters() throws Exception {
        mvc.perform(get("/api/announcements/search").param("size", "51").param("page", "-1")
                        .param("q", "x".repeat(101)))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("size", "page", "q")));
        verifyNoInteractions(service);
    }

    @Test
    void searchIgnoresMalformedBearerTokens() throws Exception {
        when(service.search(null, null, 0, 10)).thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0));

        mvc.perform(get("/api/announcements/search").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isOk());
        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void searchRejectsUnknownCategory() throws Exception {
        mvc.perform(get("/api/announcements/search").param("category", "OTHER"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void listPassesStatusFilterAndPaging() throws Exception {
        when(service.list(Status.DRAFT, 1, 5)).thenReturn(new PageResponse<>(List.of(), 1, 5, 0, 0));

        mvc.perform(get("/api/announcements").param("status", "DRAFT").param("page", "1").param("size", "5").with(alice()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1));
    }

    @Test
    void getReturnsFullDetail() throws Exception {
        when(service.get(1L)).thenReturn(item(1L));

        mvc.perform(get("/api/announcements/1").with(alice()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("Room 1"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void unknownIdIsProblem404() throws Exception {
        when(service.get(9L)).thenThrow(new AnnouncementNotFoundException(9L));

        mvc.perform(get("/api/announcements/9").with(alice()))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.detail").value("Announcement 9 not found"));
    }

    @Test
    void nonNumericIdIsNotRoutedToDetail() throws Exception {
        mvc.perform(get("/api/announcements/abc").with(alice())).andExpect(status().isNotFound());
        verifyNoInteractions(service);
    }

    @Test
    void createReturns201WithLocationAndAuthorFromToken() throws Exception {
        when(service.create(any(), eq("alice"))).thenReturn(item(5L));

        mvc.perform(post("/api/announcements").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY).with(alice()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/announcements/5"))
                .andExpect(jsonPath("$.id").value(5));
    }

    @Test
    void createTrimsTextBeforeValidation() throws Exception {
        var body = """
                {"title":"  ab  ","summary":"   ","body":"x","category":"EVENT","status":"DRAFT"}
                """;
        mvc.perform(post("/api/announcements").contentType(MediaType.APPLICATION_JSON).content(body).with(alice()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("title", "summary")));
        verifyNoInteractions(service);
    }

    @Test
    void createRejectsMalformedJsonAndUnknownEnum() throws Exception {
        mvc.perform(post("/api/announcements").contentType(MediaType.APPLICATION_JSON).content("{").with(alice()))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/announcements").contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY.replace("EVENT", "PARTY")).with(alice()))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void updateAndDelete() throws Exception {
        when(service.update(eq(1L), any())).thenReturn(item(1L));

        mvc.perform(put("/api/announcements/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY).with(alice()))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/announcements/1").with(alice())).andExpect(status().isNoContent());
        verify(service).delete(1L);
    }

    @Test
    void deleteUnknownIdIs404() throws Exception {
        doThrow(new AnnouncementNotFoundException(9L)).when(service).delete(9L);

        mvc.perform(delete("/api/announcements/9").with(alice())).andExpect(status().isNotFound());
    }

    private static AnnouncementItem item(Long id) {
        return new AnnouncementItem(id, "Kick-off", "Starts at nine", "Room 1", Category.EVENT, Status.PUBLISHED,
                NOW, NOW, NOW, "anonymous");
    }
}
