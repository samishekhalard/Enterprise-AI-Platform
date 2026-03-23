-- Seed default agent categories

INSERT INTO agent_categories (id, name, description, icon, display_order) VALUES
    ('00000000-0000-0000-0000-000000000001', 'General Assistant', 'General-purpose AI assistants for everyday tasks', 'chat', 1),
    ('00000000-0000-0000-0000-000000000002', 'Writing & Content', 'Assistants for writing, editing, and content creation', 'edit', 2),
    ('00000000-0000-0000-0000-000000000003', 'Code & Development', 'Programming and software development assistants', 'code', 3),
    ('00000000-0000-0000-0000-000000000004', 'Data Analysis', 'Data analysis, visualization, and insights', 'chart', 4),
    ('00000000-0000-0000-0000-000000000005', 'Research', 'Research assistants and knowledge experts', 'search', 5),
    ('00000000-0000-0000-0000-000000000006', 'Customer Support', 'Customer service and support agents', 'support', 6),
    ('00000000-0000-0000-0000-000000000007', 'Education', 'Learning and educational assistants', 'school', 7),
    ('00000000-0000-0000-0000-000000000008', 'Productivity', 'Task management and productivity tools', 'task', 8),
    ('00000000-0000-0000-0000-000000000009', 'Creative', 'Creative and brainstorming assistants', 'lightbulb', 9),
    ('00000000-0000-0000-0000-00000000000a', 'Domain Expert', 'Specialized domain knowledge agents', 'expert', 10);
