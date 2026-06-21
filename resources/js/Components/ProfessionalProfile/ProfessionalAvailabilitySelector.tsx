import type { ProfessionalProfile } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';

interface ProfessionalAvailabilitySelectorProps {
    availability: ProfessionalProfile['availability'];
    disabled?: boolean;
    onChange: (availability: ProfessionalProfile['availability']) => void;
}

export function ProfessionalAvailabilitySelector({ availability, disabled = false, onChange }: ProfessionalAvailabilitySelectorProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                <div>
                    <p className="text-sm font-semibold text-brand-600">Disponibilidade</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">Defina o seu estado actual</h2>
                    <p className="mt-1 text-sm text-slate-500">Mostra aos clientes quando está disponível para novos trabalhos.</p>
                </div>

                <Select
                    label="Estado de disponibilidade"
                    value={availability}
                    options={[
                        { label: 'Disponível', value: 'available' },
                        { label: 'Ocupado', value: 'busy' },
                        { label: 'Ausente', value: 'away' },
                        { label: 'De férias', value: 'vacation' },
                        { label: 'Indisponível', value: 'unavailable' },
                    ]}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value as ProfessionalProfile['availability'])}
                />
            </CardContent>
        </Card>
    );
}
