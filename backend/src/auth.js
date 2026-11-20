const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET || 'aquagest_clave_de_desarrollo';

const ROLES = { ADMIN: 1, EMPLEADO: 2, CLIENTE: 3 };

// Error con mensaje que se muestra al usuario: throw error(409, 'texto')
function error(status, mensaje) {
  return Object.assign(new Error(mensaje), { status, publico: mensaje });
}

function firmar(usuario) {
  return jwt.sign({ id: usuario.id_usuario, rol: usuario.fk_pk_id_rol }, SECRET, { expiresIn: '7d' });
}

function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Debes iniciar sesión' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ message: 'Tu sesión venció, inicia sesión de nuevo' });
  }
}

function permitir(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

const hashear = (contrasena) => bcrypt.hash(contrasena, 10);

// Acepta contraseñas cifradas (bcrypt) y las antiguas guardadas en texto plano.
async function verificar(contrasena, guardada) {
  if (guardada && guardada.startsWith('$2')) return bcrypt.compare(contrasena, guardada);
  return contrasena === guardada;
}

const esBcrypt = (guardada) => !!guardada && guardada.startsWith('$2');

function limpiarUsuario(u) {
  const { contrasena, ...resto } = u;
  return resto;
}

// Devuelve la lista de campos obligatorios que no vienen en el body
function faltan(body, campos) {
  return campos.filter((c) => body[c] === undefined || body[c] === null || String(body[c]).trim() === '');
}

module.exports = { ROLES, error, firmar, autenticar, permitir, hashear, verificar, esBcrypt, limpiarUsuario, faltan };
