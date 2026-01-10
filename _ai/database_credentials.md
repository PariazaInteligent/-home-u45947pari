# Database Configuration
## Real Database Credentials (PhpMyAdmin)

```php
<?php
// Database connection details
$DB_HOST = 'localhost';
$DB_USER = 'u45947pari_api';
$DB_PASS = '3DSecurity31';
$DB_NAME = 'u45947pari_pariaza_inteligent';

// MySQLi Connection
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
$mysqli->set_charset('utf8mb4');
?>
```

## Prisma Connection String

For the Node.js API (Fastify + Prisma), use this connection string:

```
DATABASE_URL="mysql://u45947pari_api:3DSecurity31@localhost:3306/u45947pari_pariaza_inteligent"
```

## File Locations

- **API .env**: `public_html/apps/api/.env.local` (blocked by gitignore)
- **Database Package .env**: `public_html/packages/database/.env` (blocked by gitignore)

## Note

These credentials connect to the real production database containing live user data, trades, and financial records.
