import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../trayectos.fields.js';

export function initial(registro) {
    return { ...registro,
        tipo_origen: registro.id_gasolinera_origen ? 'GASOLINERA' : 'TERMINAL',
        tipo_destino: registro.id_gasolinera_destino ? 'GASOLINERA' : 'TERMINAL'
    };
}

export function prepare(values) {
    const data = prepararCampos(fields.filter((field) => !field.name.startsWith('tipo_')), values);
    for (const extremo of ['origen', 'destino']) {
        if (!['TERMINAL', 'GASOLINERA'].includes(values[`tipo_${extremo}`])) throw new Error('Selecciona el tipo de origen y destino.');
        const tipo = values[`tipo_${extremo}`].toLowerCase();
        const campo = `id_${tipo}_${extremo}`;
        if (!data[campo]) throw new Error(`Selecciona el ${extremo} del trayecto.`);
        data[`id_${tipo === 'terminal' ? 'gasolinera' : 'terminal'}_${extremo}`] = null;
    }
    if (data.id_terminal_origen === data.id_terminal_destino && data.id_gasolinera_origen === data.id_gasolinera_destino) {
        throw new Error('Origen y destino deben ser distintos.');
    }
    return data;
}
