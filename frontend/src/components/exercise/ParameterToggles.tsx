import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ParameterFlags {
  hasSets: boolean;
  hasReps: boolean;
  hasWeight: boolean;
  hasDistance: boolean;
  hasTime: boolean;
}

interface ParameterTogglesProps {
  value: ParameterFlags;
  onChange: (value: ParameterFlags) => void;
}

const parameters: { key: keyof ParameterFlags; label: string }[] = [
  { key: "hasSets", label: "Séries" },
  { key: "hasReps", label: "Repetições" },
  { key: "hasWeight", label: "Peso (kg)" },
  { key: "hasDistance", label: "Distância (m)" },
  { key: "hasTime", label: "Tempo (s)" },
];

export function ParameterToggles({ value, onChange }: ParameterTogglesProps) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {parameters.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <Checkbox
            id={`param-${key}`}
            checked={value[key]}
            onCheckedChange={(checked) =>
              onChange({ ...value, [key]: !!checked })
            }
          />
          <Label htmlFor={`param-${key}`} className="text-sm font-normal">
            {label}
          </Label>
        </div>
      ))}
    </div>
  );
}
