package org.entando.training.announcement.security;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.containsStringIgnoringCase;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Phase B (step 20) security matrix, full stack, with real signed JWTs.
 * See doc/api/security-matrix.md.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SecurityIntegrationTest {

    private static final String DRAFT = """
            {"title":"Hidden draft","summary":"Not yet public","body":"Secret body","category":"GENERAL","status":"DRAFT"}
            """;

    @TestConfiguration
    static class TestKeycloak {

        @Bean
        JwtDecoder jwtDecoder() {
            return TestTokens.decoder();
        }
    }

    @Autowired
    private MockMvc mvc;

    /** A draft created once; anonymous calls must never reveal or change it. */
    private long probeId;

    @BeforeAll
    void createProbe() throws Exception {
        var json = mvc.perform(post("/api/announcements").contentType(MediaType.APPLICATION_JSON).content(DRAFT)
                        .header("Authorization", "Bearer " + TestTokens.valid("alice")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        probeId = ((Number) JsonPath.read(json, "$.id")).longValue();
    }

    // S1-S4: the public search is anonymous and ignores whatever credentials are sent.
    @ParameterizedTest(name = "search with {0}")
    @MethodSource("anyCredentials")
    void publicSearchIsAlwaysAnonymous(String label, String authorization) throws Exception {
        var request = get("/api/announcements/search").param("q", "hidden");
        if (authorization != null) {
            request.header("Authorization", authorization);
        }
        mvc.perform(request)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(0))
                .andExpect(content().string(not(containsString("Secret body"))));
    }

    static Stream<Arguments> anyCredentials() {
        return Stream.of(
                Arguments.of("no token", null),
                Arguments.of("valid token", "Bearer " + TestTokens.valid("alice")),
                Arguments.of("malformed token", "Bearer not.a.jwt"),
                Arguments.of("expired token", "Bearer " + TestTokens.expired()),
                Arguments.of("token with bad signature", "Bearer " + TestTokens.badSignature()),
                Arguments.of("non-bearer scheme", "Basic YWRtaW46YWRtaW4="));
    }

    // S5-S10, S13: every other operation rejects missing or invalid credentials.
    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("protectedRequestsWithBadCredentials")
    void protectedOperationsRejectBadCredentials(String operation, String credentials,
            MockHttpServletRequestBuilder request) throws Exception {
        mvc.perform(request)
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", startsWith("Bearer")))
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(content().string(not(containsString("Secret body"))))
                .andExpect(content().string(not(containsString("Hidden draft"))));
    }

    Stream<Arguments> protectedRequestsWithBadCredentials() {
        return Stream.of(
                        new Object[] {"no token", null},
                        new Object[] {"malformed token", "Bearer not.a.jwt"},
                        new Object[] {"expired token", "Bearer " + TestTokens.expired()},
                        new Object[] {"bad signature", "Bearer " + TestTokens.badSignature()},
                        new Object[] {"wrong issuer", "Bearer " + TestTokens.wrongIssuer()})
                .flatMap(c -> protectedRequests().map(r -> {
                    var request = (MockHttpServletRequestBuilder) r[1];
                    if (c[1] != null) {
                        request.header("Authorization", c[1]);
                    }
                    return Arguments.of(r[0], c[0], request);
                }));
    }

    private Stream<Object[]> protectedRequests() {
        return Stream.of(
                new Object[] {"GET list", get("/api/announcements")},
                new Object[] {"GET detail", get("/api/announcements/{id}", probeId)},
                new Object[] {"GET unknown id (no 404 leak)", get("/api/announcements/999999")},
                new Object[] {"POST", post("/api/announcements").contentType(MediaType.APPLICATION_JSON).content(DRAFT)},
                new Object[] {"PUT", put("/api/announcements/{id}", probeId).contentType(MediaType.APPLICATION_JSON)
                        .content(DRAFT)},
                new Object[] {"DELETE", delete("/api/announcements/{id}", probeId)},
                new Object[] {"GET OpenAPI", get("/v3/api-docs")});
    }

    // S11: a valid token allows the full lifecycle; the author comes from the token.
    @Test
    void validTokenAllowsTheFullLifecycle() throws Exception {
        var bearer = "Bearer " + TestTokens.valid("bob");
        var created = mvc.perform(post("/api/announcements").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content(DRAFT))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.createdBy").value("bob"))
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(created, "$.id")).longValue();

        mvc.perform(get("/api/announcements").header("Authorization", bearer)).andExpect(status().isOk());
        mvc.perform(get("/api/announcements/{id}", id).header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("Secret body"));
        mvc.perform(put("/api/announcements/{id}", id).header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content(DRAFT.replace("DRAFT", "PUBLISHED")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/announcements/search").param("q", "hidden"))
                .andExpect(jsonPath("$.items[0].id").value(id))
                .andExpect(jsonPath("$.items[0].body").doesNotExist());
        mvc.perform(delete("/api/announcements/{id}", id).header("Authorization", bearer))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/announcements/{id}", id).header("Authorization", bearer))
                .andExpect(status().isNotFound());
    }

    @Test
    void anonymousCallsChangeNothing() throws Exception {
        mvc.perform(delete("/api/announcements/{id}", probeId)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/announcements/{id}", probeId).header("Authorization", "Bearer " + TestTokens.valid("alice")))
                .andExpect(status().isOk());
    }

    // S14: the platform health probe stays anonymous.
    @Test
    void healthStaysAnonymous() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
    }

    // Only GET is public on the search path.
    @Test
    void otherMethodsOnTheSearchPathAreProtected() throws Exception {
        mvc.perform(post("/api/announcements/search")).andExpect(status().isUnauthorized());
    }

    // S16: CORS preflight for a protected call needs no token and allows the Authorization header.
    @Test
    void corsPreflightIsAllowedWithoutToken() throws Exception {
        mvc.perform(options("/api/announcements")
                        .header("Origin", "http://localhost:5174")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"))
                .andExpect(header().string("Access-Control-Allow-Headers", containsStringIgnoringCase("Authorization")));
    }
}
