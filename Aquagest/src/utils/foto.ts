import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Reduce la foto (720 px de ancho, JPEG) para que el texto base64 pese poco en la BD.
async function reducir(uri: string): Promise<string | null> {
  const M: any = ImageManipulator;
  if (typeof M.manipulateAsync === 'function') {
    const r = await M.manipulateAsync(uri, [{ resize: { width: 720 } }], { compress: 0.5, format: 'jpeg', base64: true });
    return r.base64 ?? null;
  }
  const contexto = M.ImageManipulator.manipulate(uri);
  contexto.resize({ width: 720 });
  const imagen = await contexto.renderAsync();
  const r = await imagen.saveAsync({ compress: 0.5, format: 'jpeg', base64: true });
  return r.base64 ?? null;
}

// Abre la cámara y devuelve la foto como texto base64 (sin prefijo), o null si se cancela.
export async function tomarFotoBase64(): Promise<string | null> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) throw new Error('Necesitas dar permiso a la cámara para tomar la foto.');
  const r = await ImagePicker.launchCameraAsync({ quality: 0.6 });
  if (r.canceled || !r.assets || !r.assets.length) return null;
  return reducir(r.assets[0].uri);
}

export const uriDeFoto = (base64: string) => ({ uri: `data:image/jpeg;base64,${base64}` });
