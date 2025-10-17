SELECT id, name FROM companies ORDER BY name;
SELECT s.id, s.title, s.company_id, c.name as company_name FROM surveys s JOIN companies c ON s.company_id = c.id ORDER BY c.name, s.created_at DESC;
SELECT au.id, au.email, au.company_id, c.name as company_name FROM admin_users au JOIN companies c ON au.company_id = c.id;
