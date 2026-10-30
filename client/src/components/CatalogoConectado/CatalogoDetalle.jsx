import { useId } from 'react';
import { FileText, UserRound, AlignLeft } from 'lucide-react';
import { FotoMiniatura } from '../FotoMiniatura/FotoMiniatura.jsx';

const contacto = new Set(['telefono', 'celular', 'correo', 'email', 'direccion', 'representante_legal', 'contacto']);
const notas = new Set(['descripcion', 'observacion', 'observaciones', 'notas', 'motivo']);

function mostrarValor(campo, registro, catalogos) {
    const value = registro[campo.key];
    if (value === null || value === undefined || value === '') return <span className="detalle-sin-dato">Sin registrar</span>;
    if (typeof value === 'boolean') {
        return ['estado', 'activo'].includes(campo.key)
            ? <span className={`detalle-estado ${value ? 'detalle-estado--activo' : 'detalle-estado--inactivo'}`}>{value ? 'Activo' : 'Inactivo'}</span>
            : value ? 'Sí' : 'No';
    }
    const options = campo.source ? catalogos[campo.source] : campo.options;
    return options?.find(option => String(option.value) === String(value))?.label ?? String(value);
}

export function CatalogoDetalle({ columns = [], fields = [], registro, rowKey, catalogos = {} }) {
    const id = useId();
    const campos = [
        ...columns.filter(column => column.key !== 'actions').map(column => ({ ...fields.find(field => field.name === column.key), ...column })),
        ...fields.filter(field => !['rows', 'group'].includes(field.type) && !field.multiple && !columns.some(column => column.key === field.name))
            .map(field => ({ ...field, key: field.name }))
    ];
    const titulo = rowKey && campos.find(campo => ['nombre', 'placa', 'numero_factura', 'codigo'].includes(campo.key) && registro[campo.key]);
    const identificador = rowKey && campos.find(campo => campo.key === rowKey);
    const estado = rowKey && campos.find(campo => ['estado', 'activo'].includes(campo.key));
    const foto = campos.find(campo => campo.key === 'imagen_url');
    const datos = campos.filter(campo => !rowKey || ![titulo?.key, identificador?.key, estado?.key, foto?.key].includes(campo.key));
    const grupos = [
        { nombre: 'Información general', Icon: FileText, campos: datos.filter(campo => !contacto.has(campo.key) && !notas.has(campo.key)) },
        { nombre: 'Contacto y ubicación', Icon: UserRound, campos: datos.filter(campo => contacto.has(campo.key)) },
        { nombre: 'Información adicional', Icon: AlignLeft, campos: datos.filter(campo => notas.has(campo.key)) }
    ].filter(grupo => grupo.campos.length);
    return <div className="catalogo-detalle">
        {rowKey && <header className="catalogo-detalle__cabecera">
            <div className="catalogo-detalle__imagen">
                {foto ? <FotoMiniatura url={registro.imagen_url} nombre={titulo ? registro[titulo.key] : undefined} rostro={foto.rostro} />
                    : <FileText size={30} strokeWidth={1.5} aria-hidden="true" />}
            </div>
            <div className="catalogo-detalle__identidad">
                <p className="catalogo-detalle__etiqueta">{titulo?.label ?? 'Registro'}</p>
                <h3>{titulo ? registro[titulo.key] : 'Información del registro'}</h3>
                <div className="catalogo-detalle__meta">
                    {identificador && <span className="catalogo-detalle__codigo">{identificador.label}: {registro[rowKey]}</span>}
                    {estado && mostrarValor(estado, registro, catalogos)}
                </div>
            </div>
        </header>}
        {grupos.map(({ nombre, Icon, campos: items }, index) => <section className="catalogo-detalle__seccion" key={nombre} aria-labelledby={`${id}-${index}`}>
            <h4 id={`${id}-${index}`}><Icon size={17} aria-hidden="true" />{nombre}</h4>
            <dl className="catalogo-detalle__campos">{items.map(campo => <div key={campo.key}
                className={`catalogo-detalle__campo${notas.has(campo.key) || campo.key === 'direccion' || campo.type === 'textarea' ? ' catalogo-detalle__campo--amplio' : ''}`}>
                <dt>{campo.key === 'imagen_url' ? 'Foto' : campo.label}</dt>
                <dd>{campo.key === 'imagen_url' ? <FotoMiniatura url={registro[campo.key]} nombre={registro.nombre ?? registro.placa} /> : mostrarValor(campo, registro, catalogos)}</dd>
            </div>)}</dl>
        </section>)}
    </div>;
}
