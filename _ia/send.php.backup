<?php
/**
 * Contact Form API Endpoint
 * Sends notification emails to admin and confirmation emails to users
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Rate limiting (simple file-based)
$rateLimitFile = __DIR__ . '/rate_limit.json';
$clientIP = $_SERVER['REMOTE_ADDR'];
$now = time();
$rateLimitWindow = 3600; // 1 hour
$maxRequests = 3;

// Load rate limit data
$rateLimitData = file_exists($rateLimitFile) ? json_decode(file_get_contents($rateLimitFile), true) : [];

// Clean old entries
foreach ($rateLimitData as $ip => $timestamps) {
    $rateLimitData[$ip] = array_filter($timestamps, function ($ts) use ($now, $rateLimitWindow) {
        return ($now - $ts) < $rateLimitWindow;
    });
    if (empty($rateLimitData[$ip])) {
        unset($rateLimitData[$ip]);
    }
}

// Check rate limit
if (isset($rateLimitData[$clientIP]) && count($rateLimitData[$clientIP]) >= $maxRequests) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Prea multe cereri. Te rugăm să încerci din nou mai târziu.']);
    exit;
}

// Parse JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$subject = isset($input['subject']) ? trim($input['subject']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';

$errors = [];

if (empty($name) || strlen($name) < 2) {
    $errors[] = 'Numele este obligatoriu (minim 2 caractere)';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email invalid';
}

if (empty($subject)) {
    $errors[] = 'Subiectul este obligatoriu';
}

if (empty($message) || strlen($message) < 10) {
    $errors[] = 'Mesajul este obligatoriu (minim 10 caractere)';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

// SMTP Configuration
$smtpHost = 'mail.pariazainteligent.ro';
$smtpPort = 465;
$smtpUsername = 'contact@pariazainteligent.ro';
$smtpPassword = '#3DSecurity31';
$smtpFrom = 'contact@pariazainteligent.ro';
$smtpFromName = 'Pariază Inteligent';
$adminEmail = 'contact@pariazainteligent.ro';

try {
    // Create SMTP connection
    $smtp = fsockopen('ssl://' . $smtpHost, $smtpPort, $errno, $errstr, 30);

    if (!$smtp) {
        throw new Exception("Nu s-a putut conecta la serverul SMTP: $errstr ($errno)");
    }

    // Helper function to send SMTP command
    function smtpCommand($smtp, $command, $expectedCode = 250)
    {
        fwrite($smtp, $command . "\r\n");

        // Read all lines of response (may be multiline with dash after code)
        do {
            $response = fgets($smtp, 515);
            $code = substr($response, 0, 3);
            $isMultiline = (substr($response, 3, 1) === '-');
        } while ($response && $isMultiline);

        // Check final response code
        if ($code != $expectedCode) {
            throw new Exception("SMTP Error: " . $response);
        }
        return $response;
    }

    // SMTP handshake - Read all welcome banner lines (can be multiline with 220-)
    do {
        $response = fgets($smtp, 515);
        $code = substr($response, 0, 3);
        // Continue reading if it's a multiline response (has dash after code)
    } while ($response && substr($response, 3, 1) === '-');

    // Now send EHLO
    smtpCommand($smtp, "EHLO " . $smtpHost);
    smtpCommand($smtp, "AUTH LOGIN", 334);
    smtpCommand($smtp, base64_encode($smtpUsername), 334);
    smtpCommand($smtp, base64_encode($smtpPassword), 235);

    // === EMAIL 1: Notification to Admin ===
    smtpCommand($smtp, "MAIL FROM:<$smtpFrom>");
    smtpCommand($smtp, "RCPT TO:<$adminEmail>");
    smtpCommand($smtp, "DATA", 354);

    $notificationSubject = "=?UTF-8?B?" . base64_encode("📧 Mesaj nou de contact de la " . $name) . "?=";
    $headers = "From: $smtpFromName <$smtpFrom>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    $notificationBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
    </head>
    <body style='font-family: Arial, sans-serif; background-color: #f0f9ff; padding: 20px;'>
        <div style='max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
            <h2 style='color: #0891b2; margin-bottom: 24px;'>📧 Mesaj nou de contact</h2>
            <div style='background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 16px;'>
                <p style='margin: 8px 0;'><strong>De la:</strong> $name</p>
                <p style='margin: 8px 0;'><strong>Email:</strong> <a href='mailto:$email'>$email</a></p>
                <p style='margin: 8px 0;'><strong>Subiect:</strong> $subject</p>
            </div>
            <div style='background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0891b2;'>
                <p style='margin: 0; color: #334155; line-height: 1.6;'>" . nl2br(htmlspecialchars($message)) . "</p>
            </div>
            <p style='margin-top: 24px; color: #64748b; font-size: 14px;'>Trimis de pe pariazainteligent.ro la " . date('d.m.Y H:i') . "</p>
        </div>
    </body>
    </html>
    ";

    $emailContent = "Subject: $notificationSubject\r\n";
    $emailContent .= $headers;
    $emailContent .= "\r\n";
    $emailContent .= $notificationBody;
    $emailContent .= "\r\n.\r\n";

    fwrite($smtp, $emailContent);
    fgets($smtp, 515);

    // === EMAIL 2: Confirmation to User ===
    smtpCommand($smtp, "MAIL FROM:<$smtpFrom>");
    smtpCommand($smtp, "RCPT TO:<$email>");
    smtpCommand($smtp, "DATA", 354);

    $confirmationSubject = "=?UTF-8?B?" . base64_encode("✅ Mesajul tău a ajuns la Pariază Inteligent!") . "?=";

    $confirmationBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
    </head>
    <body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%);'>
        <div style='max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);'>
            <!-- Header -->
            <div style='background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 40px 24px; text-align: center;'>
                <div style='background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 48px;'>
                    🦉
                </div>
                <h1 style='color: white; margin: 0; font-size: 28px; font-weight: 900;'>Mesaj Primit!</h1>
                <p style='color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;'>Prof. Investino și echipa te salută</p>
            </div>
            
            <!-- Content -->
            <div style='padding: 32px 24px;'>
                <div style='background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px;'>
                    <h2 style='color: #0891b2; margin: 0 0 16px; font-size: 20px; font-weight: 800;'>✅ Mesajul Tău a Fost Trimis cu Succes!</h2>
                    <p style='color: #475569; margin: 0; line-height: 1.6; font-size: 15px;'>
                        Mulțumim că ne-ai contactat! Am primit mesajul tău și îl vom analiza cu atenție. 
                        Îți vom răspunde în cel mai scurt timp posibil.
                    </p>
                </div>
                
                <div style='background: #f8fafc; border-radius: 12px; padding: 20px; border-left: 4px solid #06b6d4; margin-bottom: 24px;'>
                    <h3 style='color: #334155; margin: 0 0 12px; font-size: 16px; font-weight: 700;'>📋 Detaliile Mesajului Tău:</h3>
                    <p style='margin: 8px 0; color: #64748b; font-size: 14px;'><strong>Subiect:</strong> $subject</p>
                    <p style='margin: 8px 0; color: #64748b; font-size: 14px;'><strong>Trimis la:</strong> " . date('d.m.Y H:i') . "</p>
                </div>
                
                <div style='text-align: center; margin: 32px 0;'>
                    <a href='http://localhost:3000' style='display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);'>
                        🚀 Vizitează Platforma
                    </a>
                </div>
                
                <div style='border-top: 2px dashed #e2e8f0; padding-top: 20px; margin-top: 20px;'>
                    <p style='color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;'>
                        <strong style='color: #0891b2;'>📧 Contact:</strong> contact@pariazainteligent.ro<br>
                        <strong style='color: #0891b2;'>🌐 Website:</strong> pariazainteligent.ro<br>
                        <strong style='color: #0891b2;'>💬 Telegram:</strong> <a href='https://t.me/pariazainteligent' style='color: #06b6d4; text-decoration: none;'>@pariazainteligent</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style='background: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;'>
                <p style='margin: 0; color: #94a3b8; font-size: 13px;'>
                    © " . date('Y') . " Pariază Inteligent. Investiții inteligente prin matematică și disciplină.
                </p>
                <p style='margin: 8px 0 0; color: #cbd5e1; font-size: 12px;'>
                    🦉 Făcut cu pasiune pentru investitori inteligenți
                </p>
            </div>
        </div>
    </body>
    </html>
    ";

    $emailContent2 = "Subject: $confirmationSubject\r\n";
    $emailContent2 .= "From: $smtpFromName <$smtpFrom>\r\n";
    $emailContent2 .= "MIME-Version: 1.0\r\n";
    $emailContent2 .= "Content-Type: text/html; charset=UTF-8\r\n";
    $emailContent2 .= "\r\n";
    $emailContent2 .= $confirmationBody;
    $emailContent2 .= "\r\n.\r\n";

    fwrite($smtp, $emailContent2);
    fgets($smtp, 515);

    // Close SMTP connection
    smtpCommand($smtp, "QUIT", 221);
    fclose($smtp);

    // Update rate limit
    if (!isset($rateLimitData[$clientIP])) {
        $rateLimitData[$clientIP] = [];
    }
    $rateLimitData[$clientIP][] = $now;
    file_put_contents($rateLimitFile, json_encode($rateLimitData));

    // Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Mesajul a fost trimis cu succes! Verifică-ți emailul pentru confirmare.'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Eroare la trimiterea emailului: ' . $e->getMessage()
    ]);
}
