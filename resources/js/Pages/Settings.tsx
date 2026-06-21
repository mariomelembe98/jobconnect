import { Head, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminLayout } from '../Layouts/AdminLayout';
import { ClientLayout } from '../Layouts/ClientLayout';
import { ProfessionalLayout } from '../Layouts/ProfessionalLayout';
import { Button } from '../Components/ui/Button';
import { Card, CardContent, CardHeader } from '../Components/ui/Card';
import { EmptyState } from '../Components/ui/EmptyState';
import { Input } from '../Components/ui/Input';
import { LoadingSkeleton } from '../Components/ui/LoadingSkeleton';
import { Select } from '../Components/ui/Select';
import { Textarea } from '../Components/ui/Textarea';
import { api, ApiError } from '../lib/api';
import { clearAuthSession, getStoredAuthUser } from '../lib/auth';
import type { AppPageProps, User, UserType } from '../types';
import { router } from '@inertiajs/react';

interface SettingsResponse {
    user: User;
}

interface ProvincesResponse {
    provinces: string[];
}

interface CitiesResponse {
    cities: string[];
}

interface ProfileFormState {
    name: string;
    email: string;
    phone: string;
}

interface LocationFormState {
    province: string;
    city: string;
    address: string;
}

interface PasswordFormState {
    current_password: string;
    password: string;
    password_confirmation: string;
}

const emptyProfile: ProfileFormState = {
    name: '',
    email: '',
    phone: '',
};

const emptyLocation: LocationFormState = {
    province: '',
    city: '',
    address: '',
};

const emptyPassword: PasswordFormState = {
    current_password: '',
    password: '',
    password_confirmation: '',
};

type SectionName = 'profile' | 'location' | 'security' | null;

export default function SettingsPage() {
    const { auth } = usePage<AppPageProps>().props;
    const currentUser = auth.user ?? getStoredAuthUser();

    const [user, setUser] = useState<User | null>(null);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [profile, setProfile] = useState<ProfileFormState>({ ...emptyProfile });
    const [location, setLocation] = useState<LocationFormState>({ ...emptyLocation });
    const [password, setPassword] = useState<PasswordFormState>({ ...emptyPassword });
    const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
    const [locationErrors, setLocationErrors] = useState<Record<string, string[]>>({});
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
    const [loadError, setLoadError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [statusKind, setStatusKind] = useState<'success' | 'error' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const layout = useMemo(() => chooseLayout(currentUser?.user_type), [currentUser?.user_type]);

    const loadSettings = useCallback(async (signal: AbortSignal) => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const [profileData, provincesData] = await Promise.all([
                api.get<SettingsResponse>('/users/me', { signal }),
                api.get<ProvincesResponse>('/locations/provinces', { signal }),
            ]);

            if (signal.aborted) {
                return;
            }

            setUser(profileData.user);
            setProfile({
                name: profileData.user.name ?? '',
                email: profileData.user.email ?? '',
                phone: profileData.user.phone ?? '',
            });
            setLocation({
                province: profileData.user.province ?? '',
                city: profileData.user.city ?? '',
                address: profileData.user.address ?? '',
            });
            setProvinces(provincesData.provinces);
        } catch (error) {
            if (!signal.aborted) {
                setLoadError(error instanceof ApiError ? error.message : 'Não foi possível carregar as definições da conta.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadSettings(controller.signal);

        return () => controller.abort();
    }, [loadSettings, reloadKey]);

    useEffect(() => {
        if (!location.province) {
            setCities([]);
            return;
        }

        const controller = new AbortController();
        setIsLoadingCities(true);

        void (async () => {
            try {
                const data = await api.get<CitiesResponse>('/locations/cities', {
                    signal: controller.signal,
                    query: { province: location.province },
                });

                if (!controller.signal.aborted) {
                    setCities(data.cities);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setCities([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingCities(false);
                }
            }
        })();

        return () => controller.abort();
    }, [location.province]);

    async function saveProfile(): Promise<void> {
        setIsSavingProfile(true);
        setProfileErrors({});
        setStatusMessage(null);

        try {
            await api.patch<SettingsResponse>('/users/me', profile);
            setStatusKind('success');
            setStatusMessage('Perfil actualizado com sucesso.');
            setReloadKey((value) => value + 1);
        } catch (error) {
            if (error instanceof ApiError) {
                setProfileErrors(error.errors);
                setStatusKind('error');
                setStatusMessage(error.message);
            } else {
                setStatusKind('error');
                setStatusMessage('Não foi possível actualizar o perfil.');
            }
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function saveLocation(): Promise<void> {
        setIsSavingLocation(true);
        setLocationErrors({});
        setStatusMessage(null);

        try {
            await api.patch<SettingsResponse>('/users/me/location', {
                province: location.province || null,
                city: location.city || null,
                address: location.address || null,
            });
            setStatusKind('success');
            setStatusMessage('Localização actualizada com sucesso.');
            setReloadKey((value) => value + 1);
        } catch (error) {
            if (error instanceof ApiError) {
                setLocationErrors(error.errors);
                setStatusKind('error');
                setStatusMessage(error.message);
            } else {
                setStatusKind('error');
                setStatusMessage('Não foi possível actualizar a localização.');
            }
        } finally {
            setIsSavingLocation(false);
        }
    }

    async function savePassword(): Promise<void> {
        setIsSavingPassword(true);
        setPasswordErrors({});
        setStatusMessage(null);

        try {
            await api.patch('/users/me/password', password);
            setPassword({ ...emptyPassword });
            setStatusKind('success');
            setStatusMessage('Palavra-passe alterada com sucesso.');
        } catch (error) {
            if (error instanceof ApiError) {
                setPasswordErrors(error.errors);
                setStatusKind('error');
                setStatusMessage(error.message);
            } else {
                setStatusKind('error');
                setStatusMessage('Não foi possível alterar a palavra-passe.');
            }
        } finally {
            setIsSavingPassword(false);
        }
    }

    async function logout(): Promise<void> {
        setIsLoggingOut(true);

        try {
            await api.post('/auth/logout');
        } catch {
            // limpar sempre a sessão local
        } finally {
            clearAuthSession();
            router.visit('/login', {
                replace: true,
                preserveScroll: true,
            });
        }
    }

    function retryLoad(): void {
        setReloadKey((value) => value + 1);
    }

    function updateProfileField<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]): void {
        setProfile((current) => ({ ...current, [key]: value }));
    }

    function updateLocationField<K extends keyof LocationFormState>(key: K, value: LocationFormState[K]): void {
        setLocation((current) => {
            const next = { ...current, [key]: value };

            if (key === 'province') {
                next.city = '';
            }

            return next;
        });
    }

    function updatePasswordField<K extends keyof PasswordFormState>(key: K, value: PasswordFormState[K]): void {
        setPassword((current) => ({ ...current, [key]: value }));
    }

    const content = (
        <>
            <Head title="Definições da conta" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-blue-100">Conta e segurança</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Definições da conta</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                            Actualize o seu perfil pessoal, localização e palavra-passe num único local.
                        </p>
                    </div>
                    <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={logout} isLoading={isLoggingOut}>
                        Terminar sessão
                    </Button>
                </div>
            </section>

            {statusMessage ? (
                <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${statusKind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`} role="status">
                    {statusMessage}
                </div>
            ) : null}

            {loadError ? (
                <div className="mb-6">
                    <EmptyState title="Não foi possível carregar as definições" description={loadError} action={<Button onClick={retryLoad}>Tentar novamente</Button>} />
                </div>
            ) : null}

            {!loadError ? (
                <div className="grid gap-6 xl:grid-cols-2">
                    <SectionCard title="Perfil pessoal" description="Nome, email e contacto principal.">
                        {isLoading ? (
                            <SectionSkeleton />
                        ) : (
                            <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void saveProfile(); }}>
                                <Input label="Nome" value={profile.name} onChange={(event) => updateProfileField('name', event.target.value)} error={firstError(profileErrors.name)} />
                                <Input label="Email" type="email" value={profile.email} onChange={(event) => updateProfileField('email', event.target.value)} error={firstError(profileErrors.email)} />
                                <Input label="Telefone" value={profile.phone} onChange={(event) => updateProfileField('phone', event.target.value)} error={firstError(profileErrors.phone)} />
                                <div className="flex justify-end">
                                    <Button type="submit" isLoading={isSavingProfile}>Guardar perfil</Button>
                                </div>
                            </form>
                        )}
                    </SectionCard>

                    <SectionCard title="Localização" description="Informação de província, cidade e morada.">
                        {isLoading ? (
                            <SectionSkeleton />
                        ) : (
                            <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void saveLocation(); }}>
                                <Select
                                    label="Província"
                                    value={location.province}
                                    placeholder="Seleccionar província"
                                    options={provinces.map((province) => ({ label: province, value: province }))}
                                    onChange={(event) => updateLocationField('province', event.target.value)}
                                    error={firstError(locationErrors.province)}
                                />
                                <Select
                                    label="Cidade"
                                    value={location.city}
                                    placeholder={isLoadingCities ? 'A carregar cidades...' : 'Seleccionar cidade'}
                                    options={cities.map((city) => ({ label: city, value: city }))}
                                    onChange={(event) => updateLocationField('city', event.target.value)}
                                    error={firstError(locationErrors.city)}
                                    disabled={isLoadingCities && !location.province}
                                />
                                <Textarea label="Morada" value={location.address} onChange={(event) => updateLocationField('address', event.target.value)} error={firstError(locationErrors.address)} />
                                <div className="flex justify-end">
                                    <Button type="submit" isLoading={isSavingLocation}>Guardar localização</Button>
                                </div>
                            </form>
                        )}
                    </SectionCard>

                    <SectionCard title="Segurança" description="Atualize a palavra-passe da sua conta.">
                        {isLoading ? (
                            <SectionSkeleton />
                        ) : (
                            <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void savePassword(); }}>
                                <Input
                                    label="Palavra-passe actual"
                                    type="password"
                                    value={password.current_password}
                                    onChange={(event) => updatePasswordField('current_password', event.target.value)}
                                    error={firstError(passwordErrors.current_password)}
                                />
                                <Input
                                    label="Nova palavra-passe"
                                    type="password"
                                    value={password.password}
                                    onChange={(event) => updatePasswordField('password', event.target.value)}
                                    error={firstError(passwordErrors.password)}
                                />
                                <Input
                                    label="Confirmar palavra-passe"
                                    type="password"
                                    value={password.password_confirmation}
                                    onChange={(event) => updatePasswordField('password_confirmation', event.target.value)}
                                    error={firstError(passwordErrors.password_confirmation)}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" isLoading={isSavingPassword}>Alterar palavra-passe</Button>
                                </div>
                            </form>
                        )}
                    </SectionCard>

                    <SectionCard title="Sessão" description="Termine a sessão neste dispositivo.">
                        <div className="grid gap-4">
                            <p className="text-sm leading-6 text-slate-500">
                                Se estiver num dispositivo partilhado, termine a sessão quando concluir o seu trabalho.
                            </p>
                            <div className="flex justify-end">
                                <Button variant="danger" onClick={logout} isLoading={isLoggingOut}>Terminar sessão</Button>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            ) : null}
        </>
    );

    return <SettingsShell userType={currentUser?.user_type ?? user?.user_type ?? 'client'}>{content}</SettingsShell>;
}

function SettingsShell({ userType, children }: { userType: UserType; children: React.ReactNode }) {
    if (userType === 'professional') {
        return <ProfessionalLayout title="Definições" description="Gerir perfil, localização e segurança.">{children}</ProfessionalLayout>;
    }

    if (userType === 'admin' || userType === 'super_admin') {
        return <AdminLayout title="Definições" description="Gerir perfil, localização e segurança.">{children}</AdminLayout>;
    }

    return <ClientLayout title="Definições" description="Gerir perfil, localização e segurança.">{children}</ClientLayout>;
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <div>
                    <h2 className="text-xl font-bold text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function SectionSkeleton() {
    return (
        <div className="grid gap-4" aria-busy="true">
            <LoadingSkeleton className="h-11 w-full rounded-xl" />
            <LoadingSkeleton className="h-11 w-full rounded-xl" />
            <LoadingSkeleton className="h-11 w-full rounded-xl" />
            <LoadingSkeleton className="h-11 w-32 rounded-xl" />
        </div>
    );
}

function firstError(errors?: string[]): string | undefined {
    return errors?.[0];
}

function chooseLayout(userType?: UserType | null): UserType {
    return userType ?? 'client';
}
