import React, { useState, useRef } from 'react';
import { Upload, X, User2, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button3D } from '../ui/Button3D';

interface AvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvatarUrl: string;
    userGender: 'male' | 'female' | 'other';
    avatarType: 'DEFAULT' | 'CUSTOM';
    onUploadSuccess: () => void; // No params, just trigger refetch
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
    isOpen,
    onClose,
    currentAvatarUrl,
    userGender,
    avatarType,
    onUploadSuccess,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // DEBUG: Log props
    console.log('[AvatarUploadModal] props avatarType->', avatarType);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            setError('Tip fișier invalid. Folosește JPG, PNG sau WebP.');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Fișierul este prea mare. Maxim 5MB.');
            return;
        }

        setSelectedFile(file);
        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('avatar', selectedFile);

            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/api/users/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setSuccess(true);
            setTimeout(() => {
                onUploadSuccess(); // Refetch user data
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Eroare la încărcare');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUseDefault = async () => {
        setIsUploading(true);
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/api/users/avatar', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset avatar');
            }

            setSuccess(true);
            setTimeout(() => {
                onUploadSuccess(); // Refetch user data
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Eroare la ștergere');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#1CB0F6] to-[#1899D6] p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Camera className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Schimbă Avatar</h2>
                            <p className="text-sm opacity-90">Încarcă o fotografie nouă</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Current & Preview */}
                    <div className="flex items-center justify-center gap-6">
                        {/* Current Avatar */}
                        <div className="text-center">
                            <p className="text-xs font-bold text-[#AFAFAF] uppercase mb-2">Actual</p>
                            <div className="w-24 h-24 rounded-full border-4 border-[#E5E5E5] overflow-hidden">
                                <img src={currentAvatarUrl} alt="Current" className="w-full h-full object-cover object-center rounded-full" />
                            </div>
                        </div>

                        {/* Arrow */}
                        {previewUrl && (
                            <div className="text-[#1CB0F6] font-black text-2xl">→</div>
                        )}

                        {/* Preview */}
                        {previewUrl && (
                            <div className="text-center">
                                <p className="text-xs font-bold text-[#1CB0F6] uppercase mb-2">Preview</p>
                                <div className="w-24 h-24 rounded-full border-4 border-[#1CB0F6] overflow-hidden">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover object-center rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#E5E5E5] rounded-2xl p-8 text-center cursor-pointer hover:border-[#1CB0F6] hover:bg-[#E0F6FF] transition-all"
                    >
                        <Upload className="w-12 h-12 text-[#AFAFAF] mx-auto mb-3" />
                        <p className="font-bold text-[#4B4B4B] mb-1">Click pentru a încărca</p>
                        <p className="text-xs text-[#AFAFAF]">JPG, PNG sau WebP • Max 5MB</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-center gap-3 animate-bounce">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-green-700">Avatar actualizat!</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button3D
                            variant="cyan"
                            className="w-full"
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading || success}
                        >
                            {isUploading ? 'ÎNCĂRCARE...' : 'ÎNCARCĂ FOTOGRAFIE'}
                        </Button3D>

                        {/* Reset button - show only when CUSTOM */}
                        {avatarType === 'CUSTOM' && (
                            <Button3D
                                variant="secondary"
                                className="w-full"
                                onClick={handleUseDefault}
                                disabled={isUploading || success}
                            >
                                <User2 className="w-4 h-4 mr-2" />
                                RESETEAZĂ LA AVATAR IMPLICIT
                            </Button3D>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-sm font-bold text-[#AFAFAF] hover:text-[#4B4B4B] transition-colors"
                        >
                            Anulează
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
