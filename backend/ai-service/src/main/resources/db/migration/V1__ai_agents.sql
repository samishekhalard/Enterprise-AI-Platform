-- AI Service Database Schema
-- Version 1: Core AI tables for agents, conversations, messages, and knowledge

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent Categories
CREATE TABLE agent_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents (custom AI assistants)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    owner_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    system_prompt TEXT NOT NULL,
    greeting_message TEXT,
    conversation_starters JSONB DEFAULT '[]'::jsonb,
    provider VARCHAR(20) NOT NULL,
    model VARCHAR(50) NOT NULL,
    model_config JSONB DEFAULT '{}'::jsonb,
    rag_enabled BOOLEAN DEFAULT FALSE,
    category_id UUID REFERENCES agent_categories(id),
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    usage_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_agent_provider CHECK (provider IN ('OPENAI', 'ANTHROPIC', 'GEMINI', 'OLLAMA')),
    CONSTRAINT chk_agent_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DELETED'))
);

-- Indexes for agents
CREATE INDEX idx_agents_tenant ON agents(tenant_id);
CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agents_category ON agents(category_id);
CREATE INDEX idx_agents_public ON agents(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_agents_system ON agents(is_system) WHERE is_system = TRUE;
CREATE INDEX idx_agents_status ON agents(status);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title VARCHAR(200),
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_conversation_status CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED'))
);

-- Indexes for conversations
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    rag_context JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_message_role CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM'))
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Knowledge Sources (uploaded files or URLs)
CREATE TABLE knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(20) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(20),
    file_size BIGINT,
    url VARCHAR(1000),
    status VARCHAR(20) DEFAULT 'PENDING',
    chunk_count INTEGER DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_source_type CHECK (source_type IN ('FILE', 'URL', 'TEXT')),
    CONSTRAINT chk_file_type CHECK (file_type IS NULL OR file_type IN ('PDF', 'TXT', 'MD', 'CSV', 'DOCX')),
    CONSTRAINT chk_source_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- Indexes for knowledge sources
CREATE INDEX idx_knowledge_sources_agent ON knowledge_sources(agent_id);
CREATE INDEX idx_knowledge_sources_tenant ON knowledge_sources(tenant_id);
CREATE INDEX idx_knowledge_sources_status ON knowledge_sources(status);

-- Knowledge Chunks (with vector embeddings)
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    chunk_index INTEGER NOT NULL,
    token_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for knowledge chunks
CREATE INDEX idx_knowledge_chunks_source ON knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_agent ON knowledge_chunks(agent_id);

-- HNSW index for vector similarity search (cosine distance)
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
    USING hnsw (embedding vector_cosine_ops);

-- Agent Usage Statistics
CREATE TABLE agent_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(agent_id, user_id, date)
);

-- Indexes for usage stats
CREATE INDEX idx_usage_stats_agent ON agent_usage_stats(agent_id);
CREATE INDEX idx_usage_stats_tenant ON agent_usage_stats(tenant_id);
CREATE INDEX idx_usage_stats_date ON agent_usage_stats(date);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_sources_updated_at
    BEFORE UPDATE ON knowledge_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_usage_stats_updated_at
    BEFORE UPDATE ON agent_usage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
