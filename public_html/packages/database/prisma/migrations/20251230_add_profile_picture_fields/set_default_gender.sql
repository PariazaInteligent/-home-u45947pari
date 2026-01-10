-- Set default gender for existing users
UPDATE users
SET gender = 'male'
WHERE gender IS NULL
    OR gender = '';
-- You can manually adjust specific users if needed, for example:
-- UPDATE users SET gender = 'female' WHERE email = 'specific@email.com';