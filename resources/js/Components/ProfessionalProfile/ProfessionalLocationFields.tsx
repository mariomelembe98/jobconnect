import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface ProfessionalLocationFieldsProps {
    province: string;
    city: string;
    address: string;
    provinces: string[];
    cities: string[];
    isLoadingCities?: boolean;
    disabled?: boolean;
    errors: Record<string, string>;
    onChange: (field: 'province' | 'city' | 'address', value: string) => void;
}

export function ProfessionalLocationFields({ province, city, address, provinces, cities, isLoadingCities = false, disabled = false, errors, onChange }: ProfessionalLocationFieldsProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                <div>
                    <p className="text-sm font-semibold text-brand-600">Localização</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">Diga onde trabalha</h2>
                    <p className="mt-1 text-sm text-slate-500">Ajuda a mostrar o seu perfil às pessoas da sua zona.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Select
                        label="Província"
                        value={province}
                        error={errors.province}
                        placeholder="Seleccione a província"
                        options={provinces.map((entry) => ({ label: entry, value: entry }))}
                        disabled={disabled}
                        onChange={(event) => onChange('province', event.target.value)}
                    />
                    <Select
                        label="Cidade"
                        value={city}
                        error={errors.city}
                        placeholder={isLoadingCities ? 'A carregar cidades...' : 'Seleccione a cidade'}
                        options={cities.map((entry) => ({ label: entry, value: entry }))}
                        disabled={disabled || !province || isLoadingCities}
                        onChange={(event) => onChange('city', event.target.value)}
                    />
                </div>

                <Input label="Morada" value={address} error={errors.address} placeholder="Opcional. Ex.: Avenida 25 de Setembro" disabled={disabled} onChange={(event) => onChange('address', event.target.value)} />
            </CardContent>
        </Card>
    );
}
