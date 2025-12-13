<?php
// utilitare pentru meta chat: atașamente + preview link
// notă: folosim stocare pe disc (uploads/chat/meta + previews) ca să evităm dependența de schema DB

declare(strict_types=1);

function chat_upload_base(): string
{
  return realpath(__DIR__ . '/../../uploads/chat') ?: (__DIR__ . '/../../uploads/chat');
}

function chat_meta_dir(): string
{
  return chat_upload_base() . '/meta';
}

function chat_preview_dir(): string
{
  return chat_upload_base() . '/previews';
}

function chat_ensure_dirs(): void
{
  foreach ([chat_upload_base(), chat_meta_dir(), chat_preview_dir()] as $dir) {
    if (!is_dir($dir)) {
      @mkdir($dir, 0775, true);
    }
  }
}

function chat_meta_path(int $id): string
{
  return chat_meta_dir() . '/' . $id . '.json';
}

function chat_load_meta(int $id): array
{
  $path = chat_meta_path($id);
  if (!is_file($path))
    return [];
  $raw = @file_get_contents($path);
  if ($raw === false)
    return [];
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}

function chat_save_meta(int $id, array $meta): void
{
  chat_ensure_dirs();
  $clean = array_filter($meta, function ($v) {
    return $v !== null && $v !== '' && $v !== [];
  });
  if (!$clean)
    return;
  file_put_contents(chat_meta_path($id), json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function chat_normalize_attachment(array $in): ?array
{
  $url = trim((string) ($in['url'] ?? ''));
  $name = trim((string) ($in['name'] ?? ''));
  $mime = trim((string) ($in['mime'] ?? ($in['type'] ?? '')));
  $size = isset($in['size']) ? (int) $in['size'] : null;

  if ($url === '')
    return null;
  // doar fișiere din uploads/chat
  if (!str_starts_with($url, '/uploads/chat/'))
    return null;

  $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION));
  $allowed = [
    'image' => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'],
    'video' => ['mp4', 'webm', 'mov', 'm4v'],
    'audio' => ['mp3', 'wav', 'ogg', 'aac', 'm4a'],
  ];
  $kind = 'file';
  foreach ($allowed as $k => $list) {
    if (in_array($ext, $list, true)) {
      $kind = $k;
      break;
    }
  }
  if ($mime === '' && $kind !== 'file')
    $mime = $kind . '/' . $ext;
  return [
    'url' => $url,
    'name' => $name !== '' ? $name : basename($url),
    'mime' => $mime,
    'size' => $size,
    'kind' => $kind,
  ];
}

function chat_filter_attachments($list): array
{
  $out = [];
  foreach ((array) $list as $it) {
    if (!is_array($it))
      continue;
    $norm = chat_normalize_attachment($it);
    if ($norm)
      $out[] = $norm;
    if (count($out) >= 5)
      break; // limită de siguranță
  }
  return $out;
}

function chat_first_url(string $text): ?string
{
  if (!preg_match('~https?://\S+~u', $text, $m))
    return null;
  $url = trim($m[0], "\t\n\r <>");
  return $url !== '' ? $url : null;
}

function chat_fetch_preview(string $url, bool $force = false): ?array
{
  if ($url === '')
    return null;
  chat_ensure_dirs();
  $hash = sha1($url);
  $cacheFile = chat_preview_dir() . '/' . $hash . '.json';

  if (!$force && is_file($cacheFile)) {
    $age = time() - filemtime($cacheFile);
    if ($age < 86400) { // 24h
      $raw = @file_get_contents($cacheFile);
      $j = json_decode($raw, true);
      if (is_array($j))
        return $j;
    }
  }

  $ua = 'Mozilla/5.0 (compatible; ChatPreviewBot/1.0; +https://example.local)';
  $content = '';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_TIMEOUT => 4,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_USERAGENT => $ua,
    CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml'],
  ]);
  $content = curl_exec($ch);
  curl_close($ch);
  if (!is_string($content) || $content === '')
    return null;
  $snippet = mb_substr($content, 0, 20000);

  $og = [];
  if (preg_match_all('~<meta\s+(?:property|name)=["\']og:([^"\']+)["\']\s+content=["\']([^"\']*)["\']~i', $snippet, $mm, PREG_SET_ORDER)) {
    foreach ($mm as $m) {
      $og[strtolower($m[1])] = trim(html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
  }
  if (!$og && preg_match_all('~<meta\s+content=["\']([^"\']*)["\']\s+(?:property|name)=["\']og:([^"\']+)["\']~i', $snippet, $mm2, PREG_SET_ORDER)) {
    foreach ($mm2 as $m) {
      $og[strtolower($m[2])] = trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
  }

  $title = $og['title'] ?? null;
  if (!$title && preg_match('~<title>([^<]+)</title>~i', $snippet, $mt)) {
    $title = trim(html_entity_decode($mt[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
  }

  $desc = $og['description'] ?? null;
  $img = $og['image'] ?? ($og['image:url'] ?? null);
  $site = $og['site_name'] ?? null;
  $host = parse_url($url, PHP_URL_HOST) ?: '';
  $path = parse_url($url, PHP_URL_PATH) ?: '';

  // Fallbacks if no OG/Meta found (as requested)
  if (!$title) {
    if ($host) {
      $title = $host . ($path && $path !== '/' ? $path : '');
    } else {
      $title = $url;
    }
  }
  if (!$site && $host) {
    $site = $host;
  }
  $type = $og['type'] ?? null;

  $provider = null;
  $embed = null;
  $host = parse_url($url, PHP_URL_HOST) ?: '';
  if (stripos($host, 'youtube.com') !== false || stripos($host, 'youtu.be') !== false) {
    $provider = 'youtube';
    if (preg_match('~(?:v=|/)([A-Za-z0-9_-]{6,})~', $url, $mv)) {
      $embed = [
        'type' => 'youtube',
        'src' => 'https://www.youtube.com/embed/' . $mv[1]
      ];
    }
  } elseif (stripos($host, 'tiktok.com') !== false) {
    $provider = 'tiktok';
    $embed = [
      'type' => 'tiktok',
      'src' => $url
    ];
  }

  $preview = [
    'url' => $url,
    'title' => $title,
    'description' => $desc,
    'image' => $img,
    'site_name' => $site,
    'type' => $type,
    'provider' => $provider,
    'embed' => $embed,
  ];

  file_put_contents($cacheFile, json_encode($preview, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  return $preview;
}

function chat_preview_from_text(string $text): ?array
{
  $url = chat_first_url($text);
  if (!$url)
    return null;
  return chat_fetch_preview($url);
}