<?php
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

$userName = !empty($_SESSION['user']['nume'])
  ? htmlspecialchars($_SESSION['user']['nume'])
  : null;

$defaultAvatar = '/uploads/avatars/2ab947aaf35003f7156a4a2138569fc5.webp';
$avatarUrl     = $defaultAvatar;

if (!empty($_SESSION['user'])) {
  if (!empty($_SESSION['user']['avatar_url'])) {
    $avatarUrl = $_SESSION['user']['avatar_url'];
  } else {
    $userId = (int)($_SESSION['user']['id'] ?? 0);
    if ($userId > 0) {
      require_once __DIR__.'/db.php';
      if (!empty($mysqli)) {
        $stmt = $mysqli->prepare("SELECT avatar_url FROM utilizatori WHERE id = ? LIMIT 1");
        if ($stmt) {
          $stmt->bind_param('i', $userId);
          $stmt->execute();
          $res = $stmt->get_result();
          if ($row = $res->fetch_assoc() and !empty($row['avatar_url'])) {
            $avatarUrl = $row['avatar_url'];
            $_SESSION['user']['avatar_url'] = $avatarUrl;
          }
          $stmt->close();
        }
      }
    }
  }
}
$avatarUrlSafe = htmlspecialchars($avatarUrl);
?>
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Header – Pariază Inteligent</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,sans-serif}

/* ---- Teme ---- */
body.dark{background:linear-gradient(135deg,#0a0e27 0%,#1a1f3a 50%,#0f1829 100%);color:#E8F9FF;}
body.light{background:linear-gradient(135deg,#f6fbff 0%,#ecf7ff 55%,#eaf7ff 100%);color:#24324a;}

/* ---- Header ---- */
header.main-header{
  position:sticky;top:0;width:100%;z-index:10;
  backdrop-filter:blur(8px);
  box-shadow:0 4px 20px rgba(0,0,0,.35);
  border-bottom:1px solid rgba(0,255,157,.25);
  transition: background .3s ease, border-color .3s ease;
}
body.dark header.main-header{background:rgba(20,26,46,.85);border-bottom-color:rgba(0,255,157,.25);}
body.light header.main-header{background:rgba(255,255,255,.8);border-bottom-color:rgba(0,186,150,.25);box-shadow:0 4px 20px rgba(0,0,0,.1);}

.header-container{
  max-width:1200px;margin:0 auto;
  display:flex;align-items:center;justify-content:space-between;
  gap:20px;padding:14px 24px;
}

/* ---- Breadcrumbs ---- */
nav.breadcrumbs{display:flex;align-items:center;gap:8px;font-size:.9rem;flex:1}
.breadcrumb-item{display:flex;align-items:center;gap:6px;text-decoration:none;padding:4px 8px;border-radius:6px;transition:all .3s ease;}
body.dark .breadcrumb-item{color:#b9defd}
body.dark .breadcrumb-item:hover{background:rgba(0,255,157,.15);color:#00ff9d}
body.light .breadcrumb-item{color:#3d5f86}
body.light .breadcrumb-item:hover{background:rgba(0,186,150,.12);color:#00a67f}

/* ---- Brand ---- */
.branding{text-align:center;flex:1}
.brand-title{font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#00ff9d,#00b8ff);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}

/* ---- Controls ---- */
.controls{flex:1;display:flex;justify-content:flex-end;gap:16px;align-items:center}
.info-badge{
  display:flex;align-items:center;gap:10px;
  background:rgba(0,255,157,.12);
  border:1px solid rgba(0,255,157,.3);
  color:#00ffb0;
  padding:4px 10px;border-radius:14px;font-size:.9rem;transition:all .3s ease;white-space:nowrap;
}
body.light .info-badge{background:rgba(0,186,150,.11);border-color:rgba(0,186,150,.3);color:#00a67f;}

.avatar-chip{
  width:28px;height:28px;min-width:28px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;
  background:#203545cc;border:1px solid rgba(0,255,157,.35);
  overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.25);
}
.avatar-chip img{width:100%;height:100%;object-fit:cover;display:block;}
.user-name{font-weight:700;letter-spacing:.2px;}

/* ---- Theme switch ---- */
.theme-toggle{width:56px;height:28px;border-radius:30px;border:1px solid rgba(0,255,157,.3);
  background:rgba(255,255,255,.1);cursor:pointer;position:relative;transition:all .3s ease;}
body.light .theme-toggle{border-color:rgba(0,186,150,.3);background:rgba(0,0,0,.06);}
.slider{width:24px;height:24px;border-radius:50%;position:absolute;top:2px;left:2px;
  display:flex;align-items:center;justify-content:center;font-size:.9rem;
  transition:all .4s cubic-bezier(.68,-.55,.27,1.55);
  box-shadow:0 2px 6px rgba(0,0,0,.25);background:#152033;color:#ffd966;}
body.light .slider{left:30px;background:#fff;color:#00b8ff;}

/* ---- Mobile ---- */
@media (max-width:768px){
  .branding { display:none !important; }
  .user-name { display:none; }       /* ascunde numele pe mobil */
  nav.breadcrumbs { display:none; }  /* << ascunde breadcrumb-urile pe mobil */
}
</style>
</head>
<body class="dark">
<header class="main-header">
  <div class="header-container">
    <nav class="breadcrumbs">
      <a href="/" class="breadcrumb-item"><i class="fas fa-home"></i> Acasă</a>
      <span class="breadcrumb-item" id="breadcrumb-current">
        <i class="fas fa-file"></i> Pagina curentă
      </span>
    </nav>

    <div class="branding">
      <h1 class="brand-title"><i class="fas fa-chart-line"></i> Pariază Inteligent</h1>
    </div>

    <div class="controls">
      <span class="info-badge">
        <span class="avatar-chip">
          <img src="<?= $avatarUrlSafe ?>" alt="Avatar">
        </span>
        <span class="user-name">
          <?php if($userName): ?>
            <?= $userName ?>
          <?php else: ?>
            Vizitator
          <?php endif; ?>
        </span>
      </span>
      <div class="theme-toggle" id="themeToggle" aria-label="Comută tema">
        <div class="slider"><i class="fas fa-moon"></i></div>
      </div>
    </div>
  </div>
</header>

<script>
(function(){
  const toggle=document.getElementById('themeToggle');
  const slider=toggle.querySelector('.slider');
  const current=localStorage.getItem('theme')||'dark';
  setTheme(current);

  toggle.addEventListener('click',()=>{
    const newTheme=document.body.classList.contains('dark')?'light':'dark';
    setTheme(newTheme);
    localStorage.setItem('theme',newTheme);
    window.parent.dispatchEvent(new CustomEvent('theme-changed',{detail:newTheme}));
  });

  window.addEventListener('theme-changed',e=>setTheme(e.detail));

  function setTheme(t){
    document.body.classList.remove('dark','light');
    document.body.classList.add(t);
    slider.innerHTML=t==='dark'
      ?'<i class="fas fa-moon"></i>'
      :'<i class="fas fa-sun"></i>';
  }

  window.addEventListener("set-breadcrumb",e=>{
    const curr=document.getElementById("breadcrumb-current");
    const name=e.detail||'Pagina curentă';
    curr.innerHTML=`<i class="fas fa-angle-right"></i> ${name}`;
  });
})();
</script>
</body>
</html>
