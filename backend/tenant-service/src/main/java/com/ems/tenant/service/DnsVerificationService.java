package com.ems.tenant.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

@Service
@Slf4j
public class DnsVerificationService {

    private static final String DNS_PROVIDER = "dns://8.8.8.8";
    private static final String VERIFICATION_PREFIX = "bitx-verify=";

    public boolean verifyTxtRecord(String domain, String expectedToken) {
        log.debug("Verifying TXT record for domain: {}", domain);

        try {
            List<String> txtRecords = lookupTxtRecords(domain);

            for (String record : txtRecords) {
                String cleanRecord = record.replace("\"", "").trim();
                log.debug("Found TXT record: {}", cleanRecord);

                if (cleanRecord.equals(expectedToken)) {
                    log.info("Domain verification successful for: {}", domain);
                    return true;
                }

                // Also check with verification prefix
                if (cleanRecord.startsWith(VERIFICATION_PREFIX)) {
                    String tokenValue = cleanRecord.substring(VERIFICATION_PREFIX.length());
                    if (tokenValue.equals(expectedToken) ||
                        expectedToken.equals(VERIFICATION_PREFIX + tokenValue)) {
                        log.info("Domain verification successful for: {}", domain);
                        return true;
                    }
                }
            }

            log.warn("No matching TXT record found for domain: {}", domain);
            return false;

        } catch (NamingException e) {
            log.error("DNS lookup failed for domain: {}", domain, e);
            return false;
        }
    }

    public List<String> lookupTxtRecords(String domain) throws NamingException {
        List<String> txtRecords = new ArrayList<>();

        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("java.naming.provider.url", DNS_PROVIDER);
        env.put("com.sun.jndi.dns.timeout.initial", "5000");
        env.put("com.sun.jndi.dns.timeout.retries", "2");

        try {
            DirContext ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(domain, new String[]{"TXT"});
            Attribute txtAttr = attrs.get("TXT");

            if (txtAttr != null) {
                NamingEnumeration<?> values = txtAttr.getAll();
                while (values.hasMore()) {
                    Object value = values.next();
                    if (value != null) {
                        txtRecords.add(value.toString());
                    }
                }
            }

            ctx.close();
        } catch (NamingException e) {
            // Try with _dmarc prefix for subdomain verification
            log.debug("Primary TXT lookup failed, trying _ems-verify subdomain");
            try {
                DirContext ctx = new InitialDirContext(env);
                Attributes attrs = ctx.getAttributes("_ems-verify." + domain, new String[]{"TXT"});
                Attribute txtAttr = attrs.get("TXT");

                if (txtAttr != null) {
                    NamingEnumeration<?> values = txtAttr.getAll();
                    while (values.hasMore()) {
                        Object value = values.next();
                        if (value != null) {
                            txtRecords.add(value.toString());
                        }
                    }
                }
                ctx.close();
            } catch (NamingException ex) {
                throw e; // Throw original exception
            }
        }

        return txtRecords;
    }

    public String generateVerificationInstructions(String domain, String token) {
        return String.format("""
            To verify ownership of %s, add a TXT record with the following value:

            Option 1 - Root domain TXT record:
            Host: @ (or %s)
            Type: TXT
            Value: %s

            Option 2 - Subdomain TXT record:
            Host: _ems-verify
            Type: TXT
            Value: %s

            DNS changes may take up to 48 hours to propagate.
            """, domain, domain, token, token);
    }
}
