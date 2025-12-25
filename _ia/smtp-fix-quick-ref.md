# SMTP Fix - Quick Reference

## Problema Rezolvată

Formularul de contact nu trimite emailuri → eroare "SMTP Error: 220-..." / "250-..."

## Cauză

Serverul SMTP trimite răspunsuri multiline, codul citea doar prima linie.

## Soluție

**Fișier:** `public_html/api/contact/send.php`

### 1. Welcome Banner (linii ~114-121)

```php
// Citește TOATE liniile welcome banner
do {
    $response = fgets($smtp, 515);
} while ($response && substr($response, 3, 1) === '-');
```

### 2. Funcția smtpCommand (linii ~102-117)

```php
function smtpCommand($smtp, $command, $expectedCode = 250) {
    fwrite($smtp, $command . "\r\n");
    
    // Citește TOATE liniile răspuns
    do {
        $response = fgets($smtp, 515);
        $code = substr($response, 0, 3);
        $isMultiline = (substr($response, 3, 1) === '-');
    } while ($response && $isMultiline);
    
    if ($code != $expectedCode) {
        throw new Exception("SMTP Error: " . $response);
    }
    return $response;
}
```

## Test

```bash
# Din browser: http://localhost:3000/contact
# Completează și trimite formularul
# Verifică: contact@pariazainteligent.ro și email-ul utilizatorului
```

## Status: ✅ FUNCȚIONAL

Ambele emailuri (admin + user confirmation) se trimit corect!
