const crypto = require('crypto');

const ENCRYPTION_KEY = 'tu-clave-super-segura-de-32-caracteres!!!!';
const keyHash = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const IV_LENGTH = 16;

function encryptData(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

const payments = [
  { id: 'bancolombia-savings', account: '30625176901', name: 'Bancolombia Ahorros', type: 'Ahorros' },
  { id: 'bancolombia-keys', account: 'dffigueroamgmail.com', name: 'Bancolombia (Llaves)', type: 'Llaves' },
  { id: 'nu-savings', account: '94329938', name: 'NU', type: 'Ahorros' },
  { id: 'nequi', account: '3137184290', name: 'Nequi', type: 'Teléfono' },
  { id: 'daviplata', account: '3137184290', name: 'Daviplata', type: 'Teléfono' }
];

console.log('📝 Datos encriptados para copiar en payment-methods.ts:\n');
console.log('const ENCRYPTED_PAYMENT_METHODS = [');
payments.forEach(p => {
  const enc = encryptData(p.account);
  console.log(`  {`);
  console.log(`    id: "${p.id}",`);
  console.log(`    name: "${p.name}",`);
  console.log(`    account: "${enc}",`);
  console.log(`    type: "${p.type}",`);
  console.log(`  },`);
});
console.log(']');

console.log('\n🔑 Agrega esto a .env.local:');
console.log(`ENCRYPTION_KEY=tu-clave-super-segura-de-32-caracteres!!!!\n`);
