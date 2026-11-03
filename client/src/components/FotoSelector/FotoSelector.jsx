import { useEffect, useId, useRef, useState } from 'react';
import { errorFoto } from '../../domain/foto.js';
import { Camera, UserRound, ImagePlus } from 'lucide-react';

export function FotoSelector({ actual, value, onChange, disabled = false, variant = 'default' }) {
    const id = useId();
    const input = useRef(null);
    const [preview, setPreview] = useState(null);
    const urls = useRef(new Set());
    const error = errorFoto(value.archivo);
    useEffect(() => {
        const activeUrls = urls.current;
        return () => { activeUrls.forEach(url => URL.revokeObjectURL(url)); };
    }, []);
    const cambiar = next => {
        urls.current.forEach(url => URL.revokeObjectURL(url));
        urls.current.clear();
        if (next.archivo && !errorFoto(next.archivo)) {
            const url = URL.createObjectURL(next.archivo);
            urls.current.add(url);
            setPreview({ archivo: next.archivo, url });
        } else setPreview(null);
        onChange(next);
    };
    const url = value.archivo ? (!error && preview?.archivo === value.archivo ? preview.url : null)
        : value.quitar ? null : actual;
    const perfil = variant === 'perfil';
    const rostro = perfil || variant === 'rostro';
    const Placeholder = rostro ? UserRound : ImagePlus;
    return <fieldset className={`foto-selector ${perfil ? 'foto-selector--perfil' : 'foto-selector--catalogo'}${variant === 'rostro' ? ' foto-selector--rostro' : ''}`} disabled={disabled}>
        <legend>Foto (opcional)</legend>
        <button type="button" className={perfil ? 'perfil-foto-cambiar' : 'catalogo-foto-cambiar'} aria-label={perfil ? 'Cambiar foto de perfil' : 'Subir o cambiar foto'} aria-describedby={`${id}-ayuda`} onClick={() => input.current?.click()}>
            {url ? <img src={url} alt={value.archivo ? 'Vista previa de la nueva foto' : 'Foto actual'} /> : <Placeholder size={48} strokeWidth={1.5} aria-hidden="true" />}
            <span className={perfil ? 'perfil-foto-cambiar__icon' : 'catalogo-foto-cambiar__icon'}><Camera size={18} aria-hidden="true" /></span>
        </button>
        <div className={perfil ? undefined : 'foto-selector__contenido'}>
            <label htmlFor={id} className={perfil ? 'perfil-foto-label' : undefined}>{perfil ? 'Foto de perfil' : 'Seleccionar imagen'}</label>
            <input ref={input} id={id} type="file" aria-label="Seleccionar imagen" hidden accept="image/jpeg,image/png,image/webp" aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ''}`}
                aria-invalid={Boolean(error)} onChange={event => {
                    const archivo = event.target.files?.[0];
                    if (archivo) cambiar({ archivo, quitar: false });
                    event.target.value = '';
                }} />
            <p id={`${id}-ayuda`} className="foto-selector__ayuda">Pulsa el recuadro para subir o cambiar la foto. JPEG, PNG o WebP, hasta 3 MB. La foto se actualiza al guardar los cambios.</p>
            {error && <p id={`${id}-error`} className="foto-selector__error" role="alert">{error}</p>}
            {value.archivo && !perfil && <p className="foto-selector__nombre">{value.archivo.name}</p>}
            {value.quitar && <p role="status">La foto se quitará al guardar los cambios.</p>}
            <div className="foto-selector__acciones">
                {(value.archivo || value.quitar) && <button type="button" className="btn btn-outline" onClick={() => cambiar({ archivo: null, quitar: false })}>Deshacer cambio de foto</button>}
                {actual && !value.quitar && <button type="button" className="foto-selector__quitar" onClick={() => cambiar({ archivo: null, quitar: true })}>Quitar foto</button>}
            </div>
        </div>
    </fieldset>;
}
