package org.entando.training.announcement.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Phase A (steps 10-19): every operation must work WITHOUT credentials.
 * Step 20 replaces this expectation with the security matrix.
 */
@SpringBootTest(properties = "announcement.seed.enabled=false")
@AutoConfigureMockMvc
class PublicAccessIntegrationTest {

    private static final String DRAFT = """
            {"title":"Hidden draft","summary":"Not yet public","body":"Secret body","category":"GENERAL","status":"DRAFT"}
            """;

    @Autowired
    private MockMvc mvc;

    @Test
    void fullLifecycleWorksAnonymously() throws Exception {
        var created = mvc.perform(post("/api/announcements").contentType(MediaType.APPLICATION_JSON).content(DRAFT))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.createdBy").value("anonymous"))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(created, "$.id");

        mvc.perform(get("/api/announcements")).andExpect(status().isOk());
        mvc.perform(get("/api/announcements/{id}", id)).andExpect(status().isOk());

        // Drafts are never part of the public search.
        mvc.perform(get("/api/announcements/search").param("q", "hidden"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(0));

        mvc.perform(put("/api/announcements/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content(DRAFT.replace("DRAFT", "PUBLISHED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        mvc.perform(get("/api/announcements/search").param("q", "hidden"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(id))
                .andExpect(jsonPath("$.items[0].body").doesNotExist());

        mvc.perform(delete("/api/announcements/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/announcements/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void healthAndApiDocsAreAvailableAnonymously() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
    }
}
