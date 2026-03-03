-- Seed data for Framework platform
-- Compliance rules per NZBC clauses

INSERT OR IGNORE INTO compliance_rules (id, clause, version, title, description, inspection_types, is_active) VALUES
-- B1 Structure
('rule-b1-001', 'B1', '2022', 'Structural Stability', 'Structure must withstand likely loads without causing damage', '["foundation","framing","final"]', 1),
('rule-b1-002', 'B1', '2022', 'Foundation Depth & Bearing', 'Foundations must be on stable ground at required depth', '["foundation"]', 1),
('rule-b1-003', 'B1', '2022', 'Framing Connections', 'All structural connections must comply with NZS 3604', '["framing"]', 1),
('rule-b1-004', 'B1', '2022', 'Bracing Elements', 'Bracing must meet calculated requirements for seismic and wind', '["framing","final"]', 1),
-- B2 Durability
('rule-b2-001', 'B2', '2022', 'Material Durability', 'All materials must meet minimum durability requirements for exposure zone', '["pre_wrap","pre_plaster","final"]', 1),
('rule-b2-002', 'B2', '2022', 'Fixings & Fasteners', 'Fixings in exposed conditions must be stainless steel or equivalent', '["framing","pre_wrap"]', 1),
-- C Fire
('rule-c-001', 'C', '2022', 'Fire Separation', 'Required fire separations must be maintained', '["framing","final"]', 1),
('rule-c-002', 'C', '2022', 'Penetrations Sealed', 'All fire-rated penetrations must be sealed with listed products', '["pre_line","final"]', 1),
-- E1 Surface Water
('rule-e1-001', 'E1', '2022', 'Site Drainage', 'Site must drain away from building without ponding', '["foundation"]', 1),
-- E2 External Moisture
('rule-e2-001', 'E2', '2022', 'Cladding System', 'Cladding must prevent moisture penetration to structure', '["pre_wrap","pre_plaster","final"]', 1),
('rule-e2-002', 'E2', '2022', 'Flashings Installed', 'All required flashings must be correctly installed', '["pre_wrap","pre_plaster"]', 1),
('rule-e2-003', 'E2', '2022', 'Cavity Drainage', 'Drained cavity systems must allow drainage and ventilation', '["pre_plaster"]', 1),
-- E3 Internal Moisture
('rule-e3-001', 'E3', '2022', 'Wet Area Waterproofing', 'Wet areas must be waterproofed with listed membrane system', '["wet_area_pre_line"]', 1),
('rule-e3-002', 'E3', '2022', 'Falls to Drains', 'Shower floors must fall to drain at minimum 1:60', '["wet_area_pre_line","final"]', 1),
-- F2 Hazardous Building Materials
('rule-f2-001', 'F2', '2022', 'Insulation Installation', 'Insulation must be installed without gaps or compression', '["pre_line"]', 1),
-- F6 Visibility in Low Light
('rule-f6-001', 'F6', '2022', 'Glazing Safety', 'Safety glazing required in critical locations per NZS 4223', '["framing","final"]', 1),
-- H1 Energy Efficiency
('rule-h1-001', 'H1', '2022', 'Wall Insulation R-Value', 'Wall insulation must meet minimum R-value for climate zone', '["pre_line"]', 1),
('rule-h1-002', 'H1', '2022', 'Ceiling Insulation R-Value', 'Ceiling insulation must meet minimum R-value for climate zone', '["pre_line"]', 1),
('rule-h1-003', 'H1', '2022', 'Underfloor Insulation', 'Suspended floors must have correctly installed underfloor insulation', '["subfloor_framing"]', 1),
('rule-h1-004', 'H1', '2022', 'Window Schedule Compliance', 'Windows must meet energy schedule requirements', '["framing","final"]', 1);
