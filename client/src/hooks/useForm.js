import { useRef, useState } from 'react';

// El componente se monta con sus valores iniciales; la identidad del registro cambia su key.
export function useForm({ initialValues, prepare = (values) => values, onSubmit, onSuccess }) {
    const [values, setValues] = useState(initialValues);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [failure, setFailure] = useState(null);
    const busy = useRef(false);
    const change = (event) => {
        const { name, type, checked, value, multiple, selectedOptions } = event.target;
        setValues((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : multiple ? Array.from(selectedOptions, option => option.value) : value }));
        if (failure?.field === name) { setError(''); setFailure(null); }
    };
    const submit = async (event) => {
        event.preventDefault();
        if (busy.current) return;
        busy.current = true;
        setSaving(true);
        setError('');
        setFailure(null);
        try {
            const result = await onSubmit(prepare(values));
            onSuccess?.(result);
        } catch (failure) {
            setError(failure.message);
            setFailure(failure);
        } finally {
            busy.current = false;
            setSaving(false);
        }
    };
    const closeWhenIdle = (onClose) => { if (!busy.current) onClose(); };
    const clearError = () => { setError(''); setFailure(null); };
    return { values, change, saving, error, failure, clearError, submit, closeWhenIdle };
}
