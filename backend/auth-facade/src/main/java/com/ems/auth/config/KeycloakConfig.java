package com.ems.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "keycloak")
@Getter
@Setter
public class KeycloakConfig {

    private String serverUrl;
    private String masterRealm = "master";
    private Admin admin = new Admin();
    private Client client = new Client();

    @Getter
    @Setter
    public static class Admin {
        private String username;
        private String password;
        private String clientId = "admin-cli";
    }

    @Getter
    @Setter
    public static class Client {
        private String clientId;
        private String clientSecret;
    }

    public String getTokenEndpoint(String realm) {
        return serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";
    }

    public String getUserInfoEndpoint(String realm) {
        return serverUrl + "/realms/" + realm + "/protocol/openid-connect/userinfo";
    }

    public String getLogoutEndpoint(String realm) {
        return serverUrl + "/realms/" + realm + "/protocol/openid-connect/logout";
    }

    public String getJwksUri(String realm) {
        return serverUrl + "/realms/" + realm + "/protocol/openid-connect/certs";
    }
}
