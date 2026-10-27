import { Modal } from '../Modal/Modal.jsx';
import { useRegistroCatalogo } from '../../hooks/useRegistroCatalogo.js';
import { AccionCatalogo } from './AccionCatalogo.jsx';

export function CatalogoModal(props) {
    const { definition, id, action, onClose, embedded } = props;
    const state = useRegistroCatalogo(definition.api, id, action.id);
    if (state.loading || state.error) {
        const content = <>
            {state.loading ? <p role="status">Cargando…</p> : <>
                <p role="alert">{state.error}</p>
                <button type="button" className="btn btn-outline" onClick={state.reintentar}>Reintentar</button>
            </>}
        </>;
        return embedded ? content : <Modal isOpen title={action.label} onClose={onClose}>{content}</Modal>;
    }
    return <AccionCatalogo {...props} {...state} />;
}
