import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { AvailabilityStatusCard } from '../../Components/ProfessionalDashboard/AvailabilityStatusCard';
import { VerificationStatusCard } from '../../Components/ProfessionalDashboard/VerificationStatusCard';
import { PortfolioManager, type PortfolioDraft } from '../../Components/ProfessionalProfile/PortfolioManager';
import { ProfessionalAvailabilitySelector } from '../../Components/ProfessionalProfile/ProfessionalAvailabilitySelector';
import { ProfessionalCategorySelector } from '../../Components/ProfessionalProfile/ProfessionalCategorySelector';
import { ProfessionalLocationFields } from '../../Components/ProfessionalProfile/ProfessionalLocationFields';
import { ProfessionalProfileForm, type ProfessionalProfileFormValues } from '../../Components/ProfessionalProfile/ProfessionalProfileForm';
import { ProfessionalSkillSelector } from '../../Components/ProfessionalProfile/ProfessionalSkillSelector';
import { VerificationDocumentsManager, type DocumentDraft } from '../../Components/ProfessionalProfile/VerificationDocumentsManager';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ProfessionalLayout } from '../../Layouts/ProfessionalLayout';
import { api, ApiError } from '../../lib/api';
import { getStoredAuthUser } from '../../lib/auth';
import type { Category, ProfessionalDocument, ProfessionalProfile, ProfessionalVerification, Skill } from '../../types';

const emptyFormValues: ProfessionalProfileFormValues = {
    headline: '',
    bio: '',
    experience_years: '',
    base_price: '',
    price_type: 'fixed',
};

const emptyLocation = {
    province: '',
    city: '',
    address: '',
};

export default function ProfessionalProfilePage() {
    const currentUser = getStoredAuthUser();
    const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
    const [profileValues, setProfileValues] = useState<ProfessionalProfileFormValues>({ ...emptyFormValues });
    const [location, setLocation] = useState({ ...emptyLocation });
    const [availability, setAvailability] = useState<ProfessionalProfile['availability']>('available');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
    const [portfolioDrafts, setPortfolioDrafts] = useState<PortfolioDraft[]>([]);
    const [documentDrafts, setDocumentDrafts] = useState<DocumentDraft[]>([]);
    const [portfolioItems, setPortfolioItems] = useState<ProfessionalProfile['portfolio_items']>([]);
    const [verification, setVerification] = useState<ProfessionalVerification | null>(null);
    const [documents, setDocuments] = useState<ProfessionalDocument[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMissingProfile, setIsMissingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingCategories, setSavingCategories] = useState(false);
    const [savingSkills, setSavingSkills] = useState(false);
    const [savingAvailability, setSavingAvailability] = useState(false);
    const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
    const [uploadingDocuments, setUploadingDocuments] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const loadPage = useCallback(async (signal: AbortSignal) => {
        setIsLoading(true);
        setProfileError(null);
        setLookupError(null);
        setIsMissingProfile(false);

        try {
            const profileResponse = await api.get<{ profile: ProfessionalProfile }>('/professional/profile', { signal });
            const loadedProfile = profileResponse.profile;

            setProfile(loadedProfile);
            setProfileValues(profileToValues(loadedProfile));
            setLocation({
                province: loadedProfile.location?.province ?? '',
                city: loadedProfile.location?.city ?? '',
                address: loadedProfile.location?.address ?? '',
            });
            setAvailability(loadedProfile.availability);
            setSelectedCategoryIds(loadedProfile.categories?.map((category) => category.id) ?? []);
            setSelectedSkillIds(loadedProfile.skills?.map((skill) => skill.id) ?? []);
            setPortfolioItems(loadedProfile.portfolio_items ?? []);

            const [categoriesResult, skillsResult, provincesResult, verificationResult, documentsResult] = await Promise.allSettled([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<{ skills: Skill[] }>('/skills', { signal }),
                api.get<{ provinces: string[] }>('/locations/provinces', { signal }),
                api.get<{ verification: ProfessionalVerification }>('/professional/verification', { signal }),
                api.get<{ documents: ProfessionalDocument[] }>('/professional/documents', { signal }),
            ]);

            if (categoriesResult.status === 'fulfilled') {
                setCategories(categoriesResult.value.categories);
            }
            if (skillsResult.status === 'fulfilled') {
                setSkills(skillsResult.value.skills);
            }
            if (provincesResult.status === 'fulfilled') {
                setProvinces(provincesResult.value.provinces);
            }
            if (verificationResult.status === 'fulfilled') {
                setVerification(verificationResult.value.verification);
            }
            if (documentsResult.status === 'fulfilled') {
                setDocuments(documentsResult.value.documents);
            }

            const lookupFailure = [categoriesResult, skillsResult, provincesResult, verificationResult, documentsResult]
                .filter((result) => result.status === 'rejected')
                .map((result) => (result as PromiseRejectedResult).reason)
                .map((reason) => reason instanceof ApiError ? reason.message : 'Não foi possível carregar uma das secções do perfil.')
                .join(' ');

            if (lookupFailure) {
                setLookupError(lookupFailure);
            }
        } catch (caughtError) {
            if (caughtError instanceof ApiError && caughtError.status === 404) {
                setIsMissingProfile(true);
                return;
            }

            if (!signal.aborted) {
                setProfileError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o perfil profissional.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadPage(controller.signal);

        return () => controller.abort();
    }, [loadPage, reloadKey]);

    useEffect(() => {
        const controller = new AbortController();

        if (!location.province) {
            setCities([]);
            return () => controller.abort();
        }

        async function loadCities(): Promise<void> {
            setIsLoadingCities(true);

            try {
                const data = await api.get<{ cities: string[] }>('/locations/cities', {
                    signal: controller.signal,
                    query: { province: location.province },
                });
                setCities(data.cities);
            } catch (caughtError) {
                if (!controller.signal.aborted) {
                    setLookupError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as cidades.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingCities(false);
                }
            }
        }

        void loadCities();

        return () => controller.abort();
    }, [location.province]);

    function updateProfileValues(values: ProfessionalProfileFormValues): void {
        setProfileValues(values);
        setFieldErrors({});
    }

    function updateLocation(field: 'province' | 'city' | 'address', value: string): void {
        setLocation((current) => {
            if (field === 'province') {
                return { ...current, province: value, city: '' };
            }

            return { ...current, [field]: value };
        });
        setFieldErrors({});
    }

    function toggleCategory(categoryId: number): void {
        setSelectedCategoryIds((current) => {
            if (current.includes(categoryId)) {
                return current.filter((id) => id !== categoryId);
            }

            if (current.length >= 5) {
                return current;
            }

            return [...current, categoryId];
        });
        setFieldErrors({});
    }

    function toggleSkill(skillId: number): void {
        setSelectedSkillIds((current) => (current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId]));
        setFieldErrors({});
    }

    function addPortfolioDraft(): void {
        setPortfolioDrafts((current) => [...current, { title: '', description: '', file: null }]);
    }

    function updatePortfolioDraft(index: number, draft: PortfolioDraft): void {
        setPortfolioDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? draft : item)));
    }

    function removePortfolioDraft(index: number): void {
        setPortfolioDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }

    function addDocumentDraft(): void {
        setDocumentDrafts((current) => [...current, { document_type: 'bi', file: null }]);
    }

    function updateDocumentDraft(index: number, draft: DocumentDraft): void {
        setDocumentDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? draft : item)));
    }

    function removeDocumentDraft(index: number): void {
        setDocumentDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }

    async function saveProfile(): Promise<void> {
        setSavingProfile(true);
        setFieldErrors({});
        setLookupError(null);

        try {
            await api.patch('/professional/profile', {
                headline: profileValues.headline,
                bio: profileValues.bio,
                experience_years: Number(profileValues.experience_years),
                base_price: profileValues.base_price === '' ? null : Number(profileValues.base_price),
                price_type: profileValues.price_type,
                province: location.province,
                city: location.city,
                address: location.address || null,
            });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setFieldErrors(firstValidationMessages(caughtError.errors));
                setLookupError(caughtError.message);
            } else {
                setLookupError('Não foi possível guardar o perfil.');
            }
        } finally {
            setSavingProfile(false);
        }
    }

    async function saveCategories(): Promise<void> {
        setSavingCategories(true);
        setFieldErrors({});

        try {
            await api.post('/professional/categories', { category_ids: selectedCategoryIds });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setFieldErrors(firstValidationMessages(caughtError.errors));
                setLookupError(caughtError.message);
            } else {
                setLookupError('Não foi possível guardar as categorias.');
            }
        } finally {
            setSavingCategories(false);
        }
    }

    async function saveSkills(): Promise<void> {
        setSavingSkills(true);
        setFieldErrors({});

        try {
            await api.post('/professional/skills', { skill_ids: selectedSkillIds });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setFieldErrors(firstValidationMessages(caughtError.errors));
                setLookupError(caughtError.message);
            } else {
                setLookupError('Não foi possível guardar as competências.');
            }
        } finally {
            setSavingSkills(false);
        }
    }

    async function saveAvailability(): Promise<void> {
        setSavingAvailability(true);

        try {
            await api.patch('/professional/availability', { availability });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setLookupError(caughtError.message);
            } else {
                setLookupError('Não foi possível guardar a disponibilidade.');
            }
        } finally {
            setSavingAvailability(false);
        }
    }

    async function uploadPortfolioDrafts(): Promise<void> {
        setUploadingPortfolio(true);

        try {
            for (const draft of portfolioDrafts) {
                if (!draft.file || !draft.title.trim()) {
                    continue;
                }

                const formData = new FormData();
                formData.append('title', draft.title);
                formData.append('description', draft.description);
                formData.append('file', draft.file);
                await api.post('/professional/portfolio', formData);
            }
            setPortfolioDrafts([]);
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setLookupError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o portefólio.');
        } finally {
            setUploadingPortfolio(false);
        }
    }

    async function uploadDocuments(): Promise<void> {
        setUploadingDocuments(true);

        try {
            for (const draft of documentDrafts) {
                if (!draft.file || !draft.document_type) {
                    continue;
                }

                const formData = new FormData();
                formData.append('document_type', draft.document_type);
                formData.append('file', draft.file);
                await api.post('/professional/documents', formData);
            }
            setDocumentDrafts([]);
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setLookupError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os documentos.');
        } finally {
            setUploadingDocuments(false);
        }
    }

    async function deletePortfolioItem(itemId: number): Promise<void> {
        try {
            await api.delete(`/professional/portfolio/${itemId}`);
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setLookupError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível eliminar este item de portefólio.');
        }
    }

    if (isLoading) {
        return (
            <ProfessionalLayout title="Perfil profissional" description="Gerir a sua apresentação pública, competências e documentos.">
                <Head title="Perfil profissional" />
                <ProfileSkeleton />
            </ProfessionalLayout>
        );
    }

    if (isMissingProfile) {
        return (
            <ProfessionalLayout title="Perfil profissional" description="Gerir a sua apresentação pública, competências e documentos.">
                <Head title="Perfil profissional" />
                <EmptyState
                    title="Ainda não existe um perfil profissional"
                    description="Crie o seu perfil para começar a receber trabalhos e gerir a sua presença na plataforma."
                    icon={<MiniIcon path="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0M19 8v6M16 11h6" />}
                    action={<Button onClick={() => router.visit('/professional/onboarding', { replace: true })}>Criar perfil profissional</Button>}
                />
            </ProfessionalLayout>
        );
    }

    if (profileError) {
        return (
            <ProfessionalLayout title="Perfil profissional" description="Gerir a sua apresentação pública, competências e documentos.">
                <Head title="Perfil profissional" />
                <EmptyState
                    title="Não foi possível carregar o perfil"
                    description={profileError}
                    icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                    action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                />
            </ProfessionalLayout>
        );
    }

    const firstName = (profile?.user?.name ?? currentUser?.name ?? 'Profissional').split(/\s+/)[0];

    return (
        <ProfessionalLayout title="Perfil profissional" description="Gerir a sua apresentação pública, competências e documentos.">
            <Head title="Perfil profissional" />

            <div className="grid gap-6">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-6 py-8 text-white shadow-elevated sm:px-8">
                    <p className="text-sm font-semibold text-blue-100">Olá, {firstName}</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Actualize o seu perfil profissional</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">Mantenha a sua informação pública, disponibilidade, portefólio e documentos de verificação sempre actualizados.</p>
                </section>

                {lookupError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
                        {lookupError}
                    </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                    <VerificationStatusCard status={profile?.verification_status ?? 'pending'} />
                    <AvailabilityStatusCard availability={availability} />
                </div>

                <div className="grid gap-5">
                    <ProfessionalProfileForm values={profileValues} errors={fieldErrors} onChange={updateProfileValues} />
                    <ProfessionalLocationFields
                        province={location.province}
                        city={location.city}
                        address={location.address}
                        provinces={provinces}
                        cities={cities}
                        isLoadingCities={isLoadingCities}
                        errors={fieldErrors}
                        onChange={updateLocation}
                    />
                    <ProfessionalAvailabilitySelector availability={availability} onChange={setAvailability} />
                    <div className="flex justify-end">
                        <Button onClick={saveProfile} isLoading={savingProfile}>
                            Guardar perfil
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <div className="grid gap-4">
                        <ProfessionalCategorySelector
                            categories={categories}
                            selectedCategoryIds={selectedCategoryIds}
                            error={fieldErrors.category_ids}
                            onToggle={toggleCategory}
                        />
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={saveCategories} isLoading={savingCategories}>
                                Guardar categorias
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <ProfessionalSkillSelector
                            skills={skills}
                            selectedSkillIds={selectedSkillIds}
                            error={fieldErrors.skill_ids}
                            onToggle={toggleSkill}
                        />
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={saveSkills} isLoading={savingSkills}>
                                Guardar competências
                            </Button>
                        </div>
                    </div>
                </div>

                <PortfolioManager
                    items={portfolioItems ?? []}
                    drafts={portfolioDrafts}
                    onAddDraft={addPortfolioDraft}
                    onUpdateDraft={updatePortfolioDraft}
                    onRemoveDraft={removePortfolioDraft}
                    onDeleteItem={deletePortfolioItem}
                    onSubmitDrafts={uploadPortfolioDrafts}
                    isUploading={uploadingPortfolio}
                    showUploadAction
                />

                <VerificationDocumentsManager
                    verification={verification}
                    documents={documents}
                    drafts={documentDrafts}
                    onAddDraft={addDocumentDraft}
                    onUpdateDraft={updateDocumentDraft}
                    onRemoveDraft={removeDocumentDraft}
                    onSubmitDrafts={uploadDocuments}
                    isUploading={uploadingDocuments}
                    showUploadAction
                />
            </div>
        </ProfessionalLayout>
    );
}

function profileToValues(profile: ProfessionalProfile): ProfessionalProfileFormValues {
    return {
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        experience_years: String(profile.experience_years ?? ''),
        base_price: profile.base_price ?? '',
        price_type: profile.price_type ?? 'fixed',
    };
}

function firstValidationMessages(errors: Record<string, string[]>): Record<string, string> {
    return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Valor inválido.']));
}

function ProfileSkeleton() {
    return (
        <div className="grid gap-6" aria-label="A carregar o perfil profissional" aria-busy="true">
            <LoadingSkeleton className="h-44 rounded-3xl" />
            <div className="grid gap-4 lg:grid-cols-2">
                <LoadingSkeleton className="h-28 rounded-2xl" />
                <LoadingSkeleton className="h-28 rounded-2xl" />
            </div>
            <LoadingSkeleton className="h-96 rounded-2xl" />
            <LoadingSkeleton className="h-96 rounded-2xl" />
            <LoadingSkeleton className="h-96 rounded-2xl" />
        </div>
    );
}
