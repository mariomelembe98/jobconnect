import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { OnboardingProgress } from '../../Components/ProfessionalProfile/OnboardingProgress';
import { PortfolioManager, type PortfolioDraft } from '../../Components/ProfessionalProfile/PortfolioManager';
import { ProfessionalAvailabilitySelector } from '../../Components/ProfessionalProfile/ProfessionalAvailabilitySelector';
import { ProfessionalCategorySelector } from '../../Components/ProfessionalProfile/ProfessionalCategorySelector';
import { ProfessionalLocationFields } from '../../Components/ProfessionalProfile/ProfessionalLocationFields';
import { ProfessionalProfileForm, type ProfessionalProfileFormValues } from '../../Components/ProfessionalProfile/ProfessionalProfileForm';
import { ProfessionalSkillSelector } from '../../Components/ProfessionalProfile/ProfessionalSkillSelector';
import { VerificationDocumentsManager, type DocumentDraft } from '../../Components/ProfessionalProfile/VerificationDocumentsManager';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { Card, CardContent } from '../../Components/ui/Card';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ProfessionalLayout } from '../../Layouts/ProfessionalLayout';
import { api, ApiError } from '../../lib/api';
import type { Category, ProfessionalDocument, ProfessionalProfile, ProfessionalVerification, Skill } from '../../types';

const steps = ['Informações base', 'Categorias e competências', 'Localização e disponibilidade', 'Portefólio e documentos', 'Resumo final'];

const initialFormValues: ProfessionalProfileFormValues = {
    headline: '',
    bio: '',
    experience_years: '',
    base_price: '',
    price_type: 'fixed',
};

const initialLocation = {
    province: '',
    city: '',
    address: '',
};

export default function ProfessionalOnboarding() {
    const [isLoading, setIsLoading] = useState(true);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formValues, setFormValues] = useState<ProfessionalProfileFormValues>({ ...initialFormValues });
    const [location, setLocation] = useState({ ...initialLocation });
    const [availability, setAvailability] = useState<ProfessionalProfile['availability']>('available');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
    const [portfolioDrafts, setPortfolioDrafts] = useState<PortfolioDraft[]>([]);
    const [documentDrafts, setDocumentDrafts] = useState<DocumentDraft[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [verificationPreview, setVerificationPreview] = useState<ProfessionalVerification | null>(null);
    const [documentsPreview, setDocumentsPreview] = useState<ProfessionalDocument[]>([]);

    const loadInitialData = useCallback(async (signal: AbortSignal) => {
        setIsLoading(true);
        setLookupError(null);

        try {
            try {
                await api.get<{ profile: ProfessionalProfile }>('/professional/profile', { signal });
                router.visit('/professional/profile', {
                    replace: true,
                    preserveScroll: true,
                });

                return;
            } catch (caughtError) {
                if (!(caughtError instanceof ApiError && caughtError.status === 404)) {
                    throw caughtError;
                }
            }

            const [categoriesData, skillsData, provincesData] = await Promise.all([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<{ skills: Skill[] }>('/skills', { signal }),
                api.get<{ provinces: string[] }>('/locations/provinces', { signal }),
            ]);

            setCategories(categoriesData.categories);
            setSkills(skillsData.skills);
            setProvinces(provincesData.provinces);
        } catch (caughtError) {
            if (!signal.aborted) {
                setLookupError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível preparar o assistente de perfil.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadInitialData(controller.signal);

        return () => controller.abort();
    }, [loadInitialData]);

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
        setFormValues(values);
        setFormError(null);
        setFieldErrors({});
    }

    function updateLocation(field: 'province' | 'city' | 'address', value: string): void {
        setLocation((current) => {
            if (field === 'province') {
                return { ...current, province: value, city: '' };
            }

            return { ...current, [field]: value };
        });
        setFormError(null);
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

    async function submitOnboarding(): Promise<void> {
        setIsSubmitting(true);
        setFormError(null);
        setFieldErrors({});

        try {
            await api.post<{ profile: ProfessionalProfile }>('/professional/profile', {
                headline: formValues.headline,
                bio: formValues.bio,
                experience_years: Number(formValues.experience_years),
                base_price: formValues.base_price === '' ? null : Number(formValues.base_price),
                price_type: formValues.price_type,
                province: location.province,
                city: location.city,
                address: location.address || null,
            });

            await api.post('/professional/categories', {
                category_ids: selectedCategoryIds,
            });

            await api.post('/professional/skills', {
                skill_ids: selectedSkillIds,
            });

            await api.patch('/professional/availability', {
                availability,
            });

            await uploadPortfolioDrafts(portfolioDrafts);
            await uploadDocumentDrafts(documentDrafts);

            router.visit('/professional', {
                replace: true,
                preserveScroll: true,
            });
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setFormError(caughtError.message);
                setFieldErrors(firstValidationMessages(caughtError.errors));
            } else {
                setFormError('Não foi possível concluir a configuração do perfil.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <ProfessionalLayout title="Criar perfil profissional" description="Prepare o seu perfil para começar a receber oportunidades.">
                <Head title="Criar perfil profissional" />
                <OnboardingSkeleton />
            </ProfessionalLayout>
        );
    }

    if (lookupError) {
        return (
            <ProfessionalLayout title="Criar perfil profissional" description="Prepare o seu perfil para começar a receber oportunidades.">
                <Head title="Criar perfil profissional" />
                <EmptyState
                    title="Não foi possível preparar o assistente"
                    description={lookupError}
                    icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                    action={<Button onClick={() => router.reload()}>Tentar novamente</Button>}
                />
            </ProfessionalLayout>
        );
    }

    return (
        <ProfessionalLayout title="Criar perfil profissional" description="Prepare o seu perfil para começar a receber oportunidades.">
            <Head title="Criar perfil profissional" />

            <div className="grid gap-6">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-6 py-8 text-white shadow-elevated sm:px-8">
                    <p className="text-sm font-semibold text-blue-100">Passo {currentStep + 1} de {steps.length}</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Configure o seu perfil profissional</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">Complete as informações essenciais, seleccione áreas de trabalho e guarde os seus dados para activar a sua presença na ProConnect.</p>
                    {formError ? <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white" role="alert">{formError}</p> : null}
                </section>

                <OnboardingProgress steps={steps} activeStep={currentStep} />

                {currentStep === 0 ? (
                    <ProfessionalProfileForm values={formValues} errors={fieldErrors} onChange={updateProfileValues} />
                ) : null}

                {currentStep === 1 ? (
                    <div className="grid gap-6">
                            <ProfessionalCategorySelector
                                categories={categories}
                                selectedCategoryIds={selectedCategoryIds}
                                error={fieldErrors.category_ids}
                                onToggle={toggleCategory}
                            />
                            <ProfessionalSkillSelector
                                skills={skills}
                                selectedSkillIds={selectedSkillIds}
                                error={fieldErrors.skill_ids}
                                onToggle={toggleSkill}
                            />
                    </div>
                ) : null}

                {currentStep === 2 ? (
                    <div className="grid gap-6">
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
                    </div>
                ) : null}

                {currentStep === 3 ? (
                    <div className="grid gap-6">
                        <PortfolioManager
                            items={[]}
                            drafts={portfolioDrafts}
                            showUploadAction={false}
                            onAddDraft={addPortfolioDraft}
                            onUpdateDraft={updatePortfolioDraft}
                            onRemoveDraft={removePortfolioDraft}
                            onDeleteItem={() => undefined}
                            onSubmitDrafts={() => undefined}
                        />
                        <VerificationDocumentsManager
                            verification={verificationPreview}
                            documents={documentsPreview}
                            drafts={documentDrafts}
                            showUploadAction={false}
                            onAddDraft={addDocumentDraft}
                            onUpdateDraft={updateDocumentDraft}
                            onRemoveDraft={removeDocumentDraft}
                            onSubmitDrafts={() => undefined}
                        />
                    </div>
                ) : null}

                {currentStep === 4 ? (
                    <Card>
                        <CardContent className="grid gap-5">
                            <div>
                                <p className="text-sm font-semibold text-brand-600">Resumo final</p>
                                <h2 className="mt-1 text-xl font-bold text-slate-950">Revise antes de activar o perfil</h2>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Summary label="Título" value={formValues.headline || 'Sem título'} />
                                <Summary label="Categorias" value={`${selectedCategoryIds.length} seleccionadas`} />
                                <Summary label="Competências" value={`${selectedSkillIds.length} seleccionadas`} />
                                <Summary label="Localização" value={[location.province, location.city].filter(Boolean).join(' · ') || 'Sem localização'} />
                                <Summary label="Disponibilidade" value={availability} />
                                <Summary label="Portefólio" value={`${portfolioDrafts.length} ficheiro(s) opcional(ais)`} />
                                <Summary label="Documentos" value={`${documentDrafts.length} ficheiro(s) opcional(ais)`} />
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))} disabled={currentStep === 0 || isSubmitting}>
                        Anterior
                    </Button>
                    {currentStep < steps.length - 1 ? (
                        <Button onClick={() => setCurrentStep((step) => Math.min(step + 1, steps.length - 1))} disabled={isSubmitting}>
                            Seguinte
                        </Button>
                    ) : (
                        <Button onClick={submitOnboarding} isLoading={isSubmitting}>
                            Concluir e activar
                        </Button>
                    )}
                </div>
            </div>
        </ProfessionalLayout>
    );
}

async function uploadPortfolioDrafts(drafts: PortfolioDraft[]): Promise<void> {
    for (const draft of drafts) {
        if (!draft.file || !draft.title.trim()) {
            continue;
        }

        const formData = new FormData();
        formData.append('title', draft.title);
        formData.append('description', draft.description);
        formData.append('file', draft.file);

        try {
            await api.post('/professional/portfolio', formData);
        } catch {
            // Portefólio é opcional durante o onboarding.
        }
    }
}

async function uploadDocumentDrafts(drafts: DocumentDraft[]): Promise<void> {
    for (const draft of drafts) {
        if (!draft.file || !draft.document_type) {
            continue;
        }

        const formData = new FormData();
        formData.append('document_type', draft.document_type);
        formData.append('file', draft.file);

        try {
            await api.post('/professional/documents', formData);
        } catch {
            // Documentos são opcionais durante o onboarding.
        }
    }
}

function firstValidationMessages(errors: Record<string, string[]>): Record<string, string> {
    return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Valor inválido.']));
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
        </div>
    );
}

function OnboardingSkeleton() {
    return (
        <div className="grid gap-6" aria-busy="true" aria-label="A carregar assistente de perfil">
            <LoadingSkeleton className="h-44 rounded-3xl" />
            <LoadingSkeleton className="h-28 rounded-2xl" />
            <LoadingSkeleton className="h-96 rounded-2xl" />
        </div>
    );
}
