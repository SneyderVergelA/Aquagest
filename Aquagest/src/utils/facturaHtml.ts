import { cantidad, formatFecha, formatHora, moneda, numeroFactura } from './formato';

const esc = (t: any) =>
  String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// HTML de la factura que expo-print convierte en PDF
export function construirFacturaHtml(c: any): string {
  const fila = (concepto: string, detalle: string, valor: number) =>
    `<tr><td>${esc(concepto)}</td><td class="c">${esc(detalle)}</td><td class="d">${moneda(valor)}</td></tr>`;

  const lineas = [
    fila(c.servicio, '1', c.valor_servicio),
    ...(c.adicionales || []).map((a: any) => fila(a.nombre + ' (adicional)', '1', a.valor)),
    ...(c.productos || []).map((p: any) =>
      fila(p.nombre, `${cantidad(p.cantidad)} x ${moneda(p.precio_unitario)}`, p.subtotal)
    ),
  ].join('');

  const pagado = c.estado_pago === 'Pagado';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #17324F; padding: 28px; }
  .top { background: #123C68; color: #fff; padding: 18px 22px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
  .top h1 { margin: 0; font-size: 26px; } .top h1 span { color: #28B9F4; }
  .top p { margin: 2px 0 0; font-size: 12px; color: #D8E9FA; }
  .num { text-align: right; font-size: 13px; } .num b { font-size: 20px; display: block; }
  .bloques { display: flex; gap: 14px; margin: 18px 0; }
  .bloque { flex: 1; border: 1px solid #D8E4F1; border-radius: 10px; padding: 12px 14px; font-size: 13px; line-height: 1.6; }
  .bloque h3 { margin: 0 0 6px; font-size: 12px; color: #637B95; text-transform: uppercase; letter-spacing: .5px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #E5F1FF; text-align: left; padding: 9px 10px; color: #123C68; }
  td { padding: 9px 10px; border-bottom: 1px solid #D8E4F1; }
  .c { text-align: center; } .d { text-align: right; } th.c { text-align: center; } th.d { text-align: right; }
  .total { margin-top: 14px; text-align: right; font-size: 20px; font-weight: bold; color: #123C68; }
  .estado { display: inline-block; margin-top: 10px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold;
            background: ${pagado ? '#E1F6EE' : '#FFF0E1'}; color: ${pagado ? '#209B73' : '#F28A2E'}; }
  .pie { margin-top: 30px; text-align: center; font-size: 11px; color: #637B95; }
</style></head>
<body>
  <div class="top">
    <div><h1>Aqua<span>Gest</span></h1><p>Gestor de Lavadero Vehicular</p></div>
    <div class="num">Factura No.<b>${numeroFactura(c.id_cita)}</b></div>
  </div>
  <div class="bloques">
    <div class="bloque">
      <h3>Cliente</h3>
      ${esc(c.cliente)}<br/>${esc(c.cliente_tipo_doc)} ${esc(c.cliente_documento)}<br/>Tel. ${esc(c.cliente_telefono)}
    </div>
    <div class="bloque">
      <h3>Servicio</h3>
      Fecha: ${formatFecha(c.fecha)}<br/>Hora: ${formatHora(c.hora)}<br/>
      Vehículo: ${esc(c.placa)}${c.marca ? ' · ' + esc(c.marca) : ''}${c.tipo_vehiculo ? ' (' + esc(c.tipo_vehiculo) + ')' : ''}
      ${c.empleado ? '<br/>Atendió: ' + esc(c.empleado) : ''}
    </div>
  </div>
  <table>
    <tr><th>Concepto</th><th class="c">Cantidad</th><th class="d">Valor</th></tr>
    ${lineas}
  </table>
  <div class="total">Total: ${moneda(c.total)}</div>
  <div style="text-align:right"><span class="estado">${pagado ? 'PAGADO' : 'PAGO PENDIENTE'}</span></div>
  <div class="pie">Gracias por confiar en AquaGest · Un mejor control, un servicio impecable</div>
</body></html>`;
}
