<?php
// /api/app.php — setări generale app (nu atinge Stripe aici)
if (!defined('PLATFORM_FEE_BPS')) {
  // ex: 8% comision din profitul pozitiv al investitorului (800 basis points)
  define('PLATFORM_FEE_BPS', 800);
}
