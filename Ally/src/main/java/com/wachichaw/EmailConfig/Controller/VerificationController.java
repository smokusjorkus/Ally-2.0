package com.wachichaw.EmailConfig.Controller;

import java.nio.file.AccessDeniedException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.integration.IntegrationProperties.RSocket.Client;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.method.P;

import java.util.Map;
import java.util.Optional;

import com.wachichaw.Client.Entity.TempClient;

import com.wachichaw.Client.Entity.ClientEntity;
import com.wachichaw.User.Entity.AccountType;
import com.wachichaw.User.Entity.UserEntity;
import com.wachichaw.User.Service.UserService;

import io.swagger.v3.oas.annotations.parameters.RequestBody;

import com.wachichaw.EmailConfig.Service.VerificationService;
import com.wachichaw.Lawyer.Controller.LawyerController;
import com.wachichaw.Lawyer.Entity.LawyerEntity;
import com.wachichaw.Lawyer.Entity.TempLawyer;

@RestController
public class VerificationController {
    @SuppressWarnings("unused")
    private final VerificationService verificationService;
    @Autowired
    private TempClient tempClientStorageService;
    @Autowired
    private TempLawyer tempLawyerStorageService;

    
    public VerificationController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @Autowired
    private UserService userService; 

    @PostMapping("/resendCodeClient")
    public ResponseEntity<String> resendCodeClient(@RequestParam String email) {
        String token = tempClientStorageService.getTokenByEmail(email);
        ClientEntity client = token == null ? null : tempClientStorageService.getUnverifiedUser(token);
        if (client == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Your pending registration has expired. Please register again.");
        }
        try {
            verificationService.sendVerificationEmail(client.getEmail(), client.getFname(), token);
            return ResponseEntity.ok("Verification email accepted for sending.");
        } catch (com.wachichaw.EmailConfig.Service.EmailDeliveryException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("The email provider could not accept your verification email. Please try again shortly.");
        }
    }

    @PostMapping("/resendCodeLawyer")
    public ResponseEntity<String> resendCodeLawyer(@RequestParam String email) {
        String token = tempLawyerStorageService.getTokenByEmail(email);
         LawyerEntity lawyer = tempLawyerStorageService.getUnverifiedUser(token); 
        userService.createLawyer(
        lawyer.getEmail(),
        lawyer.getPassword(),
        lawyer.getFname(),
        lawyer.getLname(),
        lawyer.getPhoneNumber(),
        lawyer.getAddress(),
        lawyer.getCity(),
        lawyer.getProvince(),
        lawyer.getZip(),
        lawyer.getBarNumber(),
        lawyer.getSpecialization(),
        lawyer.getExperience(),
        lawyer.getCredentials(),
        lawyer.getEducationInstitution(),
        lawyer.getProfilePhotoUrl()
        );
        tempClientStorageService.removeUnverifiedUser(token);
        return ResponseEntity.ok("Code Resent Successfully");
    }

    @PostMapping("/verifyClient")
    public ResponseEntity<?> verifyAccountClient(@RequestParam String token) throws AccessDeniedException {


        ClientEntity client = tempClientStorageService.getUnverifiedUser(token);

        if (client == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Invalid verification code"));
        }

        userService.saveClient(
                client.getEmail(),
                client.getPassword(),
                client.getFname(),
                client.getLname(),
                client.getPhoneNumber(),
                client.getAddress(),
                client.getCity(),
                client.getProvince(),
                client.getZip(),
                client.getProfilePhotoUrl()
        );

        userService.verifyClient(client.getEmail());

        tempClientStorageService.removeUnverifiedUser(token);

        return ResponseEntity.ok()
                .body(Map.of("success", true));
    }
    @PostMapping("/verifyLawyer")
    public ResponseEntity<?> verifyAccountLawyer(@RequestParam String token) throws AccessDeniedException {
        LawyerEntity lawyer = tempLawyerStorageService.getUnverifiedUser(token);
        
    
         
        userService.saveLawyer(
        lawyer.getEmail(),
        lawyer.getPassword(),
        lawyer.getFname(),
        lawyer.getLname(),
        lawyer.getPhoneNumber(),
        lawyer.getAddress(),
        lawyer.getCity(),
        lawyer.getProvince(),
        lawyer.getZip(),
        lawyer.getBarNumber(),
        lawyer.getSpecialization(),
        lawyer.getExperience(),
        lawyer.getCredentials(),
        lawyer.getEducationInstitution(),
        lawyer.getProfilePhotoUrl()

        );
        userService.verifyLawyer(lawyer.getEmail()); 
        tempClientStorageService.removeUnverifiedUser(token);
        return ResponseEntity.ok().body(Map.of("success", true));
            
    }
}
