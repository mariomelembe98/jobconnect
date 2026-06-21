import type { FormEvent } from 'react';

import type { Category } from '../../types';
import { AttachmentUploader } from './AttachmentUploader';
import { BudgetFields } from './BudgetFields';
import { LocationFields } from './LocationFields';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

export interface ServiceRequestFormValues {
    title: string;
    category_id: string;
    description: string;
    service_type: 'local' | 'remote' | 'hybrid';
    budget_min: string;
    budget_max: string;
    budget_type: 'fixed' | 'hourly' | 'negotiable';
    province: string;
    city: string;
    address: string;
    deadline_at: string;
}

interface ServiceRequestFormProps {
    values: ServiceRequestFormValues;
    files: File[];
    categories: Category[];
    provinces: string[];
    cities: string[];
    errors: Record<string, string>;
    isSubmitting: boolean;
    isUploading: boolean;
    isLoadingCities: boolean;
    onChange: (values: ServiceRequestFormValues) => void;
    onFilesChange: (files: File[]) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}

export function ServiceRequestForm(props: ServiceRequestFormProps) {
    const { values, files, categories, provinces, cities, errors, isSubmitting, isUploading, isLoadingCities, onChange, onFilesChange, onSubmit, onCancel } = props;
    const disabled = isSubmitting || isUploading;

    function update<K extends keyof ServiceRequestFormValues>(field: K, value: ServiceRequestFormValues[K]): void {
        onChange({ ...values, [field]: value });
    }

    return (
        <form className="grid gap-8" onSubmit={onSubmit} noValidate>
            <section className="grid gap-4" aria-labelledby="request-details-title">
                <div><h2 id="request-details-title" className="text-lg font-semibold text-slate-950">Detalhes do serviço</h2><p className="mt-1 text-sm text-slate-500">Explique claramente o que precisa para receber propostas adequadas.</p></div>
                <Input label="Título" value={values.title} error={errors.title} placeholder="Ex.: Reparação da instalação eléctrica" onChange={(event) => update('title', event.target.value)} />
                <Select label="Categoria" value={values.category_id} error={errors.category_id} placeholder="Seleccione uma categoria" options={categories.map((category) => ({ label: category.name, value: String(category.id) }))} onChange={(event) => update('category_id', event.target.value)} />
                <Textarea label="Descrição" rows={6} value={values.description} error={errors.description} hint="Inclua detalhes, medidas, materiais e resultado esperado." placeholder="Descreva o serviço com pelo menos 30 caracteres..." onChange={(event) => update('description', event.target.value)} />
                <Select
                    label="Tipo de serviço"
                    value={values.service_type}
                    error={errors.service_type}
                    options={[
                        { label: 'No local', value: 'local' },
                        { label: 'Remoto', value: 'remote' },
                        { label: 'Híbrido', value: 'hybrid' },
                    ]}
                    onChange={(event) => update('service_type', event.target.value as ServiceRequestFormValues['service_type'])}
                />
            </section>

            <div className="border-t border-slate-100" />
            <BudgetFields
                budgetMin={values.budget_min}
                budgetMax={values.budget_max}
                budgetType={values.budget_type}
                errors={errors}
                onChange={(field, value) => {
                    if (field === 'budget_type') {
                        update('budget_type', value as ServiceRequestFormValues['budget_type']);
                    } else {
                        update(field, value);
                    }
                }}
            />
            <div className="border-t border-slate-100" />
            <LocationFields province={values.province} city={values.city} address={values.address} provinces={provinces} cities={cities} isLoadingCities={isLoadingCities} errors={errors} onChange={(field, value) => update(field, value)} />
            <Input label="Prazo" type="datetime-local" value={values.deadline_at} error={errors.deadline_at} hint="Opcional. Deve ser uma data futura." onChange={(event) => update('deadline_at', event.target.value)} />
            <div className="border-t border-slate-100" />
            <AttachmentUploader files={files} error={errors.files ?? errors['files.0']} disabled={disabled} onChange={onFilesChange} />

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>Cancelar</Button>
                <Button type="submit" isLoading={disabled}>{isUploading ? 'A carregar anexos...' : 'Publicar pedido'}</Button>
            </div>
        </form>
    );
}
