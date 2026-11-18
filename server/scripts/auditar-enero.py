"""Prepara staging de enero sin ejecutar macros, modificar Excel ni conectarse a BD.
Uso: python auditar-enero.py archivo.xlsm --salida directorio
Los valores de fórmulas son los guardados por Excel; no se recalculan.
"""
import argparse
import collections
import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def leer(path):
    with zipfile.ZipFile(path) as z:
        ss = ET.fromstring(z.read('xl/sharedStrings.xml'))
        strings = [''.join(n.itertext()) for n in ss]
        rel = {n.attrib['Id']: n.attrib['Target'] for n in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for s in ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', NS):
            target = rel[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            root = ET.fromstring(z.read(target.lstrip('/') if target.startswith('/') else 'xl/' + target))
            rows = {}
            for row in root.findall('.//s:sheetData/s:row', NS):
                cells = {}
                for c in row:
                    v = c.find('s:v', NS)
                    value = v.text if v is not None else None
                    if c.get('t') == 's' and value is not None:
                        value = strings[int(value)]
                    if c.get('t') == 'inlineStr':
                        value = ''.join(c.find('s:is', NS).itertext())
                    f = c.find('s:f', NS)
                    cells[re.sub(r'\d', '', c.get('r'))] = {'v': value, 'f': f.text if f is not None else None, 'tipo': c.get('t')}
                rows[int(row.get('r'))] = cells
            sheets[s.get('name')] = rows
        return sheets

def val(row, col):
    return (row.get(col, {}).get('v') or '').strip()

def numero(value):
    try:
        return Decimal(value)
    except Exception:
        return None

def fecha(value):
    n = numero(value)
    if n is None or not 1 < n < 100000:
        return None
    return (dt.datetime(1899, 12, 30) + dt.timedelta(days=float(n))).date().isoformat()

def guardar_csv(path, rows):
    if not rows:
        path.write_text('', encoding='utf-8-sig')
        return
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

def auditar(path, salida):
    sheets = leer(path)
    salida.mkdir(parents=True, exist_ok=True)
    issues, trips, routes, expenses = [], [], {}, []
    def issue(sheet, row, tipo, detail):
        issues.append(dict(hoja=sheet, fila=row, tipo=tipo, detalle=detail))
    # Distancias del catálogo DATOS, no distancias prorrateadas de TRANS.
    terminales = {'LA TRONCAL': ('G', 'H'), 'PASCUALES': ('M', 'N'), 'SANTO DOMINGO': ('S', 'T'), 'LA LIBERTAD': ('Y', 'Z'), 'TRONCAL - P INCA': ('AE', 'AF'), 'MANTA': ('AK', 'AL')}
    for r, row in sheets['DATOS'].items():
        station = val(row, 'B')
        if r < 5 or not station or station == '0':
            continue
        for terminal, (_, kmcol) in terminales.items():
            km = numero(val(row, kmcol))
            if km is not None and km > 0:
                routes[(terminal, station)] = (km, r)
    # Totales ida/vuelta provisionales confirmados por el usuario.
    routes[('LA TRONCAL', 'SANTA MARTHA')] = (Decimal('62'), 'usuario')
    routes[('PASCUALES', 'CADME CORP')] = (Decimal('93'), 21)
    for r, row in sheets['TRANS'].items():
        if r < 4 or not val(row, 'C') or not val(row, 'D'):
            continue
        date = fecha(val(row, 'B'))
        if not date or not date.startswith('2026-01'):
            issue('TRANS', r, 'fuera_periodo', str(date))
            continue
        item = {'clave_origen': f'ENERO-2026:TRANS:{r}', 'fila': r, 'fecha_inicio': date}
        for col, key in {'C':'gasolinera','D':'placa','E':'chofer','F':'producto','G':'galones','H':'terminal','I':'valor_por_galon','J':'transporte','M':'km_excel_prorrateado','N':'viatico_peaje_estimado','O':'combustible_estimado','P':'sueldo_excel','S':'dia_extra'}.items():
            item[key] = val(row, col)
        anulada = r in {29,30,45,46,47,48,81,82,83} and item['gasolinera'] == 'SANTA MARTHA'
        item['estado'] = 'ANULADO' if anulada else 'REGISTRADO'
        item['motivo_anulacion'] = 'Viaje no concretado; anulación confirmada por el usuario durante la migración.' if anulada else ''
        # Se desconoce cuándo se anuló; no inventar una fecha histórica.
        item['fecha_anulacion'] = ''
        q, price, total = [numero(item[k]) for k in ('galones','valor_por_galon','transporte')]
        if any(n is None for n in (q,price,total)) or q <= 0 or price < 0:
            issue('TRANS', r, 'importe_invalido', 'Revisar galones, precio y total')
        elif abs(q * price - total) > Decimal('.01'):
            issue('TRANS', r, 'importe_difiere', f'{q} * {price} != {total}')
        route = routes.get((item['terminal'], item['gasolinera']))
        item['km_ida_propuesto'] = str(route[0] / 2) if route else ''
        item['km_vuelta_propuesto'] = item['km_ida_propuesto']
        if not route:
            issue('TRANS', r, 'trayecto_sin_distancia', item['terminal'] + ' -> ' + item['gasolinera'])
        trips.append(item)
    for r, row in sheets['GASTO MECHITA'].items():
        date = fecha(val(row,'C'))
        # Correcciones aprobadas para este libro, sin editar el archivo fuente.
        if (r, val(row,'B'), val(row,'C')) == (36, '1647', '10'):
            date = '2026-01-10'
        elif (r, val(row,'B'), val(row,'C')) == (73, '1674', '24'):
            date = '2026-01-24'
        if not date or not date.startswith('2026-01') or not val(row,'F'):
            if r >= 4 and val(row,'F') and numero(val(row,'F')) is None and numero(val(row,'G')) not in (None, Decimal(0)):
                issue('GASTO MECHITA', r, 'gasto_fuera_periodo', f"fecha={date}; tipo={val(row,'F')}; monto={val(row,'G')}")
            continue
        expenses.append(dict(fila=r, fecha=date, comprobante=val(row,'B'), placa=val(row,'D'), responsable=val(row,'E'), tipo=val(row,'F'), monto=val(row,'G'), observacion=val(row,'H'), peaje_real='', viatico_real='', estado='PENDIENTE_CONCILIACION'))
    errors = []
    for sheet, rows in sheets.items():
        for r, row in rows.items():
            for col, c in row.items():
                if c['tipo'] == 'e':
                    errors.append(dict(hoja=sheet, celda=f'{col}{r}', error=c['v']))
    # No importar resúmenes, saldos y copias como nuevas transacciones.
    finances = []
    for sheet in ['FACTURACION','RESPALDO FACTURA','REGISTRO CHEQUES','CHEQUES','EGRESOS GENERL','PAGOS MECHITA','GASTO LUBRIC','BANCO']:
        for r, row in sheets.get(sheet, {}).items():
            visible = {c: x['v'] for c,x in row.items() if x['v'] not in (None,'','0')}
            if visible:
                finances.append(dict(hoja=sheet, fila=r, valores=visible))
    sums = lambda rows,k: str(sum((numero(x[k]) or Decimal(0) for x in rows),Decimal(0)).quantize(Decimal('.01')))
    resumen = {'archivo_sha256':hashlib.sha256(path.read_bytes()).hexdigest(), 'hojas':list(sheets), 'viajes':len(trips), 'galones':sums(trips,'galones'), 'transporte':sums(trips,'transporte'), 'km_excel_prorrateado':sums(trips,'km_excel_prorrateado'), 'km_recorridos_propuestos':str(sum((Decimal(t['km_ida_propuesto'] or 0)*2 for t in trips),Decimal(0))), 'placas':sorted(set(t['placa'] for t in trips)), 'choferes':sorted(set(t['chofer'] for t in trips)), 'gasolineras':sorted(set(t['gasolinera'] for t in trips)), 'terminales':sorted(set(t['terminal'] for t in trips)), 'productos':sorted(set(t['producto'] for t in trips)), 'gastos':len(expenses), 'gastos_total':sums(expenses,'monto'), 'gastos_por_tipo':{k:{'cantidad':len(v),'total':sums(v,'monto')} for k,v in ((k,[e for e in expenses if e['tipo']==k]) for k in sorted(set(e['tipo'] for e in expenses)))}, 'incidencias':len(issues), 'errores_excel':errors, 'modo':'SOLO_STAGING_NO_IMPORTADO'}
    used = {(t['terminal'],t['gasolinera']) for t in trips}
    realizados = [t for t in trips if t['estado'] == 'REGISTRADO']
    anulados = [t for t in trips if t['estado'] == 'ANULADO']
    resumen['actividad_realizada'] = {'viajes':len(realizados), 'galones':sums(realizados,'galones'), 'transporte':sums(realizados,'transporte')}
    resumen['actividad_anulada'] = {'viajes':len(anulados), 'galones_documentados_no_entregados':sums(anulados,'galones')}
    capacities = {val(row,'AS'):val(row,'AT') for row in sheets['DATOS'].values() if numero(val(row,'AT')) and numero(val(row,'AT')) > 0}
    plates = sorted(set(resumen['placas']) | {e['placa'] for e in expenses if e['placa'] in capacities})
    vehicles = [dict(placa=plate,capacidad_galones=capacities.get(plate,''),anio='',marca='SIN MARCA',modelo='') for plate in plates]
    drivers = [dict(nombre=name,cedula='',fecha_inicio_trabajo='2026-01-01',importe_diario='34.51',tipo_remuneracion='DIA_TRABAJADO' if name == 'ESPINOZA' else 'DIARIO_FIJO') for name in resumen['choferes']]
    omitidos = [dict(e, motivo_omision='Pago o adelanto de remuneración; excluir para evitar doble costo') for e in expenses if e['tipo'] in {'SUELDO', 'ANTICIPO'}]
    gastos_importables = [dict(e) for e in expenses if e['tipo'] not in {'SUELDO', 'ANTICIPO'}]
    # Regla aprobada: $12 por día explícito y el sobrante como peaje.
    # No deducir duración de un importe repetido ni inventar fechas cubiertas.
    for e in gastos_importables:
        if e['tipo'] != 'VIATICO':
            continue
        texto = e['observacion'].upper()
        match = re.search(r'\b(?:X|POR)\s+(\d+)\s+DIAS\b', texto)
        dias = int(match.group(1)) if match else 2 if 'VIERNES Y SABADO' in texto else None
        if (e['fila'], e['comprobante'], e['responsable'], e['monto']) == (58, '1663', 'PEREZ', '99'):
            dias = 5  # Duración confirmada por el usuario, no indicada en Excel.
        if (e['fila'], e['comprobante'], e['monto']) == (87, '1685', '5'):
            e['viatico_real'] = '5.00'
            e['peaje_real'] = '0.00'
            e['estado'] = 'DESGLOSE_CONFIRMADO'
        importe = numero(e['monto'])
        if dias and importe is not None and importe >= 12 * dias:
            e['viatico_real'] = str(Decimal(12 * dias).quantize(Decimal('.01')))
            e['peaje_real'] = str((importe - 12 * dias).quantize(Decimal('.01')))
            e['estado'] = 'DESGLOSE_APROBADO_PENDIENTE_ASOCIAR_DIAS'
    resumen['pagos_chofer_omitidos'] = {'cantidad':len(omitidos), 'total':sums(omitidos,'monto')}
    resumen['gastos_preparados_sin_pagos_chofer'] = {'cantidad':len(gastos_importables), 'total':sums(gastos_importables,'monto')}
    for t in trips:
        if numero(t['galones']) and numero(capacities.get(t['placa'],'')) and numero(t['galones']) > numero(capacities[t['placa']]):
            issue('TRANS',t['fila'],'excede_capacidad',t['placa'])
        if numero(t['transporte']) == 0 and t['estado'] != 'ANULADO':
            issue('TRANS',t['fila'],'transporte_cero',t['gasolinera'])
    resumen['incidencias'] = len(issues)
    resumen['diferencia_gasto_reporte_mes'] = str((numero(val(sheets['REPORTE MES'][13],'D')) - Decimal(resumen['gastos_total'])).quantize(Decimal('.01')))
    peajes_path = salida / 'peajes_bd.json'
    if peajes_path.exists():
        peajes = json.loads(peajes_path.read_text(encoding='utf-8'))
        resumen['peajes_bd'] = {'configuraciones':len(peajes), 'provisionales':sum('provisional' in (p.get('observacion') or '').lower() for p in peajes)}
    resumen['desglose_viaticos'] = 'PENDIENTE: peajes reales con vigencia y asociación de desembolsos a recorridos/días; no usar ceros provisionales.'
    route_rows = []
    peajes_propuestos = []
    combinado_cols = {'LA TRONCAL':'J','PASCUALES':'P','SANTO DOMINGO':'V','LA LIBERTAD':'AB','TRONCAL - P INCA':'AH','MANTA':'AN'}
    for terminal, station in sorted(used):
        if (terminal,station) not in routes:
            continue
        km,r = routes[(terminal,station)]
        combinado = numero(val(sheets['DATOS'].get(r,{}),combinado_cols[terminal]))
        peaje = combinado - Decimal('12') if combinado is not None and combinado >= 12 else Decimal(0) if combinado in (None, Decimal(0)) else None
        peajes_propuestos.append(dict(terminal=terminal,gasolinera=station,fila_datos=r,total_combinado=str(combinado) if combinado is not None else '',viatico='12.00',peaje_ida=str(peaje/2) if peaje is not None else '',peaje_vuelta=str(peaje/2) if peaje is not None else '',estado='PROPUESTO' if peaje is not None else 'PENDIENTE_TOTAL_MENOR_12_O_AUSENTE'))
        for origin,dest in [(terminal,station),(station,terminal)]:
            route_rows.append(dict(origen=origin,destino=dest,km=str(km/2),fila_datos=r))
    resumen['peajes_propuestos'] = sum(p['estado']=='PROPUESTO' for p in peajes_propuestos)
    resumen['peajes_pendientes'] = len(peajes_propuestos)-resumen['peajes_propuestos']
    resumen['desglose_viaticos'] = 'Configuración: total combinado menos 12 por recorrido; resultado dividido entre ida/vuelta. Desembolsos de varios días aún requieren asociación.'
    for name, data in [('viajes',trips),('trayectos',route_rows),('peajes_propuestos',peajes_propuestos),('gastos',gastos_importables),('gastos_origen',expenses),('pagos_chofer_omitidos',omitidos),('incidencias',issues),('vehiculos',vehicles),('choferes',drivers)]:
        guardar_csv(salida / (name+'.csv'),data)
    correcciones = [
        dict(hoja='CHEQUES', celda='I5', original='15/01/2025', corregido='2026-01-15', motivo='Año corregido por confirmación del usuario'),
        dict(hoja='CHEQUES', celda='M7', original='05/01/2026', corregido='2026-02-05', motivo='Segunda cuota TEDASA corresponde a febrero; confirmado por usuario'),
        dict(hoja='GASTO MECHITA', celda='H58', original='VIAJE A PETRILLO', corregido='5 días; viático 60.00; peaje 39.00', motivo='Duración y reparto confirmados por usuario'),
        dict(hoja='GASTO MECHITA', celda='G87', original='5', corregido='Viático 5.00; peaje 0.00', motivo='Conservar desembolso real confirmado'),
    ]
    pagos_confirmados = []
    for fila, fecha_col, importe_col, cheque_col, cuota in [(5,'I','K','J','1D2'),(7,'I','K','J','1D2'),(7,'M','O','N','2D2')]:
        row = sheets['CHEQUES'][fila]
        fecha_original = fecha(val(row, fecha_col))
        fecha_pago = '2026-01-15' if fila == 5 else '2026-02-05' if fecha_col == 'M' else fecha_original
        pagos_confirmados.append(dict(hoja='CHEQUES',fila=fila,proveedor=val(row,'C'),factura=val(row,'D'),cheque=val(row,cheque_col),cuota=cuota,monto=val(row,importe_col),fecha_original=fecha_original,fecha_pago=fecha_pago,pagado=True,incluir_enero=fecha_pago.startswith('2026-01'),estado_importacion='PENDIENTE_VINCULAR_FACTURA'))
    guardar_csv(salida/'pagos_corregidos.csv',pagos_confirmados)
    for name,data in [('resumen',resumen),('finanzas_revision',finances),('correcciones_confirmadas',correcciones)]:
        (salida/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(resumen,ensure_ascii=True,indent=2))

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('archivo',type=Path)
    p.add_argument('--salida',type=Path,required=True)
    a=p.parse_args()
    auditar(a.archivo,a.salida)
