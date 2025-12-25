# Database Credentials - Pariază Inteligent

## Remote Database Connection

**Host:** 85.9.45.213  
**Port:** 3306  
**Database Name:** u45947pari_pariaza_inteligent

## Users

### API User (Recommended for Application)

- **Username:** `u45947pari_api`
- **Password:** `3DSecurity31`
- **Permissions:** Full access to `u45947pari_pariaza_inteligent` database

### Admin User (Alternative)

- **Username:** `u45947pari_admin_pariaza`
- **Password:** (Same as API user)

## Connection String Format

```bash
DATABASE_URL="mysql://u45947pari_api:3DSecurity31@85.9.45.213:3306/u45947pari_pariaza_inteligent"
```

## SMTP Email Configuration

**Host:** mail.pariazainteligent.ro  
**Port:** 465  
**Security:** SSL/TLS (SMTP_SECURE=true)  
**Username:** <noreply@pariazainteligent.ro>  
**Password:** NoReply#Secure2025  
**From Name:** Pariază Inteligent  
**From Email:** <noreply@pariazainteligent.ro>

## Notes

- Database is hosted remotely, not on localhost
- Always use remote IP (85.9.45.213) for connection
- Ensure firewall allows connections from your development IP
- For production, update `PLATFORM_URL` and JWT secrets

## Last Updated

2025-12-25 00:14:00 UTC
