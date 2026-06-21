import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { JobDetailHeader } from '../../../Components/ProfessionalJobs/JobDetailHeader';
import { SubmitProposalForm, type ProposalFormValues } from '../../../Components/ProfessionalJobs/SubmitProposalForm';
import { ServiceRequestAttachments } from '../../../Components/ServiceRequests/ServiceRequestAttachments';
import { MiniIcon } from '../../../Components/Dashboard/StatCard';
import { Button } from '../../../Components/ui/Button';
import { Card, CardContent } from '../../../Components/ui/Card';
import { EmptyState } from '../../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../../Components/ui/LoadingSkeleton';
import { ProfessionalLayout } from '../../../Layouts/ProfessionalLayout';
import { api, ApiError } from '../../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../../lib/auth';
import type { ServiceRequest } from '../../../types';

const initialValues: ProposalFormValues = { amount: '', delivery_days: '', message: '' };

export default function ProfessionalJobDetail({ serviceRequestId }: { serviceRequestId: number }) {
    const [job, setJob] = useState<ServiceRequest | null>(null);
    const [values, setValues] = useState<ProposalFormValues>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadJob = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) return;
        if (getStoredAuthUser()?.user_type !== 'professional') return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<{ service_request: ServiceRequest }>(`/service-requests/${serviceRequestId}`, { signal });
            setJob(data.service_request);
        } catch (caughtError) {
            if (!signal.aborted) setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar este trabalho.');
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, [serviceRequestId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadJob(controller.signal);
        return () => controller.abort();
    }, [loadJob, reloadKey]);

    async function submitProposal(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            await api.post('/proposals', {
                service_request_id: serviceRequestId,
                amount: values.amount === '' ? null : Number(values.amount),
                delivery_days: values.delivery_days === '' ? null : Number(values.delivery_days),
                message: values.message || null,
            });
            router.visit('/professional/proposals', { replace: true });
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                const validationErrors = Object.fromEntries(Object.entries(caughtError.errors).map(([field, messages]) => [field, messages[0] ?? 'Valor inválido.']));
                setErrors(Object.keys(validationErrors).length > 0 ? validationErrors : { form: caughtError.message });
            } else {
                setErrors({ form: 'Não foi possível enviar a proposta. Tente novamente.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <ProfessionalLayout title="Detalhes do trabalho" description="Analise o pedido e envie a sua proposta.">
            <Head title={job?.title ?? 'Detalhes do trabalho'} />
            {isLoading && !job ? <JobSkeleton /> : null}
            {!isLoading && error ? <EmptyState title="Não foi possível carregar o trabalho" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}
            {!error && job ? (
                <div className="grid gap-6">
                    <JobDetailHeader job={job} />
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="grid gap-6">
                            <Card><CardContent><h2 className="text-xl font-bold text-slate-950">Descrição do trabalho</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.description}</p>{job.address ? <p className="mt-4 text-sm text-slate-500"><strong className="text-slate-700">Endereço:</strong> {job.address}</p> : null}</CardContent></Card>
                            <Card><CardContent><h2 className="text-xl font-bold text-slate-950">Anexos</h2><ServiceRequestAttachments attachments={job.attachments ?? []} /></CardContent></Card>
                            <Card><CardContent><h2 className="text-xl font-bold text-slate-950">Sobre o cliente</h2>{job.client?.name ? <div className="mt-4 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-100 font-bold text-brand-700">{job.client.name.charAt(0).toUpperCase()}</span><div><p className="font-semibold text-slate-950">{job.client.name}</p><p className="mt-1 text-sm text-slate-500">Cliente ProConnect</p></div></div> : <p className="mt-3 text-sm text-slate-500">Informação do cliente não disponível.</p>}</CardContent></Card>
                        </div>
                        <aside className="lg:sticky lg:top-24 lg:self-start"><Card><CardContent><SubmitProposalForm values={values} errors={errors} isSubmitting={isSubmitting} onChange={setValues} onSubmit={submitProposal} /></CardContent></Card><Button variant="ghost" className="mt-3 w-full" onClick={() => router.visit('/professional/jobs')}>Voltar aos trabalhos</Button></aside>
                    </div>
                </div>
            ) : null}
        </ProfessionalLayout>
    );
}

function JobSkeleton() {
    return <div className="grid gap-6" aria-label="A carregar trabalho" aria-busy="true"><div className="grid min-h-52 gap-4 rounded-3xl bg-brand-100 p-8"><LoadingSkeleton className="h-6 w-32 bg-brand-200" /><LoadingSkeleton className="h-9 w-full max-w-xl bg-brand-200" /><LoadingSkeleton className="h-5 w-64 bg-brand-200" /></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="grid gap-6"><LoadingSkeleton className="h-64 rounded-2xl" /><LoadingSkeleton className="h-44 rounded-2xl" /></div><LoadingSkeleton className="h-96 rounded-2xl" /></div></div>;
}
