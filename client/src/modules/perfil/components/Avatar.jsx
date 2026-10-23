import { useState } from 'react';

export function Avatar({ nombre = '', url }) {
    const [failedUrl, setFailedUrl] = useState(null);
    const initials = nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => [...part][0]).join('').toUpperCase();
    return <span className="profile-avatar" aria-hidden="true">
        {url && /^https?:\/\//i.test(url) && failedUrl !== url
            ? <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailedUrl(url)} />
            : <span>{initials || '?'}</span>}
    </span>;
}
