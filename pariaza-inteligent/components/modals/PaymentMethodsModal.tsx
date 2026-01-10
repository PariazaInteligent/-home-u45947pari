import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, CreditCard, Banknote, Wallet, Building, Loader2 } from 'lucide-react';
import { Button3D } from '../ui/Button3D';
import { getApiUrl } from '../../config';

interface PaymentMethod {
    id: string;
    type: 'IBAN' | 'REVOLUT' | 'PAYPAL' | 'WISE';
    label?: string;
    holderName: string;
    detailsMasked: string;
    currency: string;
    isDefault: boolean;
}

interface PaymentMethodsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Trigger profile refresh
    initialView?: 'LIST' | 'ADD';
}

export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({ isOpen, onClose, onUpdate, initialView = 'LIST' }) => {
    const [view, setView] = useState<'LIST' | 'ADD'>(initialView);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form State
    const [type, setType] = useState<'IBAN' | 'REVOLUT' | 'PAYPAL' | 'WISE'>('IBAN');
    const [holderName, setHolderName] = useState('');
    const [details, setDetails] = useState(''); // Clear text input
    const [label, setLabel] = useState('');
    const [currency, setCurrency] = useState('EUR');

    useEffect(() => {
        if (isOpen) {
            fetchMethods();
            setView(initialView);
            resetForm();
        }
    }, [isOpen, initialView]);

    const resetForm = () => {
        setHolderName('');
        setDetails('');
        setLabel('');
        setCurrency('EUR');
        setType('IBAN');
        setError(null);
        setSuccessMsg(null);
    };

    const fetchMethods = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(getApiUrl('/api/payment-methods'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
                // If no methods and in LIST view, switch to ADD?
                if (data.length === 0 && view === 'LIST') setView('ADD');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(getApiUrl('/api/payment-methods'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    holderName,
                    details,
                    label: label || undefined,
                    currency,
                    country: 'RO' // Optional, hardcoded for now or add field
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add method');
            }

            // Success
            await fetchMethods();
            onUpdate();
            setView('LIST');
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // No blocking confirm - intentional action via UI
        setDeletingId(id);
        setError(null);
        setSuccessMsg(null);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(getApiUrl(`/api/payment-methods/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Ștergerea a eșuat');
            }

            // Success feedback
            setSuccessMsg('Metoda a fost ștearsă cu succes.');

            // Refresh list
            await fetchMethods();
            onUpdate();

            // Clear success message after 3s
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Eroare la ștergere');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(getApiUrl(`/api/payment-methods/${id}/default`), {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchMethods();
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 p-4 border-b-2 border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-700 text-lg flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-500" />
                        {view === 'LIST' ? 'Metodele Tale' : 'Adaugă Metodă'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold border-l-4 border-red-500 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm font-bold border-l-4 border-green-500 animate-in fade-in slide-in-from-top-2">
                            {successMsg}
                        </div>
                    )}

                    {view === 'LIST' ? (
                        <div className="space-y-4">
                            {methods.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <p className="mb-4">Nu ai nicio metodă de plată salvată.</p>
                                    <Button3D onClick={() => setView('ADD')} size="sm">Adaugă Prima Metodă</Button3D>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {methods.map(m => (
                                        <div key={m.id} className={`p-4 rounded-xl border-2 flex items-center justify-between ${m.isDefault ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.isDefault ? 'bg-green-100' : 'bg-slate-100'}`}>
                                                    {m.type === 'IBAN' && <Building className={`w-5 h-5 ${m.isDefault ? 'text-green-600' : 'text-slate-500'}`} />}
                                                    {m.type === 'REVOLUT' && <span className="text-lg">R</span>}
                                                    {m.type === 'PAYPAL' && <span className="text-lg">P</span>}
                                                    {m.type === 'WISE' && <span className="text-lg">W</span>}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700">{m.label || m.type}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{m.detailsMasked}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!m.isDefault && (
                                                    <button onClick={() => handleSetDefault(m.id)} className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Set Default">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    disabled={deletingId === m.id || isLoading}
                                                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button3D variant="outline" className="w-full mt-4" onClick={() => setView('ADD')}>
                                        <Plus className="w-4 h-4 mr-2" /> Adaugă Altă Metodă
                                    </Button3D>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tip Metodă</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['IBAN', 'REVOLUT', 'PAYPAL', 'WISE'] as const).map(t => (
                                        <div
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`cursor-pointer p-3 rounded-xl border-2 font-bold text-center transition-all ${type === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nume Titular (Holder)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-bold text-slate-700"
                                    placeholder="ex: Ion Popescu"
                                    value={holderName}
                                    onChange={e => setHolderName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    {type === 'IBAN' ? 'IBAN' : type === 'REVOLUT' ? 'Revolut Tag / Nr. Telefon' : type === 'PAYPAL' ? 'Email PayPal' : 'Email / Detalii Wise'}
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-bold text-slate-700 font-mono"
                                    placeholder={type === 'IBAN' ? 'RO00 BTRL...' : type === 'REVOLUT' ? '@username' : 'email@example.com'}
                                    value={details}
                                    onChange={e => setDetails(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Etichetă (Opțional)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-bold text-slate-700"
                                    placeholder="ex: Cont Salariu"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button3D type="button" variant="outline" onClick={() => setView('LIST')} className="flex-1">Înapoi</Button3D>
                                <Button3D type="submit" variant="cyan" className="flex-1 text-white" disabled={isLoading}>
                                    {isLoading ? 'Se procesează...' : 'Salvează Metodă'}
                                </Button3D>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
