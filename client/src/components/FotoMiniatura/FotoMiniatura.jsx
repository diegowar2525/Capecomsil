import { useState } from 'react';
import { ImageIcon, UserRound } from 'lucide-react';

export function FotoMiniatura({ url, nombre, rostro = false }) {
    const [fallida, setFallida] = useState(null);
    const disponible = /^https?:\/\//i.test(url ?? '') && fallida !== url;
    const Icon = rostro ? UserRound : ImageIcon;
    return <span className={`foto-miniatura${rostro ? ' foto-miniatura--rostro' : ''}`}>
        {disponible ? <img src={url} alt={`Foto de ${nombre || 'registro'}`} width={48} height={48}
            loading="lazy" decoding="async" onError={() => setFallida(url)} />
            : <span className="foto-miniatura__vacia" role="img" aria-label="Sin foto" title="Sin foto">
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
            </span>}
    </span>;
}
