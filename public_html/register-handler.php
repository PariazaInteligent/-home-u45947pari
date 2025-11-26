<?php
// Răspuns JSON by default
header('Content-Type: application/json');

// --- Conexiune DB (nicio schimbare la credențiale) ---
$servername = "localhost";
$username   = "u45947pari_api"; // Adaptează dacă e cazul
$password   = "3DSecurity31";   // Adaptează dacă e cazul
$dbname     = "u45947pari_pariaza_inteligent";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success'=>false, 'error'=>'Eroare conexiune DB']);
    exit;
}
$conn->set_charset("utf8mb4");

// --- Tabelul (asigurare) ---
$conn->query("CREATE TABLE IF NOT EXISTS utilizatori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nume TEXT NOT NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    parola TEXT NOT NULL,
    cod_recomandare TEXT,
    avatar_url TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// --- Helper pentru răspuns + închidere ---
function respond_and_close($conn, $statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    if ($conn) $conn->close();
    exit;
}

// --- Preluare date: suportă și JSON, și multipart/form-data ---
$ctype = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
$ctype = strtolower($ctype);

// Valorile default
$nume = $email = $parola = $cod = $avatar = '';

// Dacă e JSON (vechiul flux)
if (strpos($ctype, 'application/json') === 0) {
    $data   = json_decode(file_get_contents('php://input'), true) ?: [];
    $nume   = trim($data['fullname'] ?? '');
    $email  = trim($data['email'] ?? '');
    $parola = $data['password'] ?? '';
    $cod    = trim($data['referral'] ?? '');
    $avatar = trim($data['avatar'] ?? ''); // URL opțional
}
// Altfel, tratăm ca form-data (nou: upload avatar)
else {
    $nume   = trim($_POST['fullname'] ?? '');
    $email  = trim($_POST['email'] ?? '');
    $parola = $_POST['password'] ?? '';
    $cod    = trim($_POST['referral'] ?? '');
    $avatar = trim($_POST['avatar'] ?? ''); // URL opțional
}

// --- Validare minimă ---
if (!$nume || !$email || !$parola || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($parola) < 8) {
    respond_and_close($conn, 400, ['success'=>false, 'error'=>'Date lipsă sau invalide']);
}

// --- Pre-procesare avatar ---
// Priorizăm fișierul încărcat, dacă există; altfel folosim URL-ul text (dacă e prezent).
$avatar_url_to_store = null;

// 1) Dacă e încărcat fișier (multipart/form-data)
if (!empty($_FILES['avatar_file']) && is_uploaded_file($_FILES['avatar_file']['tmp_name'])) {
    $file  = $_FILES['avatar_file'];

    // Validări fișier
    if (!empty($file['error']) && $file['error'] !== UPLOAD_ERR_OK) {
        respond_and_close($conn, 400, ['success'=>false, 'error'=>'Eroare la upload-ul avatarului']);
    }

    // Limită ~3MB
    if ($file['size'] > 3 * 1024 * 1024) {
        respond_and_close($conn, 400, ['success'=>false, 'error'=>'Avatar prea mare (max 3MB)']);
    }

    // Verificare MIME
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']) ?: '';
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($allowed[$mime])) {
        respond_and_close($conn, 400, ['success'=>false, 'error'=>'Format avatar invalid (acceptă jpg, png, webp)']);
    }
    $ext = $allowed[$mime];

    // Director uploads/avatars (creăm dacă nu există)
    $uploadDirFs  = __DIR__ . '/uploads/avatars';
    $uploadDirUrl = 'uploads/avatars'; // cale relativă servită public

    if (!is_dir($uploadDirFs)) {
        @mkdir($uploadDirFs, 0755, true);
    }

    // Nume fișier sigur
    $fname = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest  = $uploadDirFs . '/' . $fname;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        respond_and_close($conn, 500, ['success'=>false, 'error'=>'Nu s-a putut salva avatarul pe server']);
    }

    // Calea salvată în DB (publică)
    $avatar_url_to_store = $uploadDirUrl . '/' . $fname;
}
// 2) Dacă nu e fișier dar avem URL text
elseif (!empty($avatar)) {
    // Validare simplă de extensie (opțional: poți face și HEAD request, dar nu e nevoie aici)
    $lower = strtolower($avatar);
    if (preg_match('/\.(jpe?g|png|webp)(\?.*)?$/', $lower)) {
        $avatar_url_to_store = $avatar; // păstrăm URL-ul direct
    } else {
        // Ignorăm avatar-ul dacă nu pare imagine
        $avatar_url_to_store = null;
    }
}

// --- Hash parolă ---
$parola_hash = password_hash($parola, PASSWORD_BCRYPT);

// --- Inserare în DB ---
$stmt = $conn->prepare("INSERT INTO utilizatori (nume, email, parola, cod_recomandare, avatar_url) VALUES (?, ?, ?, ?, ?)");
if (!$stmt) {
    respond_and_close($conn, 500, ['success'=>false, 'error'=>'Eroare pregătire interogare']);
}
$stmt->bind_param('sssss', $nume, $email, $parola_hash, $cod, $avatar_url_to_store);

if ($stmt->execute()) {
    // Succes — NU facem redirect aici; lăsăm front-end-ul (register.html) să afișeze mesajul și/sau să navigheze
    respond_and_close($conn, 200, ['success'=>true, 'id'=>$conn->insert_id]);
} else {
    // Probabil email duplicat (UNIQUE)
    respond_and_close($conn, 409, ['success'=>false, 'error'=>'Adresa de email există deja']);
}
