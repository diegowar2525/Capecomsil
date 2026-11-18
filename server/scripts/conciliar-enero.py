"""Conciliación local: no conecta a BD ni modifica el libro fuente."""
import argparse
import collections
import datetime as dt
from decimal import Decimal
import importlib.util
import json
from pathlib import Path
import re

spec = importlib.util.spec_from_file_location('auditoria', Path(__file__).with_name('auditar-enero.py'))
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)

def dinero(value):
    return (a.numero(value) or Decimal(0)).quantize(Decimal('.01'))

def conciliar(archivo, salida):
    a.auditar(archivo, salida)
    sheets = a.leer(archivo)
    import csv
    def preparados(nombre):
        with (salida / (nombre + '.csv')).open(encoding='utf-8-sig') as f:
            return list(csv.DictReader(f))
    excepciones, cobertura, empresas, facturas, pagos = [], [], [], [], []
    exclusiones, avisos = [], []
    def pendiente(origen, detalle):
        excepciones.append(dict(origen=origen, detalle=detalle))
    for fila, row in sheets['DATOS'].items():
        if fila >= 5 and a.val(row, 'B') not in ('', '0') and a.val(row, 'D') not in ('', '0') and a.val(row, 'C') not in ('', '0'):
            empresas.append(dict(origen=f'DATOS!{fila}', gasolinera=a.val(row,'B'), empresa_excel=a.val(row,'C'), ruc=re.sub(r'\D','',a.val(row,'D')), agente_retencion=a.val(row,'F'), estado='PROPUESTA_POR_REVISAR'))
    conocidas = {e['gasolinera'] for e in empresas}
    viajes = preparados('viajes')
    for nombre in sorted({t['gasolinera'] for t in viajes} - conocidas):
        if nombre == 'SANTA MARTHA':
            empresas.append(dict(origen='CONFIRMACION_USUARIO', gasolinera=nombre, empresa_excel=nombre, ruc='', agente_retencion='', estado='NOMBRE_CONFIRMADO_SIN_RUC'))
        else:
            pendiente('DATOS', f'Gasolinera sin empresa identificada: {nombre}')
    por_dia = collections.defaultdict(list)
    for e in preparados('gastos'):
        if e['tipo'] != 'VIATICO':
            continue
        ref = 'GASTO MECHITA!' + e['fila']
        texto = e['observacion'].upper()
        match = re.search(r'\b(?:X|POR)\s+(\d+)\s+DIAS\b', texto)
        dias = int(match.group(1)) if match else 2 if 'VIERNES Y SABADO' in texto else 1
        if e['fila'] == '58' and e['comprobante'] == '1663':
            dias = 5
        if e['fila'] == '4' and e['comprobante'] == '1626':
            assert e['responsable'] == 'ESPINOZA' and e['fecha'] == '2026-01-02' and dinero(e['monto']) == 54
            dias = 2  # Viernes y sábado, confirmado el 16/11/2026.
        inicio = dt.date.fromisoformat(e['fecha'])
        explicita = re.search(r'PARA\s*EL\s*(\d{1,2})/(\d{1,2})', texto)
        if explicita:
            inicio = dt.date(2026, int(explicita.group(2)), int(explicita.group(1)))
        if e['fila'] == '39' and e['comprobante'] == '1653':
            assert e['responsable'] == 'PEREZ' and e['fecha'] == '2026-01-12' and dinero(e['monto']) == 40
            inicio = dt.date(2026, 1, 11)  # Conservar fecha del desembolso.
        if 'DOMINGO' in texto and inicio.weekday() != 6:
            pendiente(ref, f'Observación dice domingo; desembolso {inicio}. Falta confirmar día cubierto.')
            continue
        importe = dinero(e['monto'])
        viatico = min(importe, Decimal(12 * dias))
        peaje = importe - viatico
        assert viatico + peaje == importe
        for offset in range(dias):
            dia = (inicio + dt.timedelta(days=offset)).isoformat()
            candidatos = [t['fila'] for t in viajes if t['fecha_inicio'] == dia and t['chofer'] == e['responsable']]
            cobertura.append(dict(origen=ref, comprobante=e['comprobante'], chofer=e['responsable'], placa=e['placa'], fecha_desembolso=e['fecha'], dia_cubierto=dia, viatico=str(viatico / dias), peaje_desembolso=str(peaje) if offset == 0 else '0.00', filas_trans=';'.join(candidatos), estado='PROPUESTA_REVISAR' if not candidatos else 'PROPUESTA'))
            por_dia[e['responsable'],dia].append(ref)
            if not candidatos:
                avisos.append(dict(origen=ref, detalle=f'{e["responsable"]}: sin viaje documentado el {dia}; conservar desembolso sin inventar viaje.'))
    for (chofer,dia), refs in por_dia.items():
        if len(refs) > 1:
            avisos.append(dict(origen='; '.join(refs), detalle=f'{chofer}, {dia}: aportes acumulados del día; conservar cada comprobante una sola vez.'))
    diarios = []
    for chofer, dia in sorted(por_dia):
        aportes = [c for c in cobertura if c['chofer'] == chofer and c['dia_cubierto'] == dia]
        diarios.append(dict(chofer=chofer, dia_cubierto=dia, viatico_total=str(sum(dinero(c['viatico']) for c in aportes)), comprobantes=';'.join(c['comprobante'] for c in aportes)))
    for fila, row in sheets['FACTURACION'].items():
        numero = a.val(row,'G')
        if not numero.isdigit():
            continue
        emision = a.fecha(a.val(row,'D'))
        if emision and emision >= '2026-02-01':
            continue
        anulada = 'ANULADA' in a.val(row,'E')
        if anulada and numero in {'128','129','130'}:
            exclusiones.append(dict(origen=f'FACTURACION!{fila}', concepto=f'Factura {numero}', importe='', motivo='Anulada; exclusión financiera aprobada'))
            continue
        if anulada:
            pendiente(f'FACTURACION!{fila}', f'Factura {numero} anulada sin cliente/importe suficientes; conservar referencia, no inventar documento.')
        facturas.append(dict(origen=f'FACTURACION!{fila}', numero=numero, empresa=a.val(row,'F'), estaciones=a.val(row,'E'), periodo_servicio=a.val(row,'B'), fecha_emision=emision or '', total_transporte=str(dinero(a.val(row,'H'))), retencion=str(dinero(a.val(row,'I'))), neto=str(dinero(a.val(row,'J'))), cobrado=str(dinero(a.val(row,'K'))), fecha_cobro=a.fecha(a.val(row,'O')) or '', comprobante=a.val(row,'P'), estado='PENDIENTE_DATOS' if anulada else 'PROPUESTA_HISTORICA'))
    vistos = {}
    for fila, row in sheets['CHEQUES'].items():
        if fila < 5 or not a.val(row,'C'):
            continue
        for fecha_col, cheque_col, importe_col in [('I','J','K'),('M','N','O'),('Q','R','S')]:
            fecha = a.fecha(a.val(row,fecha_col))
            importe = dinero(a.val(row,importe_col))
            if not fecha or importe <= 0:
                continue
            if (fila,fecha_col,a.val(row,fecha_col)) == (5,'I','45672'):
                fecha = '2026-01-15'
            if (fila,fecha_col,a.val(row,fecha_col)) == (7,'M','46027'):
                fecha = '2026-02-05'
            cheque = a.val(row,cheque_col)
            documento = a.val(row,'D')
            clave = (cheque, fecha, str(importe), ''.join(re.findall(r'\d',documento)))
            ref = f'CHEQUES!{fecha_col}{fila}'
            duplicado = vistos.get(clave, '') if cheque else ''
            confirmado = (ref, duplicado, clave) in {
                ('CHEQUES!I11', 'CHEQUES!I5', ('816', '2026-01-15', '1575.00', '14404')),
                ('CHEQUES!I12', 'CHEQUES!I6', ('817', '2026-01-06', '468.00', '5230')),
            }
            if duplicado and not confirmado:
                pendiente(ref, f'Posible duplicado de {duplicado}: cheque {cheque}, documento {documento}, {importe}; proveedor con otro nombre.')
            elif cheque and not duplicado:
                vistos[clave] = ref
            pagos.append(dict(origen=ref, proveedor=a.val(row,'C'), documento=documento, concepto=a.val(row,'F'), clasificacion=a.val(row,'G'), total_original=str(dinero(a.val(row,'A'))), saldo_excel=str(dinero(a.val(row,'E'))), fecha_pago=fecha, cheque=cheque, importe=str(importe), periodo='ENERO' if fecha.startswith('2026-01') else 'OTRO_PERIODO', posible_duplicado_de=duplicado, estado='REVISAR_DOCUMENTO_Y_CLASIFICACION'))
            if confirmado:
                pagos[-1]['estado'] = 'OMITIDO_DUPLICADO_CONFIRMADO'
    resumen = json.loads((salida/'resumen.json').read_text(encoding='utf-8'))
    assert resumen['actividad_realizada'] == {'viajes':318,'galones':'1085000.00','transporte':'25592.00'}, 'Cambió el origen: revisar totales antes de continuar'
    assert resumen['actividad_anulada']['viajes'] == 9
    assert resumen['gastos_total'] == '7533.71'
    omitidos = [p for p in pagos if p['estado'] == 'OMITIDO_DUPLICADO_CONFIRMADO']
    unicos = [p for p in pagos if p['estado'] != 'OMITIDO_DUPLICADO_CONFIRMADO']
    bancarizacion = [p for p in unicos if p['clasificacion'].strip().upper() == 'BANCARIZACION']
    unicos = [p for p in unicos if p not in bancarizacion]
    for p in bancarizacion:
        exclusiones.append(dict(origen=p['origen'], concepto=p['concepto'], importe=p['importe'], motivo='Bancarización excluida por el usuario; fecha ' + p['fecha_pago']))
    exclusiones.append(dict(origen='FACTURACION!K19', concepto='DEVOLUCION', importe='1103.81', motivo='Excluida: corresponde a tratamiento de meses posteriores, confirmado por usuario'))
    descuentos = []
    for p in unicos:
        if p['proveedor'] == 'IESS':
            p['estado'] = 'CONSERVAR_PAGO_IESS'
        if p['origen'] == 'CHEQUES!I20':
            assert dinero(p['importe']) == Decimal('120.71')
            p['estado'] = 'PAGO_IESS_HISTORICO_SIN_DESCUENTO'
            avisos.append(dict(origen=p['origen'], detalle='AREVALO: conservar pago IESS 120.71 sin aplicar descuento salarial, por decisión posterior del usuario.'))
    assert len(omitidos) == 2 and sum(dinero(p['importe']) for p in omitidos) == Decimal('2043.00')
    for nombre, datos in [('empresas_propuestas',empresas),('cobertura_viaticos',cobertura),('facturas_clientes_revision',facturas),('pagos_proveedores_revision',unicos),('pagos_proveedores_duplicados_omitidos',omitidos),('excepciones_conciliacion',excepciones)]:
        a.guardar_csv(salida/(nombre+'.csv'),datos)
    for nombre, datos in [('viaticos_por_dia',diarios),('exclusiones_confirmadas',exclusiones),('avisos_trazabilidad',avisos),('descuentos_choferes',descuentos)]:
        a.guardar_csv(salida/(nombre+'.csv'),datos)
    assert sum(dinero(c['viatico']) for c in cobertura) == sum(dinero(d['viatico_total']) for d in diarios)
    informe = ['# Conciliación de enero de 2026', '', 'Preparación local. No se ha importado ni modificado la base de datos.', '', f"SHA256 del Excel: `{resumen['archivo_sha256']}`", '', 'Verificado: 318 viajes realizados, 9 anulados, 1.085.000 galones y $25.592 de transporte.', 'Gastos fuente: $7.533,71. Excluidos sueldo/anticipo: $250. Restante: $7.283,71.', '', 'Los CSV son propuestas, no autorización automática de importación. No sumar filas duplicadas ni pagos de otros períodos. Los peajes se consignan una sola vez por desembolso en cobertura_viaticos.csv.', '', '## Excepciones', '']
    informe += [f'- {e["origen"]}: {e["detalle"]}' for e in excepciones]
    informe += ['', '## Decisiones aplicadas el 16/11/2026', '', '- Cheques 816 y 817: una sola copia por pago. Dos registros duplicados por $2.043 separados en pagos_proveedores_duplicados_omitidos.csv, conservando referencias originales.', '- Comprobante 1626: cobertura 2 y 3 de enero; $24 de viáticos y $30 de peaje. Desembolso original $54 el 2 de enero.', '- Comprobante 1653: cobertura 11 de enero; $12 de viático y $28 de peaje. Desembolso original $40 el 12 de enero.']
    informe += ['', '## Últimas decisiones aplicadas', '', '- Empresa SANTA MARTHA con el mismo nombre que la gasolinera, sin inventar RUC.', '- Viáticos coincidentes acumulados por chofer/día, conservando comprobantes e importes.', '- Facturas anuladas 128, 129 y 130, bancarización y devolución de $1.103,81 excluidas.', '- Pagos IESS conservados. AREVALO sin descuento salarial; pago histórico de $120,71 conservado sin otro desembolso.', '', '## Alcance financiero', '', 'Los cambios del paquete requieren un ensayo separado. Los pagos fuera de enero permanecen separados por período.']
    (salida/'CONCILIACION.md').write_text('\n'.join(informe)+'\n',encoding='utf-8')
    print(f'Conciliación preparada: {len(excepciones)} observaciones. Sin conexión a BD.')

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('archivo',type=Path)
    p.add_argument('--salida',type=Path,required=True)
    args = p.parse_args()
    conciliar(args.archivo,args.salida)
