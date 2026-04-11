-- =====================================================
-- V2__seed_bpmn_element_types.sql
-- Seed BPMN Element Types with ThinkPLUS BPMN colors
-- =====================================================
-- Color scheme:
--   Start Events:        #52B415 (green)    fill: #E8F5E9
--   End Events:          #C02520 (red)      fill: #FFEBEE
--   Intermediate Events: #F97316 (orange)   fill: #FFF7ED
--   Boundary Events:     #8B5CF6 (purple)   fill: #F5F3FF
--   Tasks:               #047481 (teal)     fill: #FFFFFF
--   Gateways:            #b9a779 (gold)     fill: #FFF8E1
--   Data/Artifacts:      #585858 (gray)
-- =====================================================

-- Clear existing system defaults (tenant_id IS NULL)
DELETE FROM bpmn_element_types WHERE tenant_id IS NULL;

-- =====================================================
-- EVENTS
-- =====================================================

-- Start Events (Green)
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:StartEvent', 'Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 100),
    (NULL, 'bpmn:StartEvent:message', 'Message Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 101),
    (NULL, 'bpmn:StartEvent:timer', 'Timer Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 102),
    (NULL, 'bpmn:StartEvent:conditional', 'Conditional Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 103),
    (NULL, 'bpmn:StartEvent:signal', 'Signal Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 104),
    (NULL, 'bpmn:StartEvent:error', 'Error Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 105),
    (NULL, 'bpmn:StartEvent:escalation', 'Escalation Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 106),
    (NULL, 'bpmn:StartEvent:compensation', 'Compensation Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 107),
    (NULL, 'bpmn:StartEvent:multiple', 'Multiple Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 108),
    (NULL, 'bpmn:StartEvent:parallelMultiple', 'Parallel Multiple Start Event', 'event', 'start', '#52B415', '#E8F5E9', 2.0, 36, 36, 109);

-- Intermediate Events (Orange #F97316)
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:IntermediateCatchEvent', 'Intermediate Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 200),
    (NULL, 'bpmn:IntermediateThrowEvent', 'Intermediate Throw Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 201),
    (NULL, 'bpmn:IntermediateCatchEvent:message', 'Message Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 202),
    (NULL, 'bpmn:IntermediateCatchEvent:timer', 'Timer Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 203),
    (NULL, 'bpmn:IntermediateCatchEvent:signal', 'Signal Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 204),
    (NULL, 'bpmn:IntermediateCatchEvent:conditional', 'Conditional Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 205),
    (NULL, 'bpmn:IntermediateThrowEvent:message', 'Message Throw Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 206),
    (NULL, 'bpmn:IntermediateThrowEvent:signal', 'Signal Throw Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 207),
    (NULL, 'bpmn:IntermediateThrowEvent:escalation', 'Escalation Throw Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 208),
    (NULL, 'bpmn:IntermediateThrowEvent:compensation', 'Compensation Throw Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 209),
    (NULL, 'bpmn:IntermediateThrowEvent:link', 'Link Throw Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 210),
    (NULL, 'bpmn:IntermediateCatchEvent:link', 'Link Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 211),
    (NULL, 'bpmn:IntermediateCatchEvent:error', 'Error Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 212),
    (NULL, 'bpmn:IntermediateCatchEvent:escalation', 'Escalation Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 213),
    (NULL, 'bpmn:IntermediateCatchEvent:cancel', 'Cancel Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 214),
    (NULL, 'bpmn:IntermediateCatchEvent:compensation', 'Compensation Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 215),
    (NULL, 'bpmn:IntermediateCatchEvent:multiple', 'Multiple Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 216),
    (NULL, 'bpmn:IntermediateCatchEvent:parallelMultiple', 'Parallel Multiple Catch Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 217),
    (NULL, 'bpmn:IntermediateThrowEvent:multiple', 'Multiple Throw Event', 'event', 'intermediate', '#F97316', '#FFF7ED', 2.0, 36, 36, 218);

-- Boundary Events (Purple #8B5CF6)
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:BoundaryEvent', 'Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 250),
    (NULL, 'bpmn:BoundaryEvent:message', 'Message Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 251),
    (NULL, 'bpmn:BoundaryEvent:timer', 'Timer Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 252),
    (NULL, 'bpmn:BoundaryEvent:error', 'Error Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 253),
    (NULL, 'bpmn:BoundaryEvent:signal', 'Signal Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 254),
    (NULL, 'bpmn:BoundaryEvent:escalation', 'Escalation Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 255),
    (NULL, 'bpmn:BoundaryEvent:compensation', 'Compensation Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 256),
    (NULL, 'bpmn:BoundaryEvent:conditional', 'Conditional Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 257),
    (NULL, 'bpmn:BoundaryEvent:cancel', 'Cancel Boundary Event', 'event', 'boundary', '#8B5CF6', '#F5F3FF', 2.0, 36, 36, 258);

-- End Events (Red)
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:EndEvent', 'End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 300),
    (NULL, 'bpmn:EndEvent:message', 'Message End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 301),
    (NULL, 'bpmn:EndEvent:error', 'Error End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 302),
    (NULL, 'bpmn:EndEvent:escalation', 'Escalation End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 303),
    (NULL, 'bpmn:EndEvent:cancel', 'Cancel End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 304),
    (NULL, 'bpmn:EndEvent:compensate', 'Compensation End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 305),
    (NULL, 'bpmn:EndEvent:signal', 'Signal End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 306),
    (NULL, 'bpmn:EndEvent:terminate', 'Terminate End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 307),
    (NULL, 'bpmn:EndEvent:multiple', 'Multiple End Event', 'event', 'end', '#C02520', '#FFEBEE', 3.0, 36, 36, 308);

-- =====================================================
-- TASKS (Teal #047481)
-- =====================================================
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:Task', 'Task', 'task', NULL, '#047481', '#FFFFFF', 2.0, 100, 80, 400),
    (NULL, 'bpmn:UserTask', 'User Task', 'task', 'user', '#047481', '#FFFFFF', 2.0, 100, 80, 401),
    (NULL, 'bpmn:ServiceTask', 'Service Task', 'task', 'service', '#047481', '#FFFFFF', 2.0, 100, 80, 402),
    (NULL, 'bpmn:ScriptTask', 'Script Task', 'task', 'script', '#047481', '#FFFFFF', 2.0, 100, 80, 403),
    (NULL, 'bpmn:BusinessRuleTask', 'Business Rule Task', 'task', 'business-rule', '#047481', '#FFFFFF', 2.0, 100, 80, 404),
    (NULL, 'bpmn:SendTask', 'Send Task', 'task', 'send', '#047481', '#FFFFFF', 2.0, 100, 80, 405),
    (NULL, 'bpmn:ReceiveTask', 'Receive Task', 'task', 'receive', '#047481', '#FFFFFF', 2.0, 100, 80, 406),
    (NULL, 'bpmn:ManualTask', 'Manual Task', 'task', 'manual', '#047481', '#FFFFFF', 2.0, 100, 80, 407),
    (NULL, 'bpmn:CallActivity', 'Call Activity', 'task', 'call-activity', '#047481', '#FFFFFF', 3.0, 100, 80, 408);

-- =====================================================
-- GATEWAYS (Gold #b9a779)
-- =====================================================
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:ExclusiveGateway', 'Exclusive Gateway', 'gateway', 'exclusive', '#b9a779', '#FFF8E1', 2.0, 50, 50, 500),
    (NULL, 'bpmn:ParallelGateway', 'Parallel Gateway', 'gateway', 'parallel', '#b9a779', '#FFF8E1', 2.0, 50, 50, 501),
    (NULL, 'bpmn:InclusiveGateway', 'Inclusive Gateway', 'gateway', 'inclusive', '#b9a779', '#FFF8E1', 2.0, 50, 50, 502),
    (NULL, 'bpmn:EventBasedGateway', 'Event-Based Gateway', 'gateway', 'event-based', '#b9a779', '#FFF8E1', 2.0, 50, 50, 503),
    (NULL, 'bpmn:ComplexGateway', 'Complex Gateway', 'gateway', 'complex', '#b9a779', '#FFF8E1', 2.0, 50, 50, 504);

-- =====================================================
-- DATA (Gray)
-- =====================================================
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:DataObjectReference', 'Data Object', 'data', 'object', '#585858', '#F5F7FA', 2.0, 36, 50, 600),
    (NULL, 'bpmn:DataStoreReference', 'Data Store', 'data', 'store', '#585858', '#F5F7FA', 2.0, 50, 50, 601),
    (NULL, 'bpmn:DataInput', 'Data Input', 'data', 'input', '#585858', '#F5F7FA', 2.0, 36, 50, 602),
    (NULL, 'bpmn:DataOutput', 'Data Output', 'data', 'output', '#585858', '#F5F7FA', 2.0, 36, 50, 603);

-- =====================================================
-- ARTIFACTS (Gray)
-- =====================================================
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:TextAnnotation', 'Text Annotation', 'artifact', 'annotation', '#585858', '#FFFDE7', 1.0, 100, 30, 700),
    (NULL, 'bpmn:Group', 'Group', 'artifact', 'group', '#585858', '#FFFFFF', 1.0, 300, 200, 701);

-- =====================================================
-- SUBPROCESSES (Blue)
-- =====================================================
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:SubProcess', 'Subprocess', 'subprocess', NULL, '#1E88E5', '#FFFFFF', 2.0, 350, 200, 800),
    (NULL, 'bpmn:SubProcess:expanded', 'Expanded Subprocess', 'subprocess', 'expanded', '#1E88E5', '#FFFFFF', 2.0, 350, 200, 801),
    (NULL, 'bpmn:SubProcess:collapsed', 'Collapsed Subprocess', 'subprocess', 'collapsed', '#1E88E5', '#FFFFFF', 2.0, 100, 80, 802),
    (NULL, 'bpmn:Transaction', 'Transaction', 'subprocess', 'transaction', '#1E88E5', '#FFFFFF', 3.0, 350, 200, 803),
    (NULL, 'bpmn:AdHocSubProcess', 'Ad-Hoc Subprocess', 'subprocess', 'adhoc', '#1E88E5', '#FFFFFF', 2.0, 350, 200, 804),
    (NULL, 'bpmn:SubProcess:event', 'Event Subprocess', 'subprocess', 'event', '#1E88E5', '#FFFFFF', 2.0, 350, 200, 805);

-- =====================================================
-- FLOWS (Gray/Blue)
-- =====================================================
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:SequenceFlow', 'Sequence Flow', 'flow', 'sequence', '#585858', 'none', 1.5, NULL, NULL, 900),
    (NULL, 'bpmn:MessageFlow', 'Message Flow', 'flow', 'message', '#585858', 'none', 1.5, NULL, NULL, 901),
    (NULL, 'bpmn:Association', 'Association', 'flow', 'association', '#585858', 'none', 1.0, NULL, NULL, 902),
    (NULL, 'bpmn:DataInputAssociation', 'Data Input Association', 'flow', 'data-input', '#585858', 'none', 1.0, NULL, NULL, 903),
    (NULL, 'bpmn:DataOutputAssociation', 'Data Output Association', 'flow', 'data-output', '#585858', 'none', 1.0, NULL, NULL, 904);

-- =====================================================
-- PARTICIPANTS & LANES
-- =====================================================
INSERT INTO bpmn_element_types (tenant_id, code, name, category, sub_category, stroke_color, fill_color, stroke_width, default_width, default_height, sort_order)
VALUES
    (NULL, 'bpmn:Participant', 'Pool/Participant', 'participant', NULL, '#585858', '#FFFFFF', 2.0, 600, 250, 1000),
    (NULL, 'bpmn:Lane', 'Lane', 'participant', 'lane', '#585858', '#FFFFFF', 1.0, 600, 125, 1001);

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'BPMN Element Types seeded successfully. Total: %', (SELECT COUNT(*) FROM bpmn_element_types WHERE tenant_id IS NULL);
END $$;
