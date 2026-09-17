package com.wachichaw.Deployment;

import com.wachichaw.Client.Entity.ClientEntity;
import com.wachichaw.Client.Entity.TempClient;
import com.wachichaw.EmailConfig.Controller.VerificationController;
import com.wachichaw.EmailConfig.Service.EmailDeliveryException;
import com.wachichaw.EmailConfig.Service.VerificationService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VerificationResendTest {
    private final VerificationService email = mock(VerificationService.class);
    private final TempClient pending = new TempClient();
    private VerificationController controller() {
        var controller = new VerificationController(email);
        ReflectionTestUtils.setField(controller, "tempClientStorageService", pending);
        return controller;
    }
    private ClientEntity register() {
        var client = new ClientEntity();
        client.setEmail("test@example.test");
        client.setFname("Test");
        pending.saveUnverifiedUser("123456", client);
        return client;
    }
    @Test void expiredRegistrationReturns404WithoutSending() {
        assertEquals(404, controller().resendCodeClient("test@example.test").getStatusCode().value());
        verifyNoInteractions(email);
    }
    @Test void resendKeepsThePendingCodeValid() {
        var client = register();
        assertEquals(200, controller().resendCodeClient(client.getEmail()).getStatusCode().value());
        verify(email).sendVerificationEmail(client.getEmail(), "Test", "123456");
        assertSame(client, pending.getUnverifiedUser("123456"));
    }
    @Test void providerFailureReturns503AndPreservesRegistration() {
        var client = register();
        doThrow(new EmailDeliveryException("Unavailable")).when(email)
            .sendVerificationEmail(client.getEmail(), "Test", "123456");
        assertEquals(503, controller().resendCodeClient(client.getEmail()).getStatusCode().value());
        assertSame(client, pending.getUnverifiedUser("123456"));
    }
}
