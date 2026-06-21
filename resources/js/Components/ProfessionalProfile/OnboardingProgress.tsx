import { Card, CardContent } from '../ui/Card';

interface OnboardingProgressProps {
    steps: string[];
    activeStep: number;
}

export function OnboardingProgress({ steps, activeStep }: OnboardingProgressProps) {
    return (
        <Card>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-brand-600">Configuração do perfil</p>
                        <h2 className="text-lg font-bold text-slate-950">Etapa {activeStep + 1} de {steps.length}</h2>
                    </div>
                    <p className="text-sm text-slate-500">{steps[activeStep]}</p>
                </div>
                <div className="flex items-center gap-2">
                    {steps.map((step, index) => (
                        <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index <= activeStep ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{index + 1}</div>
                            <div className="min-w-0 flex-1">
                                <p className={`truncate text-xs font-medium ${index <= activeStep ? 'text-slate-900' : 'text-slate-500'}`}>{step}</p>
                                {index < steps.length - 1 ? <div className={`mt-2 h-1 rounded-full ${index < activeStep ? 'bg-brand-600' : 'bg-slate-200'}`} /> : null}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
