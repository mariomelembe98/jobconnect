import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { ServiceRequestForm, type ServiceRequestFormValues } from '../../../Components/ServiceRequests/ServiceRequestForm';
import { MiniIcon } from '../../../Components/Dashboard/StatCard';
import { Button } from '../../../Components/ui/Button';
import { Card, CardContent } from '../../../Components/ui/Card';
import { EmptyState } from '../../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../../Components/ui/LoadingSkeleton';
import { ClientLayout } from '../../../Layouts/ClientLayout';
import { api, ApiError } from '../../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../../lib/auth';
import type { Category } from '../../../types';

const initialValues: ServiceRequestFormValues = {
    title: '',
    category_id: '',
    description: '',
    service_type: 'local',
    budget_min: '',
    budget_max: '',
    budget_type: 'negotiable',
    province: '',
    city: '',
    address: '',
    deadline_at: '',
};

export default function CreateServiceRequest() {
    const [values, setValues] = useState<ServiceRequestFormValues>(initialValues);
    const [files, setFiles] = useState<File[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [isLoadingLookups, setIsLoadingLookups] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [partialFailure, setPartialFailure] = useState<string | null>(null);
    const [partialRequestId, setPartialRequestId] = useState<number | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadLookups = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) {
            router.visit('/login', { replace: true });
            return;
        }

        if (getStoredAuthUser()?.user_type !== 'client') {
            return;
        }

        setIsLoadingLookups(true);
        setLookupError(null);

        try {
            const [categoriesData, provincesData] = await Promise.all([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<{ provinces: string[] }>('/locations/provinces', { signal }),
            ]);
            setCategories(categoriesData.categories);
            setProvinces(provincesData.provinces);
        } catch (error) {
            if (!signal.aborted) setLookupError(error instanceof ApiError ? error.message : 'Não foi possível carregar os dados do formulário.');
        } finally {
            if (!signal.aborted) setIsLoadingLookups(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadLookups(controller.signal);
        return () => controller.abort();
    }, [loadLookups, reloadKey]);

    useEffect(() => {
        const controller = new AbortController();

        if (!values.province) {
            setCities([]);
            return () => controller.abort();
        }

        async function loadCities(): Promise<void> {
            setIsLoadingCities(true);
            setLookupError(null);

            try {
                const data = await api.get<{ cities: string[] }>('/locations/cities', { signal: controller.signal, query: { province: values.province } });
                setCities(data.cities);
            } catch (error) {
                if (!controller.signal.aborted) setLookupError(error instanceof ApiError ? error.message : 'Não foi possível carregar as cidades.');
            } finally {
                if (!controller.signal.aborted) setIsLoadingCities(false);
            }
        }

        void loadCities();
        return () => controller.abort();
    }, [reloadKey, values.province]);

    function updateValues(nextValues: ServiceRequestFormValues): void {
        if (nextValues.province !== values.province) {
            nextValues = { ...nextValues, city: '' };
        }

        setValues(nextValues);
    }

    function updateFiles(nextFiles: File[]): void {
        const invalidFile = nextFiles.find((file) => file.size > 20 * 1024 * 1024 || !/\.(jpe?g|png|webp|pdf)$/i.test(file.name));
        setFiles(nextFiles);
        setErrors((current) => {
            const next = { ...current };
            delete next.files;
            if (invalidFile) next.files = `${invalidFile.name} não tem um formato válido ou excede 20 MB.`;
            return next;
        });
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        if (errors.files) return;

        setIsSubmitting(true);
        setErrors({});
        let createdRequestId: number | null = null;

        try {
            const data = await api.post<{ service_request: { id: number } }>('/service-requests', {
                category_id: values.category_id ? Number(values.category_id) : null,
                title: values.title,
                description: values.description,
                service_type: values.service_type,
                budget_min: values.budget_min === '' ? null : Number(values.budget_min),
                budget_max: values.budget_max === '' ? null : Number(values.budget_max),
                budget_type: values.budget_type,
                province: values.province || null,
                city: values.city || null,
                address: values.address || null,
                deadline_at: values.deadline_at || null,
                visibility: 'public',
            });
            createdRequestId = data.service_request.id;

            if (files.length > 0) {
                setIsUploading(true);
                const formData = new FormData();
                files.forEach((file) => formData.append('files[]', file));
                await api.post(`/service-requests/${createdRequestId}/attachments`, formData);
            }

            router.visit(`/client/service-requests/${createdRequestId}`, { replace: true });
        } catch (error) {
            if (createdRequestId !== null) {
                setPartialRequestId(createdRequestId);
                setPartialFailure(error instanceof ApiError ? `O pedido foi criado, mas os anexos não foram carregados: ${error.message}` : 'O pedido foi criado, mas não foi possível carregar os anexos.');
            } else if (error instanceof ApiError) {
                setErrors(firstValidationMessages(error.errors));
                if (Object.keys(error.errors).length === 0) setErrors({ form: error.message });
            } else {
                setErrors({ form: 'Não foi possível publicar o pedido. Tente novamente.' });
            }
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    }

    return (
        <ClientLayout title="Publicar pedido" description="Descreva o serviço e receba propostas de profissionais.">
            <Head title="Publicar pedido" />

            {isLoadingLookups ? <FormSkeleton /> : null}

            {!isLoadingLookups && lookupError ? <EmptyState title="Não foi possível preparar o formulário" description={lookupError} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}

            {!isLoadingLookups && !lookupError && partialFailure ? <EmptyState title="Pedido criado com aviso" description={partialFailure} icon={<MiniIcon path="M12 9v4M12 17h.01M4 4h16v16H4z" />} action={<Button onClick={() => router.visit(partialRequestId ? `/client/service-requests/${partialRequestId}` : '/client', { replace: true })}>Ver pedido</Button>} /> : null}

            {!isLoadingLookups && !lookupError && !partialFailure ? (
                <div className="mx-auto max-w-4xl">
                    {errors.form ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errors.form}</div> : null}
                    <Card><CardContent className="p-5 sm:p-8"><ServiceRequestForm values={values} files={files} categories={categories} provinces={provinces} cities={cities} errors={errors} isSubmitting={isSubmitting} isUploading={isUploading} isLoadingCities={isLoadingCities} onChange={updateValues} onFilesChange={updateFiles} onSubmit={submit} onCancel={() => router.visit('/client')} /></CardContent></Card>
                </div>
            ) : null}
        </ClientLayout>
    );
}

function firstValidationMessages(errors: Record<string, string[]>): Record<string, string> {
    return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Valor inválido.']));
}

function FormSkeleton() {
    return <div className="mx-auto grid max-w-4xl gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-8" aria-label="A carregar formulário" aria-busy="true"><div className="grid gap-2"><LoadingSkeleton className="h-6 w-48" /><LoadingSkeleton className="h-4 w-80 max-w-full" /></div>{Array.from({ length: 5 }, (_, index) => <div key={index} className="grid gap-3"><LoadingSkeleton className="h-4 w-32" /><LoadingSkeleton className="h-11 w-full rounded-xl" /></div>)}<LoadingSkeleton className="h-36 w-full rounded-2xl" /></div>;
}
