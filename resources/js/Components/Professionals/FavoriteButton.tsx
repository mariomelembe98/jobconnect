import { router } from '@inertiajs/react';
import { useState } from 'react';

import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import { Button } from '../ui/Button';

export function FavoriteButton({ professionalProfileId }: { professionalProfileId: number }) {
    const currentUser = getStoredAuthUser();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    if (currentUser && currentUser.user_type !== 'client') {
        return null;
    }

    async function toggleFavorite(): Promise<void> {
        if (!getAuthToken() || !currentUser) {
            router.visit('/login');
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            if (isFavorite) {
                await api.delete(`/favorites/${professionalProfileId}`);
                setIsFavorite(false);
                setMessage('Profissional removido dos favoritos.');
            } else {
                await api.post('/favorites', { professional_profile_id: professionalProfileId });
                setIsFavorite(true);
                setMessage('Profissional adicionado aos favoritos.');
            }
        } catch (error) {
            if (error instanceof ApiError && error.status === 409 && error.message.includes('já está')) {
                setIsFavorite(true);
                setMessage('Este profissional já está nos seus favoritos.');
            } else {
                setMessage(error instanceof ApiError ? error.message : 'Não foi possível actualizar os favoritos.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid gap-2">
            <Button variant={isFavorite ? 'secondary' : 'outline'} onClick={toggleFavorite} isLoading={isLoading}>
                <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
                {isFavorite ? 'Remover favorito' : 'Favoritar'}
            </Button>
            {message ? <p className="max-w-52 text-xs leading-5 text-slate-500" role="status">{message}</p> : null}
        </div>
    );
}
