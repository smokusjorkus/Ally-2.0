package com.wachichaw.Config;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;

@Configuration
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oauthLogin;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${cors.allowed-origin-patterns}")
    private String corsAllowedOriginPatterns;

    public SecurityConfig(
            OAuth2LoginSuccessHandler oauthLogin,
            ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository
    ) {
        this.oauthLogin = oauthLogin;
        this.clientRegistrationRepository = clientRegistrationRepository.getIfAvailable();
    }

    @Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)) // <-- Change this!
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers(
                "/api-docs/**",
                "/swagger-ui/**",
                "/api-docs/**",
                "/swagger-resources/**",
                "/swagger-ui/index.html/",
                "/swagger-ui/index.html#/",
                "/users/Client",
                "/users/Lawyer",
                "/users/login",
                "/users/**",
                "/login/oauth2/code/google",
                "/error", "/login**", "/oauth2/**",
                "/verifyClient","/api/email/send","/verifyLawyer"
            ).permitAll()
            .anyRequest().permitAll())
        .httpBasic(Customizer.withDefaults());

    if (clientRegistrationRepository != null) {
        http.oauth2Login(oauth2 -> oauth2
            .successHandler(oauthLogin)
            .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcUserService())));
    }

    return http.build();
}
     @Bean
        public OidcUserService oidcUserService() {
            return new OidcUserService();
        }
     @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration());
        return source;
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration());

        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    private CorsConfiguration corsConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOriginPatterns = new ArrayList<>(Arrays.asList(corsAllowedOriginPatterns.split(",")));
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            allowedOriginPatterns.add(frontendUrl);
        }
        configuration.setAllowedOriginPatterns(
            allowedOriginPatterns.stream()
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .distinct()
                .toList()
        );
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")); // Allowed HTTP methods
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        return configuration;
    }
}
