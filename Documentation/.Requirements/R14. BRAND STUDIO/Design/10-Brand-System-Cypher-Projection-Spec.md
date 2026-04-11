# R14 Brand System Cypher and Projection Spec

**Purpose:** define the Neo4j/System Cypher side of branding without confusing it with the authoritative brand store.

---

## 1. Frozen rule

System Cypher and Neo4j are **not** the source of truth for branding runtime data.

They are used only for:

- metamodel registration
- graph query semantics
- tenant fact-sheet relationship visibility
- optional graph visualization

Authoritative brand data remains in per-tenant PostgreSQL.

---

## 2. When this work happens

This work happens only if System Cypher is sanctioned.

Evidence from R02:

- System Cypher is still `[TARGET -- PENDING SANCTION]` in:
  - `R02 PRD -- Tenant Management`, Section 13.4

Therefore:

- runtime/API/persistence can proceed without System Cypher implementation
- graph registration is the first Neo4j step once sanction exists

---

## 3. What gets created first

If sanctioned, the first graph step is metamodel registration in master Neo4j `system`.

It should define only:

- `BrandProfile` as a valid graph entity type
- `HAS_ACTIVE_BRAND` as a valid relationship from `Tenant` to `BrandProfile`

It should **not** define brand runtime storage as graph-authored content.

---

## 4. Frozen System Cypher metamodel shape

### 4.1 Master `system` metamodel intent

Master System Cypher should carry the relationship contract, not the live tenant data.

Frozen metamodel concept:

```cypher
(:EntityType {key: 'Tenant'})
(:EntityType {key: 'BrandProfile'})
(:RelationshipType {
  key: 'HAS_ACTIVE_BRAND',
  source: 'Tenant',
  target: 'BrandProfile',
  cardinality: 'ONE_TO_ZERO_OR_ONE'
})
```

Optional metamodel links:

```cypher
(:EntityType {key: 'Tenant'})-[:ALLOWS_RELATIONSHIP]->(:RelationshipType {key: 'HAS_ACTIVE_BRAND'})
(:RelationshipType {key: 'HAS_ACTIVE_BRAND'})-[:TARGETS]->(:EntityType {key: 'BrandProfile'})
```

This is enough for:

- factsheet pattern reference
- relationship awareness
- future graph tooling

---

## 5. Frozen tenant graph projection

Once publish or rollback changes the active brand, project the active relation into the tenant graph.

Frozen tenant graph shape:

```cypher
(:Tenant {tenantId})
  -[:HAS_ACTIVE_BRAND]->
(:BrandProfile {
  brandProfileId,
  profileVersion,
  publishedAt
})
```

That is the only required branding relation in the tenant graph.

Do not add these unless a later sanctioned use case requires them:

- palette nodes
- typography nodes
- asset nodes
- icon library nodes
- draft nodes

Those remain outside graph scope for now.

---

## 6. Projection triggers

Projection updates are allowed only on:

- brand publish
- brand rollback
- active-brand reassignment by controlled admin flow

Projection updates are not allowed on:

- draft save
- preview
- validation-only flows
- local editor state

---

## 7. Projection writer responsibilities

Recommended ownership:

- tenant-service publishes authoritative brand activation event
- projection worker or tenant-service projection module writes Neo4j relation

Projection writer must:

1. identify tenant
2. remove any prior `HAS_ACTIVE_BRAND` relation for that tenant
3. upsert the target `BrandProfile` node
4. create exactly one `HAS_ACTIVE_BRAND` relation
5. preserve idempotency

---

## 8. Minimal node payload

Frozen `BrandProfile` node payload:

- `brandProfileId`
- `profileVersion`
- `publishedAt`

Do not copy the full brand manifest into Neo4j unless a later query requirement proves it is necessary.

Reason:

- runtime already reads the manifest from PostgreSQL
- duplicating the full manifest increases drift risk
- the fact-sheet/query use case only needs active-brand identity

---

## 9. Query examples

### 9.1 Factsheet relationship query

```cypher
MATCH (t:Tenant {tenantId: $tenantId})-[:HAS_ACTIVE_BRAND]->(b:BrandProfile)
RETURN t, b
```

### 9.2 Tenant list enrichment

```cypher
MATCH (t:Tenant)
OPTIONAL MATCH (t)-[:HAS_ACTIVE_BRAND]->(b:BrandProfile)
RETURN t.tenantId, t.name, b.brandProfileId, b.profileVersion, b.publishedAt
```

---

## 10. Non-goals

This spec does not authorize:

- graph-native brand authoring
- draft storage in Neo4j
- asset storage in Neo4j
- typography/palette selection in Neo4j
- frontend reading active runtime brand from Neo4j

---

## 11. Build order relative to runtime work

Frozen order:

1. sanction System Cypher
2. register `BrandProfile` and `HAS_ACTIVE_BRAND` in master `system`
3. build authoritative PostgreSQL persistence and brand APIs
4. build publish/rollback flow
5. implement tenant-graph projection on publish/rollback

So:

- yes, graph nodes/relationships belong in System Cypher first **for metamodel purposes**
- no, they do not come before the authoritative PostgreSQL/API design for runtime truth
