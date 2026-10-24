import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { usePerfil } from './hooks/usePerfil.js';
import { PerfilFicha } from './components/PerfilFicha.jsx';
import { fields } from './perfil.fields.js';
import { prepararPerfil } from './domain/perfil.js';
import { consultarPerfil } from './services/perfil.api.js';

const definition = {
    mode: 'single', rowKey: 'id_usuario', Card: PerfilFicha,
    page: { title: 'Mi perfil', subtitle: 'Tus datos personales y tu foto de perfil', actionLabel: 'Editar perfil' },
    fields, prepare: prepararPerfil,
    api: { consultar: (_id, signal) => consultarPerfil(signal) },
    canEdit: (usuario) => !usuario.requiere_cambio_password,
    formMessage: 'Usa una dirección HTTP o HTTPS de tu foto. Deja el campo vacío para quitarla.'
};

export function PerfilPage() {
    const { usuario, loading, error, recargar, guardar } = usePerfil();
    const controller = { registro: usuario, loading, error, recargar, guardar: (_id, data) => guardar(data) };
    return <CatalogoConectado definition={definition} controller={controller} />;
}
