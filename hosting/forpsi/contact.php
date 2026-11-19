<?php
// FORPSI Linux hosting, PHP 8+. No credentials in the public frontend.
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(int $status, string $message, string $english): void {
    if (($_POST['lang'] ?? '') === 'en') $message = $english;
    http_response_code($status);
    echo json_encode(['ok' => $status === 200, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'Použijte prosím kontaktní formulář.', 'Please use the contact form.');
}
if (!in_array($_SERVER['HTTP_ORIGIN'] ?? '', ['https://www.growe.cz', 'https://growe.cz'], true)) {
    respond(403, 'Obnovte stránku a zkuste to znovu.', 'Refresh the page and try again.');
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    respond(413, 'Zpráva je příliš dlouhá.', 'Your message is too long.');
}
$values = [];
foreach (['name' => 150, 'company' => 200, 'email' => 254, 'phone' => 80, 'message' => 12000, 'website' => 200, 'service' => 150, 'budget' => 200, 'deadline' => 200] as $key => $max) {
    $value = $_POST[$key] ?? '';
    if (!is_string($value) || strlen($value) > $max || preg_match('//u', $value) !== 1) {
        respond(422, 'Zkontrolujte prosím vyplněné údaje.', 'Please check the information you entered.');
    }
    $values[$key] = trim($value);
}
if ($values['website'] !== '') respond(422, 'Poptávku se nepodařilo odeslat. Napište nám na info@growe.cz.', 'We couldn’t send your enquiry. Please email info@growe.cz.');
if ($values['name'] === '' || !filter_var($values['email'], FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n\x00]/', $values['email'])) {
    respond(422, 'Vyplňte prosím jméno a platný e-mail.', 'Please enter your name and a valid email address.');
}
// A locked, bounded timestamp map limits repeated requests without storing form data.
$lock = fopen(sys_get_temp_dir() . '/growe-contact-' . hash('sha256', __DIR__) . '.json', 'c+');
if (!$lock || !flock($lock, LOCK_EX)) respond(503, 'Formulář je dočasně nedostupný. Napište nám na info@growe.cz.', 'The form is temporarily unavailable. Please email info@growe.cz.');
$now = time();
$recent = json_decode(stream_get_contents($lock), true);
$recent = is_array($recent) ? array_filter($recent, static fn($time) => is_int($time) && $time > time() - 60) : [];
$key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __DIR__);
if (isset($recent[$key]) || count($recent) >= 1000) {
    flock($lock, LOCK_UN); fclose($lock);
    header('Retry-After: 60');
    respond(429, 'Počkejte prosím minutu, než odešlete další zprávu.', 'Please wait a minute before sending another enquiry.');
}
$recent[$key] = $now;
ftruncate($lock, 0); rewind($lock);
$stored = fwrite($lock, json_encode($recent));
flock($lock, LOCK_UN); fclose($lock);
if ($stored === false) respond(503, 'Formulář je dočasně nedostupný. Napište nám na info@growe.cz.', 'The form is temporarily unavailable. Please email info@growe.cz.');
$details = '';
foreach (['name' => 'Jméno', 'company' => 'Firma', 'email' => 'E-mail', 'phone' => 'Telefon', 'service' => 'Služba', 'budget' => 'Rozpočet', 'deadline' => 'Termín', 'message' => 'Nápad'] as $field => $label) {
    $value = $values[$field] !== '' ? $values[$field] : 'Neuvedeno';
    $details .= "$label: $value\n";
}
$headers = [
    'From' => 'Growe <info@growe.cz>',
    'Reply-To' => $values['email'],
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => 'base64',
];
$subject = '=?UTF-8?B?' . base64_encode('Poptávka z webu Growe') . '?=';
$body = chunk_split(base64_encode("Nová poptávka z growe.cz\n\n$details"));
if (!function_exists('mail') || !@mail('info@growe.cz', $subject, $body, $headers)) {
    respond(503, 'Poptávku se nepodařilo předat k odeslání. Údaje zůstaly ve formuláři. Napište nám prosím na info@growe.cz.', 'We couldn’t send your enquiry. Your details are still in the form. Please email info@growe.cz.');
}
respond(200, 'Děkujeme! Poptávka byla předána k odeslání. Ozveme se vám zpravidla do jednoho pracovního dne.', 'Thank you! Your enquiry is on its way. We usually reply within one business day.');
