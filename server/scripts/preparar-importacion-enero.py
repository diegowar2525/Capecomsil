"""Empaqueta la conciliación aprobada para el importador; no accede a PostgreSQL."""
import argparse
import csv
import hashlib
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('conciliar', Path(__file__).with_name('conciliar-enero.py'))
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)

def preparar(archivo, salida):
    c.conciliar(archivo, salida)
    hojas = c.a.leer(archivo)
    datos = {}
    for nombre in ['viajes','vehiculos','choferes','empresas_propuestas','peajes_propuestos','gastos',
                   'cobertura_viaticos','facturas_clientes_revision','pagos_proveedores_revision',
                   'descuentos_choferes','exclusiones_confirmadas']:
        with (salida/(nombre+'.csv')).open(encoding='utf-8-sig') as f:
            datos[nombre] = list(csv.DictReader(f))
    for p in datos['pagos_proveedores_revision']:
        fila = int(''.join(ch for ch in p['origen'].split('!')[1] if ch.isdigit()))
        p['fila'] = fila
        p['fecha_emision'] = c.a.fecha(c.a.val(hojas['CHEQUES'][fila], 'B'))
    for f in datos['facturas_clientes_revision']:
        fila = int(f['origen'].split('!')[1])
        f['forma_pago'] = c.a.val(hojas['FACTURACION'][fila],'M')
        f['banco'] = c.a.val(hojas['FACTURACION'][fila],'N')
    datos['fuente'] = dict(archivo=archivo.name, sha256=hashlib.sha256(archivo.read_bytes()).hexdigest())
    datos['configuracion'] = dict(precio_combustible=c.a.val(hojas['DATOS'][3],'B'),
                                  consumo_galones_km=c.a.val(hojas['DATOS'][3],'C'), remuneracion='34.51')
    (salida/'importacion.json').write_text(json.dumps(datos,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('archivo',type=Path)
    p.add_argument('--salida',type=Path,required=True)
    args=p.parse_args()
    preparar(args.archivo,args.salida)
