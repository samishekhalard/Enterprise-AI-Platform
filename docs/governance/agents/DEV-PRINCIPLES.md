# DEV Agent Principles v1.2

## Version

- **Version:** 1.2.0
- **Last Updated:** 2026-02-27
- **Changelog:** [See bottom of document](#changelog)

---

## MANDATORY (Read Before Any Work)

These rules are NON-NEGOTIABLE. DEV agent MUST follow them.

1. **Follow SA LLD specifications** - Implementation must match approved low-level design
2. **SOLID principles required** - All code must follow Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
3. **Test-first development** - Write tests before or alongside implementation
4. **Security by design** - OWASP Top 10 mitigations in every feature
5. **Multi-tenancy enforced** - All data access filtered by tenant_id
6. **Code review required** - No direct merges to main branch
7. **Consistent patterns** - Follow established project conventions
8. **Clean code standards** - Readable, maintainable, self-documenting
9. **No secrets in code** - All sensitive data via environment/Vault
10. **Document public APIs** - JavaDoc/TSDoc for all public methods

---

## Standards

### Technology Stack (Verified)

| Layer | Technology | Version |
|-------|------------|---------|
| Language | Java | 23 |
| Framework | Spring Boot | 3.4.1 |
| Build | Maven | 3.9+ |
| ORM | Spring Data JPA / Neo4j | Latest |
| Migrations | Flyway | 10+ |
| Testing | JUnit 5 + Testcontainers | Latest |
| Frontend | Angular | 21 |
| State | Signals | Built-in |
| UI Library | PrimeNG | Latest |

### Java/Spring Boot Standards

#### Package Structure

```
com.ems.{service}/
    config/         # Configuration classes
    controller/     # REST controllers
    service/        # Business logic interfaces
        impl/       # Service implementations
    repository/     # Data access
    domain/         # JPA entities
    dto/            # Data transfer objects
    mapper/         # DTO-Entity mappers
    exception/      # Custom exceptions
    filter/         # Request filters
    security/       # Security components
```

#### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `UserService`, `TenantController` |
| Methods | camelCase | `findByTenantId()`, `createUser()` |
| Constants | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Packages | lowercase | `com.ems.tenant` |
| Interfaces | No prefix | `UserService` (not `IUserService`) |
| Implementations | Suffix | `UserServiceImpl` |

#### Controller Standards

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<UserDTO>> findAll(
            @RequestHeader("X-Tenant-ID") String tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(userService.findAll(tenantId, pageable));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<UserDTO> create(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.create(tenantId, request));
    }
}
```

#### Service Layer Standards

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public Page<UserDTO> findAll(String tenantId, Pageable pageable) {
        return userRepository.findByTenantId(tenantId, pageable)
            .map(userMapper::toDTO);
    }

    @Override
    @Transactional
    public UserDTO create(String tenantId, CreateUserRequest request) {
        // Implementation
    }
}
```

#### Entity Standards

```java
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### Angular/TypeScript Standards

#### Project Structure

```
src/app/
    core/           # Singleton services, guards
    shared/         # Reusable components, pipes
    features/       # Feature modules
        {feature}/
            components/
            services/
            models/
            pages/
    models/         # Shared interfaces
    services/       # Shared services
```

#### Component Standards

```typescript
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  private readonly userService = inject(UserService);

  users = signal<User[]>([]);
  loading = signal(false);

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userService.findAll().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(users => this.users.set(users));
  }
}
```

#### Service Standards

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/users';

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }
}
```

### Testing Standards

| Test Type | Coverage Target | Framework |
|-----------|-----------------|-----------|
| Unit Tests | 80% line coverage | JUnit 5 / Jasmine |
| Integration Tests | Critical paths | Testcontainers |
| E2E Tests | Happy paths | Playwright |

#### Unit Test Pattern

```java
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void findAll_shouldReturnUsers_whenTenantExists() {
        // Given
        String tenantId = "tenant-1";
        Pageable pageable = PageRequest.of(0, 10);
        // ... setup mocks

        // When
        Page<UserDTO> result = userService.findAll(tenantId, pageable);

        // Then
        assertThat(result).isNotEmpty();
        verify(userRepository).findByTenantId(tenantId, pageable);
    }
}
```

### Security Standards (OWASP)

| Vulnerability | Mitigation |
|---------------|------------|
| **Injection** | Parameterized queries, input validation |
| **Broken Auth** | JWT validation, session management |
| **Sensitive Data** | Encryption at rest/transit, no secrets in code |
| **XXE** | Disable external entities in XML parsers |
| **Broken Access** | RBAC + tenant isolation checks |
| **Misconfiguration** | Secure defaults, hardened headers |
| **XSS** | Output encoding, CSP headers |
| **Insecure Deserialization** | Avoid deserializing untrusted data |
| **Vulnerable Components** | Dependency scanning, updates |
| **Insufficient Logging** | Audit logging, monitoring |

---

## Forbidden Practices

These actions are EXPLICITLY PROHIBITED:

- Never commit secrets, passwords, or API keys to repository
- Never use `@Query` with string concatenation (SQL injection)
- Never bypass tenant isolation filters
- Never disable CSRF protection without SEC approval
- Never use `@SuppressWarnings` to hide security issues
- Never catch and swallow exceptions silently
- Never use `System.out.println` for logging (use SLF4J)
- Never create God classes (>500 lines)
- Never use static mutable state
- Never skip input validation
- Never use `@Autowired` field injection (use constructor)
- Never push directly to main branch
- Never skip tests for "simple" changes
- Never hardcode environment-specific values
- Never build custom tab/button/form visual systems for Admin/Tenant UI when PrimeNG equivalents exist
- Never add module-level global shortcuts (`accesskey`, `aria-keyshortcuts`) to Tenant Administration flows

---

## Definition of Done — DEV Gate (MANDATORY)

**Added:** 2026-02-26
**Reason:** Dev agent marked tasks complete without executing tests or verifying all quality gates.

### DEV Agent MUST NOT Mark "Done" Until:

| Gate | Requirement | How to Verify |
|------|-------------|---------------|
| **Code compiles** | Zero compilation errors | `mvn compile` / `ng build` |
| **Unit tests pass** | All unit tests green, >=80% coverage | `mvn test` / `npx vitest run` |
| **Integration tests pass** | API tests pass with Testcontainers | `mvn verify -Pintegration` |
| **E2E tests pass** (if UI) | Playwright tests pass | `npx playwright test` |
| **Responsive verified** (if UI) | Desktop + Tablet + Mobile viewports | Playwright viewport configs |
| **Build green** | Full build passes | `mvn clean verify` / `ng build --configuration=production` |
| **Security basics** | No secrets in code, input validated, tenant isolated | Code review |

### If DEV Cannot Execute Tests

1. **Write the tests** — Always deliver test files
2. **Flag clearly** — "Tests written, execution pending — [reason]"
3. **Do NOT mark as complete** — Use status: "Code Complete, Tests Pending"
4. **Hand off to QA** — QA agent executes and verifies

### Test Co-Delivery Rule

**RULE: Code without tests is incomplete code.**

For every code file delivered, DEV MUST also deliver:

| Code File | Required Test File |
|-----------|-------------------|
| `*Controller.java` | `*ControllerTest.java` (unit) + `*ControllerIntegrationTest.java` (integration) |
| `*ServiceImpl.java` | `*ServiceTest.java` (unit) |
| `*Repository.java` | `*RepositoryTest.java` (integration with Testcontainers) |
| `*.component.ts` | `*.component.spec.ts` (Vitest) |
| `*.service.ts` | `*.service.spec.ts` (Vitest) |
| New UI page | `*.e2e.ts` (Playwright E2E) |

---

## Checklist Before Completion

Before completing ANY development task, verify:

### Code Quality
- [ ] SA LLD specifications followed
- [ ] SOLID principles applied
- [ ] No secrets in code (verified with scan)
- [ ] Input validation on all user inputs
- [ ] Output encoding for XSS prevention
- [ ] Tenant isolation enforced
- [ ] Exception handling implemented
- [ ] Logging added (no sensitive data)
- [ ] JavaDoc/TSDoc for public methods
- [ ] All diagrams in docs use Mermaid syntax (no ASCII art)
- [ ] Admin/Tenant screens use PrimeNG components first; custom CSS is layout-only and allowlisted
- [ ] Code formatted per project standards
- [ ] No compiler warnings
- [ ] Dependency check passed (no vulnerabilities)

### Testing (MANDATORY — NEW)
- [ ] Unit tests written AND executed with >80% coverage
- [ ] Integration tests written AND executed for API endpoints
- [ ] E2E tests written AND executed for UI features
- [ ] Responsive tests verify desktop + tablet + mobile (if UI)
- [ ] Accessibility tests pass at AAA level (if UI)
- [ ] All existing tests still pass (no regressions)
- [ ] Test execution evidence provided (pass/fail counts, coverage %)

### Handoff
- [ ] Code review requested
- [ ] Test files delivered alongside code files
- [ ] QA agent notified for sign-off

---

## Git Workflow

### Branch Naming

```
feature/{JIRA-ID}-short-description
bugfix/{JIRA-ID}-short-description
hotfix/{JIRA-ID}-short-description
```

### Commit Message Format

```
type(scope): short description

Longer description if needed.

Refs: JIRA-123
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### PR Requirements

- [ ] Passes CI pipeline
- [ ] Has at least 1 approval
- [ ] No merge conflicts
- [ ] All comments resolved
- [ ] Tests pass locally

---

## Continuous Improvement

### How to Suggest Improvements

1. Log suggestion in Feedback Log below
2. Include code examples if applicable
3. DEV principles reviewed quarterly
4. Approved changes increment version

### Feedback Log

| Date | Suggestion | Rationale | Status |
|------|------------|-----------|--------|
| - | No suggestions yet | - | - |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2026-02-27 | Added PrimeNG-first governance rule for Admin/Tenant UI, custom CSS allowlist requirement, and no module-level global shortcuts policy |
| 1.1.0 | 2026-02-26 | Added Definition of Done DEV gate, mandatory test co-delivery rule, test execution requirements, expanded completion checklist |
| 1.0.0 | 2026-02-25 | Initial DEV principles |

---

## References

- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [GOVERNANCE-FRAMEWORK.md](../GOVERNANCE-FRAMEWORK.md)
