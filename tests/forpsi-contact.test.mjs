import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const endpoint = fileURLToPath(new URL('../hosting/forpsi/contact.php', import.meta.url));
let serial = 0;
function request({ method = 'POST', origin = 'https://www.growe.cz', fields = {}, send = true, ip, contentLength = 300 } = {}) {
  const server = { REQUEST_METHOD: method, HTTP_ORIGIN: origin, REMOTE_ADDR: ip || `test-${process.pid}-${serial++}`, CONTENT_LENGTH: String(contentLength) };
  const post = { name: 'Test', email: 'test@example.com', message: 'Testovací poptávka', ...fields };
  const php = `
    $emails=[];
    function mail($to,$subject,$body,$headers){global $emails;$emails[]=['to'=>$to,'subject'=>$subject,'body'=>base64_decode($body),'headers'=>$headers];return ${send ? 'true' : 'false'};}
    $_SERVER=json_decode(base64_decode('${Buffer.from(JSON.stringify(server)).toString('base64')}'),true);
    $_POST=json_decode(base64_decode('${Buffer.from(JSON.stringify(post)).toString('base64')}'),true);
    register_shutdown_function(function(){global $emails;fwrite(STDERR,json_encode(['status'=>http_response_code(),'emails'=>$emails]));});
    require ${JSON.stringify(endpoint)};`;
  const result = spawnSync(process.env.PHP_BIN || 'php', ['-d', 'disable_functions=mail', '-r', php], { encoding: 'utf8', env: { ...process.env, RESEND_API_KEY: '' } });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return { ...JSON.parse(result.stderr), ...JSON.parse(result.stdout) };
}
test('hands exactly one inquiry to hosting mail with fixed sender and customer Reply-To', () => {
  const result = request();
  assert.equal(result.status,200); assert.equal(result.ok,true);
  assert.equal(result.emails.length,1);
  const email = result.emails[0];
  assert.equal(email.to,'info@growe.cz');
  assert.equal(email.headers.From,'Growe <info@growe.cz>');
  assert.equal(email.headers['Reply-To'],'test@example.com');
  assert.equal(email.headers['Content-Type'],'text/plain; charset=UTF-8');
  assert.equal(email.headers['Content-Transfer-Encoding'],'base64');
  assert.match(email.body,/Testovací poptávka/);
  assert.doesNotMatch(result.message,/míří potvrzení|pošleme potvrzení/);
});
test('rejects other methods and foreign origins without sending', () => {
  for (const [options,status] of [[{method:'GET'},405],[{origin:'https://other.example'},403]]) {
    const result=request(options); assert.equal(result.status,status); assert.equal(result.emails.length,0);
  }
});
test('English enquiries receive English messages and still reach the same inbox', () => {
  const result = request({fields:{lang:'en',service:'Online stores'}});
  assert.equal(result.status,200);
  assert.match(result.message,/^Thank you!/);
  assert.equal(result.emails.length,1);
  assert.equal(result.emails[0].to,'info@growe.cz');
  assert.match(result.emails[0].body,/Služba: Online stores/);
  const invalid = request({fields:{lang:'en',email:'invalid'}});
  assert.equal(invalid.status,422);
  assert.match(invalid.message,/valid email address/);
  assert.equal(invalid.emails.length,0);
});
test('rejects invalid email, header injection and array inputs', () => {
  for(const email of ['invalid','test@example.com\r\nBcc:bad@example.com', ['test@example.com']]) {
    const result=request({fields:{email}}); assert.equal(result.status,422); assert.equal(result.emails.length,0);
  }
});
test('honeypot rejects the request without sending', () => {
  const result=request({fields:{website:'spam'}});
  assert.equal(result.status,422); assert.equal(result.emails.length,0);
});
test('mail failure stays an error with a useful direct contact', () => {
  const result=request({send:false}); assert.equal(result.status,503); assert.equal(result.ok,false);
  assert.match(result.message,/info@growe.cz/);
});
test('repeated requests are rate limited before a second email is sent', () => {
  const ip=`repeat-${process.pid}`;
  assert.equal(request({ip}).status,200);
  const result=request({ip}); assert.equal(result.status,429); assert.equal(result.emails.length,0);
});
test('all inquiry details reach the one internal email', () => {
  const result=request({fields:{name:'Patrik',company:'Firma',phone:'+420 123 456 789',service:'E-shopy',budget:'50000 Kč',deadline:'Do 1 měsíce'}});
  const body=result.emails[0].body;
  for(const value of ['Jméno: Patrik','Firma: Firma','Telefon: +420 123 456 789','Služba: E-shopy','Rozpočet: 50000 Kč','Termín: Do 1 měsíce']) assert.ok(body.includes(value),value);
});
test('rejects oversized requests and malformed fields without sending', () => {
  for(const [options,status] of [[{contentLength:20001},413],[{fields:{name:false}},422],[{fields:{message:'x'.repeat(12001)}},422]]) {
    const result=request(options); assert.equal(result.status,status); assert.equal(result.emails.length,0);
  }
});
