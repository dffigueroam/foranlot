const crypto = require('crypto');

// Tu clave actual
const ENCRYPTION_KEY = "d09342cea8d3dd3c475c4c3a68041d9f67e40ec37dd90707791e69fc59fdc213";
const IV_LENGTH = 16;

// Generar hash de 32 bytes de la clave
const keyHash = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();

function encryptData(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Datos reales a encriptar (sin encriptación)
const paymentMethods = [
  {
    id: "bancolombia-savings",
    account: "30625176901",
    type: "Ahorros",
  },
  {
    id: "bancolombia-keys",
    account: "8115f3ae3e5a05623710a26cadc6438e:e5b6745fc1470d60076ab16ee68b314a4478f8e2969b660fbeaa75dc0b5f022e",
    type: "Llaves",
  },
  {
    id: "nu-savings",
    account: "3145678901",
    type: "Ahorros",
  },
  {
    id: "nequi",
    account: "3001234567",
    type: "Teléfono",
  },
  {
    id: "daviplata",
    account: "3009876543",
    type: "Teléfono",
  },
];

console.log("=== RE-ENCRIPTANDO DATOS DE PAGO ===\n");

paymentMethods.forEach((method) => {
  // El account actual parece estar sin formato claro
  // Necesitamos saber qué datos reales quieres encriptar
  console.log(`${method.id}:`);
  console.log(`  Encriptado: ${encryptData(method.account)}`);
  console.log();
});
