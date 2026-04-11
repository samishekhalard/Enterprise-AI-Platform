package com.ems.tenant;

import com.ems.tenant.config.TestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
@SpringBootTest
@Import(TestConfig.class)
@ActiveProfiles("test")
class TenantServiceApplicationTests {

    @Test
    void contextLoads() {
        // Verify Spring context loads successfully
    }
}
