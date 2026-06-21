import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

export interface ProfessionalProfileFormValues {
    headline: string;
    bio: string;
    experience_years: string;
    base_price: string;
    price_type: 'hourly' | 'fixed' | 'negotiable';
}

interface ProfessionalProfileFormProps {
    values: ProfessionalProfileFormValues;
    errors: Record<string, string>;
    disabled?: boolean;
    onChange: (values: ProfessionalProfileFormValues) => void;
}

export function ProfessionalProfileForm({ values, errors, disabled = false, onChange }: ProfessionalProfileFormProps) {
    function update<K extends keyof ProfessionalProfileFormValues>(field: K, value: ProfessionalProfileFormValues[K]): void {
        onChange({ ...values, [field]: value });
    }

    return (
        <Card>
            <CardContent className="grid gap-5">
                <div>
                    <p className="text-sm font-semibold text-brand-600">Informações base</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">Conte aos clientes o que faz</h2>
                    <p className="mt-1 text-sm text-slate-500">Estas informações aparecem no seu perfil público e ajudam na descoberta.</p>
                </div>

                <Input label="Título principal" value={values.headline} error={errors.headline} placeholder="Ex.: Canalizador certificado em Maputo" disabled={disabled} onChange={(event) => update('headline', event.target.value)} />
                <Textarea label="Biografia" rows={6} value={values.bio} error={errors.bio} placeholder="Descreva a sua experiência, serviços e abordagem profissional." disabled={disabled} onChange={(event) => update('bio', event.target.value)} />

                <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Anos de experiência" type="number" min={0} value={values.experience_years} error={errors.experience_years} placeholder="Ex.: 8" disabled={disabled} onChange={(event) => update('experience_years', event.target.value)} />
                    <Input label="Preço base" type="number" min={0} value={values.base_price} error={errors.base_price} placeholder="Ex.: 1500" disabled={disabled} onChange={(event) => update('base_price', event.target.value)} />
                </div>

                <Select
                    label="Tipo de preço"
                    value={values.price_type}
                    error={errors.price_type}
                    options={[
                        { label: 'Por hora', value: 'hourly' },
                        { label: 'Preço fixo', value: 'fixed' },
                        { label: 'Negociável', value: 'negotiable' },
                    ]}
                    disabled={disabled}
                    onChange={(event) => update('price_type', event.target.value as ProfessionalProfileFormValues['price_type'])}
                />
            </CardContent>
        </Card>
    );
}
