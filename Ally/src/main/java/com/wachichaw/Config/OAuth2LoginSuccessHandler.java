package com.wachichaw.Config;

import java.io.IOException;
import java.net.URLEncoder;
import java.util.Optional;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import com.wachichaw.User.Entity.UserEntity;
import com.wachichaw.User.Repo.UserRepo;
import com.wachichaw.Config.JwtUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepo userRepo;

    @Value("${frontend.url}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(JwtUtil jwtUtil, UserRepo userRepo) {
        this.jwtUtil = jwtUtil;
        this.userRepo = userRepo;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
    System.out.println("OAuth2 User Attributes: " + oAuth2User.getAttributes());
    String email = oAuth2User.getAttribute("email");
    String fname = oAuth2User.getAttribute("given_name");
    String lname = oAuth2User.getAttribute("family_name");
    System.out.println(fname);

    Optional<UserEntity> existingUser = userRepo.findByEmail(email);
    String frontendBaseUrl = frontendUrl.replaceAll("/+$", "");
    String redirectUrl;

    if (!existingUser.isPresent()) {
        // New user: do NOT generate or send JWT
        redirectUrl = frontendBaseUrl + "/signup?email=" + encode(email)
            + "&fname=" + encode(fname)
            + "&lname=" + encode(lname);
    } else {
        // Existing user: generate and send JWT
        UserEntity user = existingUser.get();
        String jwtToken = jwtUtil.generateToken(user);
        response.setHeader("Authorization", "Bearer " + jwtToken);
        redirectUrl = frontendBaseUrl + "/oauth2-redirect?token=" + encode(jwtToken)
                + "&userId=" + user.getUserId()
                + "&role=" + encode(user.getAccountType().toString());
    }
    response.sendRedirect(redirectUrl);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
