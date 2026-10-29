package org.entando.training.announcement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.StringUtils;

/**
 * Phase B (step 20): every request needs a valid Keycloak access token, except
 * <ul>
 *   <li>{@code GET /api/announcements/search} — the public search;</li>
 *   <li>{@code GET /api/health} — the Entando/Kubernetes health probe;</li>
 *   <li>CORS preflight requests.</li>
 * </ul>
 * Authentication only: any valid token of the realm is accepted, no roles are checked.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** The only anonymous business operation. Exact method and path, no wildcards. */
    static final RequestMatcher PUBLIC_SEARCH =
            PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.GET, "/api/announcements/search");

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, ProblemDetailsSecurityHandler problemHandler) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_SEARCH).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health", "/api/health/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(ignoringTokensFor(PUBLIC_SEARCH))
                        .authenticationEntryPoint(problemHandler)
                        .accessDeniedHandler(problemHandler)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(usernameAsPrincipal())))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(problemHandler)
                        .accessDeniedHandler(problemHandler));
        return http.build();
    }

    /**
     * The public search ignores credentials entirely: a missing, malformed or
     * expired token gives the same anonymous result instead of a 401.
     */
    static BearerTokenResolver ignoringTokensFor(RequestMatcher publicRequests) {
        var delegate = new DefaultBearerTokenResolver();
        return request -> publicRequests.matches(request) ? null : delegate.resolve(request);
    }

    /** Principal name = Keycloak's preferred_username (falls back to the subject). */
    static Converter<Jwt, AbstractAuthenticationToken> usernameAsPrincipal() {
        return jwt -> {
            var username = jwt.getClaimAsString("preferred_username");
            return new JwtAuthenticationToken(jwt, null, StringUtils.hasText(username) ? username : jwt.getSubject());
        };
    }
}
