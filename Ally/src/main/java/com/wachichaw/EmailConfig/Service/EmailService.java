package com.wachichaw.EmailConfig.Service;

import com.mailersend.sdk.MailerSend;
import com.mailersend.sdk.emails.Email;
import com.mailersend.sdk.exceptions.MailerSendException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

// The previous jakarta.mail imports are no longer needed, assuming you removed spring-boot-starter-mail

@Service
public class EmailService {

    // Inject the API Key from Render environment variables
    // The key in Render MUST be set to MAILERSEND_API_KEY
    @Value("${MAILERSEND_API_KEY:}") 
    private String apiToken;

    @Value("${mailersend.from-email:ally@test-2p0347zv7d3lzdrn.mlsender.net}")
    private String fromEmail;

    @Value("${mailersend.from-name:Ally Team}")
    private String fromName;

    // The old JavaMailSender is no longer used:
    // @Autowired
    // private JavaMailSender mailSender; 


    public void sendEmail(String to, String subject, String body) {
        if (!StringUtils.hasText(to) || !StringUtils.hasText(subject) || !StringUtils.hasText(body)) {
            throw new IllegalArgumentException("Email to, subject, and body must not be empty");
        }
        if (!StringUtils.hasText(apiToken)) {
            throw new IllegalStateException("MAILERSEND_API_KEY is not configured");
        }

        // 🚨 DEBUG CODE ADDED HERE 🚨
        System.out.println("DEBUG: Loaded API Token (First 8 characters): " + (apiToken != null ? apiToken.substring(0, Math.min(apiToken.length(), 8)) + "..." : "NULL/Empty"));
        // 🚨 REMOVE THIS LINE AFTER TESTING! 🚨

        // --- FIX IS HERE ---
        // 1. Initialize MailerSend client *without* arguments.
        MailerSend mailersend = new MailerSend(); 
        
        // 2. Set the API token using the setter method.
        mailersend.setToken(apiToken);
        // --- END FIX ---


        // Build the email object
        Email email = new Email();
        
        try {
            // Set sender details
            email.setFrom(fromName, fromEmail); 
            
            // Add the recipient. MailerSend API uses the recipient email/name pattern
            email.addRecipient("to", to); 
            
            // Set subject and content
            email.setSubject(subject);
            email.setHtml(body); 
            
            // Send the email via API call
            mailersend.emails().send(email);

            System.out.println("Email sent successfully via MailerSend API to: " + to);
            
        } catch (MailerSendException e) {
            // Catch the specific exception thrown by the MailerSend SDK
            System.out.println("Error sending email via API to: " + to + ". Reason: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send email to " + to, e);
        }
    }

    public void sendAppointmentReminder(String to, String userName, java.time.LocalDateTime appointmentTime, String userType) {
        String subject = "Appointment Reminder";
        String body = "<html>" +
                "<body>" +
                "<h3>Hi " + userName + ",</h3>" +
                "<p>This is a reminder for your upcoming appointment on " + appointmentTime.toLocalDate() + " at " + appointmentTime.toLocalTime() + ".</p>" +
                "<p>Thank you,</p>" +
                "<p>Ally Team</p>" +
                "</body>" +
                "</html>";
        sendEmail(to, subject, body);
    }
}
