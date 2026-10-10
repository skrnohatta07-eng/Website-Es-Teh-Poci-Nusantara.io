<?php
// Backend MySQL untuk project Es Teh Poci Nusantara.
// Menggantikan penyimpanan data JSON dengan MySQL/phpMyAdmin.
header('Content-Type: application/json; charset=utf-8');

const DB_HOST = '127.0.0.1';
const DB_NAME = 'esteh_poci';
const DB_USER = 'root';
const DB_PASS = '';

function respond($ok, $message = '', $data = null, $status = 200) {
    http_response_code($status);
    echo json_encode([
        'success' => $ok,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function db() {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $pdo;
    } catch (Throwable $e) {
        respond(false, 'Koneksi database gagal. Pastikan MySQL XAMPP aktif dan database esteh_poci sudah dibuat.', null, 500);
    }
}

function cleanText($value, $max = 255) {
    return substr(trim((string)$value), 0, $max);
}

function getConfig() {
    $pdo = db();

    $shop = $pdo->query('SELECT name, whatsapp AS wa, address, landmark, open_hour AS `open`, close_hour AS `close`, delivery_fee AS fee FROM shop_settings ORDER BY id ASC LIMIT 1')->fetch();
    if (!$shop) {
        $shop = [
            'name' => 'Es Teh Poci Nusantara', 'wa' => '085845514171',
            'address' => 'JL. Minasa Upa Raya', 'landmark' => 'Setiap hari, 09.00 sampai 17.00',
            'open' => 9, 'close' => 17, 'fee' => 5000
        ];
    }

    $prices = [];
    $soldOut = [];
    $menus = $pdo->query('SELECT name, price_key, price, sold_out FROM menus ORDER BY id ASC')->fetchAll();
    foreach ($menus as $m) {
        $prices[$m['price_key']] = (int)$m['price'];
        if ((int)$m['sold_out'] === 1) $soldOut[] = $m['name'];
    }

    $promos = [];
    $stmt = $pdo->query('SELECT code, type, value, minimum_purchase AS min FROM promos WHERE active = 1 ORDER BY id ASC');
    foreach ($stmt as $p) {
        $promos[] = [
            'code' => $p['code'], 'type' => $p['type'],
            'value' => (int)$p['value'], 'min' => (int)$p['min']
        ];
    }

    $gallery = [];
    foreach ($pdo->query('SELECT id, caption, image_path AS src, art_index AS art FROM gallery ORDER BY id ASC') as $g) {
        $item = ['id' => (string)$g['id'], 'caption' => $g['caption']];
        if ($g['art'] !== null) $item['art'] = (int)$g['art'];
        if (!empty($g['src'])) $item['src'] = $g['src'];
        $gallery[] = $item;
    }

    return [
        'shop' => $shop,
        'prices' => $prices,
        'soldOut' => $soldOut,
        'promos' => $promos,
        'gallery' => $gallery
    ];
}

function saveConfig($config) {
    if (!is_array($config)) respond(false, 'Format konfigurasi tidak valid.', null, 400);
    $pdo = db();

    $shop = is_array($config['shop'] ?? null) ? $config['shop'] : [];
    $name = cleanText($shop['name'] ?? 'Es Teh Poci Nusantara', 100);
    $wa = cleanText($shop['wa'] ?? '', 30);
    $address = cleanText($shop['address'] ?? '', 255);
    $landmark = cleanText($shop['landmark'] ?? '', 255);
    $open = max(0, min(23, (int)($shop['open'] ?? 9)));
    $close = max(1, min(24, (int)($shop['close'] ?? 17)));
    $fee = max(0, (int)($shop['fee'] ?? 5000));

    if ($name === '' || $address === '' || $close <= $open) {
        respond(false, 'Data toko tidak valid.', null, 400);
    }

    $prices = is_array($config['prices'] ?? null) ? $config['prices'] : [];
    $soldOut = is_array($config['soldOut'] ?? null) ? array_map('strval', $config['soldOut']) : [];
    $promos = is_array($config['promos'] ?? null) ? $config['promos'] : [];
    $gallery = is_array($config['gallery'] ?? null) ? $config['gallery'] : [];

    try {
        $pdo->beginTransaction();

        $count = (int)$pdo->query('SELECT COUNT(*) FROM shop_settings')->fetchColumn();
        if ($count > 0) {
            $stmt = $pdo->prepare('UPDATE shop_settings SET name=?, whatsapp=?, address=?, landmark=?, open_hour=?, close_hour=?, delivery_fee=? ORDER BY id ASC LIMIT 1');
            $stmt->execute([$name, $wa, $address, $landmark, $open, $close, $fee]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO shop_settings (name, whatsapp, address, landmark, open_hour, close_hour, delivery_fee) VALUES (?,?,?,?,?,?,?)');
            $stmt->execute([$name, $wa, $address, $landmark, $open, $close, $fee]);
        }

        $menuStmt = $pdo->prepare('UPDATE menus SET price=?, sold_out=? WHERE price_key=?');
        foreach ($prices as $key => $price) {
            $price = max(500, min(200000, (int)$price));
            $menuStmt->execute([$price, in_array($key, $soldOut, true) ? 1 : 0, cleanText($key, 50)]);
        }
        // Pastikan status sold out menu yang tidak ada di prices tetap diperbarui.
        $allMenus = $pdo->query('SELECT price_key FROM menus')->fetchAll(PDO::FETCH_COLUMN);
        foreach ($allMenus as $key) {
            if (!array_key_exists($key, $prices)) continue;
            $menuStmt->execute([(int)$prices[$key], in_array($key, $soldOut, true) ? 1 : 0, $key]);
        }
        // soldOut pada website menggunakan nama menu, bukan price_key.
        $pdo->exec('UPDATE menus SET sold_out=0');
        $soldStmt = $pdo->prepare('UPDATE menus SET sold_out=1 WHERE name=?');
        foreach ($soldOut as $nameSold) $soldStmt->execute([cleanText($nameSold, 100)]);

        $pdo->exec('UPDATE promos SET active=0');
        $promoStmt = $pdo->prepare('INSERT INTO promos (code,type,value,minimum_purchase,active) VALUES (?,?,?,?,1) ON DUPLICATE KEY UPDATE type=VALUES(type), value=VALUES(value), minimum_purchase=VALUES(minimum_purchase), active=1');
        foreach (array_slice($promos, 0, 10) as $p) {
            $code = strtoupper(cleanText($p['code'] ?? '', 30));
            if (!preg_match('/^[A-Z0-9]{3,16}$/', $code)) continue;
            $type = (($p['type'] ?? '') === 'persen') ? 'persen' : 'tetap';
            $value = max(1, (int)($p['value'] ?? 1));
            if ($type === 'persen') $value = min(100, $value);
            $min = max(0, (int)($p['min'] ?? 0));
            $promoStmt->execute([$code, $type, $value, $min]);
        }

        $pdo->exec('DELETE FROM gallery');
        $galleryStmt = $pdo->prepare('INSERT INTO gallery (caption,image_path,art_index) VALUES (?,?,?)');
        foreach (array_slice($gallery, 0, 30) as $g) {
            if (!is_array($g)) continue;
            $caption = cleanText($g['caption'] ?? 'Foto', 255) ?: 'Foto';
            $src = isset($g['src']) ? cleanText($g['src'], 255) : null;
            $art = isset($g['art']) && is_numeric($g['art']) ? (int)$g['art'] : null;
            $galleryStmt->execute([$caption, $src, $art]);
        }

        $pdo->commit();
        return getConfig();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        respond(false, 'Konfigurasi gagal disimpan ke MySQL: ' . $e->getMessage(), null, 500);
    }
}

$action = $_GET['action'] ?? 'config';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($action === 'test' && $method === 'GET') {
        $pdo = db();
        $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
        respond(true, 'Koneksi MySQL berhasil.', ['database' => $dbName]);
    }

    if ($action === 'config' && $method === 'GET') {
        respond(true, 'Konfigurasi berhasil diambil dari MySQL.', getConfig());
    }

    if ($action === 'save_config' && $method === 'POST') {
        $raw = file_get_contents('php://input');
        $config = json_decode($raw, true);
        if (!is_array($config)) respond(false, 'Format konfigurasi tidak valid.', null, 400);
        respond(true, 'Konfigurasi berhasil disimpan ke MySQL.', saveConfig($config));
    }

    if ($action === 'menus' && $method === 'GET') {
        $rows = db()->query('SELECT id,name,category,description,size,price,sold_out FROM menus ORDER BY id ASC')->fetchAll();
        respond(true, 'Menu berhasil diambil.', $rows);
    }

    if ($action === 'promos' && $method === 'GET') {
        $rows = db()->query('SELECT id,code,type,value,minimum_purchase AS min,active FROM promos ORDER BY id ASC')->fetchAll();
        respond(true, 'Promo berhasil diambil.', $rows);
    }

    if ($action === 'orders' && $method === 'GET') {
        $rows = db()->query('SELECT id,order_code,created_at,status,fulfillment,customer_name,customer_address,customer_note,promo_code,subtotal,discount,delivery_fee,total FROM orders ORDER BY id DESC')->fetchAll();
        respond(true, 'Pesanan berhasil diambil.', $rows);
    }

    if ($action === 'order' && $method === 'POST') {
        $raw = file_get_contents('php://input');
        if (strlen($raw) > 200000) respond(false, 'Data pesanan terlalu besar.', null, 413);
        $order = json_decode($raw, true);
        if (!is_array($order)) respond(false, 'Data pesanan tidak valid.', null, 400);

        $items = isset($order['items']) && is_array($order['items']) ? array_slice($order['items'], 0, 50) : [];
        if (!$items) respond(false, 'Keranjang pesanan kosong.', null, 400);

        $cleanItems = [];
        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $name = cleanText($item['name'] ?? '', 100);
            $detail = cleanText($item['detail'] ?? '', 255);
            $unit = max(0, (int)($item['unit'] ?? 0));
            $qty = max(1, min(99, (int)($item['qty'] ?? 1)));
            if ($name === '' || $unit < 0) continue;
            $cleanItems[] = ['name'=>$name, 'detail'=>$detail, 'unit'=>$unit, 'qty'=>$qty];
        }
        if (!$cleanItems) respond(false, 'Item pesanan tidak valid.', null, 400);

        $customer = is_array($order['customer'] ?? null) ? $order['customer'] : [];
        $totals = is_array($order['totals'] ?? null) ? $order['totals'] : [];
        $fulfillment = in_array(($order['fulfillment'] ?? 'ambil'), ['ambil','antar'], true) ? $order['fulfillment'] : 'ambil';
        $orderCode = 'ORD-' . date('YmdHis') . '-' . random_int(100, 999);
        $pdo = db();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO orders (order_code,created_at,status,created_from,fulfillment,customer_name,customer_address,customer_note,promo_code,subtotal,discount,delivery_fee,total,whatsapp_url,page_url,browser) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $stmt->execute([
                $orderCode, date('Y-m-d H:i:s'), 'baru', 'website', $fulfillment,
                cleanText($customer['name'] ?? '', 100), cleanText($customer['address'] ?? '', 255), cleanText($customer['note'] ?? '', 500),
                strtoupper(cleanText($order['promo'] ?? '', 30)),
                max(0,(int)($totals['subtotal'] ?? 0)), max(0,(int)($totals['discount'] ?? 0)), max(0,(int)($totals['delivery'] ?? 0)), max(0,(int)($totals['total'] ?? 0)),
                substr((string)($order['whatsapp_url'] ?? ''),0,10000), substr((string)($order['page'] ?? ''),0,2000), substr((string)($order['browser'] ?? ''),0,1000)
            ]);
            $orderId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare('INSERT INTO order_items (order_id,menu_id,menu_name,detail,unit_price,quantity,subtotal) VALUES (?,?,?,?,?,?,?)');
            $menuStmt = $pdo->prepare('SELECT id FROM menus WHERE name=? LIMIT 1');
            foreach ($cleanItems as $item) {
                $menuStmt->execute([$item['name']]);
                $menuId = $menuStmt->fetchColumn();
                $itemStmt->execute([$orderId, $menuId ?: null, $item['name'], $item['detail'], $item['unit'], $item['qty'], $item['unit'] * $item['qty']]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }

        respond(true, 'Pesanan berhasil dicatat ke MySQL.', ['id' => $orderCode, 'db_id' => $orderId]);
    }

    respond(false, 'Aksi tidak ditemukan.', null, 404);
} catch (Throwable $e) {
    respond(false, 'Terjadi kesalahan server: ' . $e->getMessage(), null, 500);
}