import { Info, AlertCircle } from 'lucide-react';

export function FormNotice({ children, variant = 'info' }) {
    const error = variant === 'error';
    const Icon = error ? AlertCircle : Info;
    return <div className={`form-notice${error ? ' form-notice-error' : ''}`} role={error ? 'alert' : 'status'}>
        <Icon size={18} aria-hidden="true" />
        <span>{children}</span>
    </div>;
}
