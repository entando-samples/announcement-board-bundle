package org.entando.training.announcement.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/** Signs real JWTs with a throw-away RSA key, standing in for Keycloak in tests. */
public final class TestTokens {

    public static final String ISSUER = "http://keycloak.test/auth/realms/entando-dev";

    private static final RSAKey TRUSTED_KEY = generate();
    private static final RSAKey UNTRUSTED_KEY = generate();

    private TestTokens() {
    }

    /** Decoder that trusts only {@link #TRUSTED_KEY} and validates issuer and expiry. */
    public static JwtDecoder decoder() {
        try {
            var decoder = NimbusJwtDecoder.withPublicKey(TRUSTED_KEY.toRSAPublicKey()).build();
            decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(ISSUER));
            return decoder;
        } catch (JOSEException e) {
            throw new IllegalStateException(e);
        }
    }

    public static String valid(String username) {
        return sign(TRUSTED_KEY, ISSUER, username, Instant.now().plus(Duration.ofMinutes(5)));
    }

    public static String expired() {
        return sign(TRUSTED_KEY, ISSUER, "alice", Instant.now().minus(Duration.ofMinutes(10)));
    }

    public static String wrongIssuer() {
        return sign(TRUSTED_KEY, "http://evil.test/realms/entando-dev", "alice", Instant.now().plus(Duration.ofMinutes(5)));
    }

    public static String badSignature() {
        return sign(UNTRUSTED_KEY, ISSUER, "alice", Instant.now().plus(Duration.ofMinutes(5)));
    }

    private static String sign(RSAKey key, String issuer, String username, Instant expiresAt) {
        try {
            var claims = new JWTClaimsSet.Builder()
                    .issuer(issuer)
                    .subject("3f1c2a52-0000-4000-8000-" + Math.abs(username.hashCode()))
                    .claim("preferred_username", username)
                    .issueTime(Date.from(expiresAt.minus(Duration.ofMinutes(5))))
                    .expirationTime(Date.from(expiresAt))
                    .build();
            var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
            jwt.sign(new RSASSASigner(key));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException(e);
        }
    }

    private static RSAKey generate() {
        try {
            return new RSAKeyGenerator(2048).keyID(java.util.UUID.randomUUID().toString()).generate();
        } catch (JOSEException e) {
            throw new IllegalStateException(e);
        }
    }
}
