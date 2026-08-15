alter table visitor_safety_briefing add column risk_map_url varchar(500),add column evacuation_map_url varchar(500);
update visitor_safety_briefing set risk_map_url='/visitor-risk-map.svg',evacuation_map_url='/visitor-evacuation-map.svg';
