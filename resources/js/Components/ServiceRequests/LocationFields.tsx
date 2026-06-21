import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface LocationFieldsProps {
    province: string;
    city: string;
    address: string;
    provinces: string[];
    cities: string[];
    isLoadingCities: boolean;
    errors: Record<string, string>;
    onChange: (field: 'province' | 'city' | 'address', value: string) => void;
}

export function LocationFields({ province, city, address, provinces, cities, isLoadingCities, errors, onChange }: LocationFieldsProps) {
    return (
        <section className="grid gap-4" aria-labelledby="location-title">
            <div><h2 id="location-title" className="text-lg font-semibold text-slate-950">Localização</h2><p className="mt-1 text-sm text-slate-500">Para serviços remotos, estes campos podem ficar em branco.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Província" value={province} error={errors.province} placeholder="Seleccione a província" options={provinces.map((item) => ({ label: item, value: item }))} onChange={(event) => onChange('province', event.target.value)} />
                <Select label="Cidade" value={city} error={errors.city} placeholder={isLoadingCities ? 'A carregar cidades...' : 'Seleccione a cidade'} disabled={!province || isLoadingCities} options={cities.map((item) => ({ label: item, value: item }))} onChange={(event) => onChange('city', event.target.value)} />
            </div>
            <Input label="Endereço" value={address} error={errors.address} placeholder="Bairro, rua ou referência" onChange={(event) => onChange('address', event.target.value)} />
        </section>
    );
}
