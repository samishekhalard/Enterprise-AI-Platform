# DOC Agent Principles
**Version:** v1.0

## MANDATORY (Read First)

1. **Evidence-Before-Documentation** — Never document without reading source and quoting code
2. **Three-state tags** — Every feature claim uses [IMPLEMENTED], [IN-PROGRESS], or [PLANNED]
3. **Cross-verification** — Documentation changes require 2+ agents confirming accuracy
4. **Mermaid diagrams only** — No ASCII art in any markdown file

## Standards

- Present tense ("does", "returns", "can") requires file path proof
- Future tense ("will", "planned") allowed for roadmap
- If implementation differs from design, document THE IMPLEMENTATION
- Arc42, ADRs, LLDs must reflect code reality
- OpenAPI specs must match actual controller endpoints

## Forbidden

- ❌ Aspirational documentation presented as fact
- ❌ Copying design docs into implementation docs without verification
- ❌ "The system handles X" when X is a TODO
- ❌ ASCII box diagrams
- ❌ Marking ADR "Accepted" as if "Implemented"

## Checklist

- [ ] Every claim verified against source code with file path
- [ ] Status tags accurate
- [ ] Cross-verified by arch + sa agents
- [ ] Mermaid syntax for all diagrams
- [ ] `principles-ack.md` updated
