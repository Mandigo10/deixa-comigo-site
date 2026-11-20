// Gera o "Pix copia e cola" (BR Code estático, padrão EMV do Banco Central).

function campo(id, valor) {
  const v = String(valor);
  return id + String(v.length).padStart(2, '0') + v;
}

export function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function semAcento(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function textoPix(s, max) {
  const t = semAcento(s).replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, max);
  return t || 'NA';
}

// Deixa a chave no formato que o Pix exige
export function normalizarChave(tipo, chave) {
  const c = String(chave || '').trim();
  const d = c.replace(/\D/g, '');
  switch (tipo) {
    case 'cpf':
    case 'cnpj':
      return d;
    case 'telefone':
      if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return '+' + d;
      if (d.length === 10 || d.length === 11) return '+55' + d;
      return c.startsWith('+') ? '+' + d : '+' + d;
    case 'email':
      return c.toLowerCase();
    default:
      return c.toLowerCase();
  }
}

export function validarChave(tipo, chave) {
  const c = normalizarChave(tipo, chave);
  switch (tipo) {
    case 'cpf': return c.length === 11;
    case 'cnpj': return c.length === 14;
    case 'telefone': return /^\+55\d{10,11}$/.test(c);
    case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && c.length <= 77;
    case 'aleatoria': return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(c);
    default: return false;
  }
}

export function gerarPix({ chave, nome, cidade, valor, txid }) {
  const gui = campo('00', 'br.gov.bcb.pix') + campo('01', chave);
  const id = String(txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  let payload =
    campo('00', '01') +
    campo('26', gui) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor ? campo('54', Number(valor).toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', textoPix(nome, 25)) +
    campo('60', textoPix(cidade, 15)) +
    campo('62', campo('05', id)) +
    '6304';
  return payload + crc16(payload);
}
