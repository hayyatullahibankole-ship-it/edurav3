import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Lock } from "lucide-react";
import {
  CORE_EVENT_FIELDS,
  EventFieldType,
  EventFormField,
  SUGGESTED_EVENT_FIELDS,
  slugifyKey,
} from "@/lib/eventForm";

interface Props {
  value: EventFormField[];
  onChange: (fields: EventFormField[]) => void;
}

const TYPE_OPTIONS: { value: EventFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
];

export function EventFormBuilder({ value, onChange }: Props) {
  const [customLabel, setCustomLabel] = useState("");
  const [customType, setCustomType] = useState<EventFieldType>("text");
  const [customOptions, setCustomOptions] = useState("");

  const has = (key: string) => value.some((f) => f.key === key);

  const toggleSuggested = (field: EventFormField) => {
    if (has(field.key)) {
      onChange(value.filter((f) => f.key !== field.key));
    } else {
      onChange([...value, { ...field }]);
    }
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    let key = slugifyKey(label);
    while (has(key) || CORE_EVENT_FIELDS.some((c) => c.key === key)) key = `${key}_1`;
    onChange([
      ...value,
      {
        key,
        label,
        type: customType,
        required: false,
        options:
          customType === "select"
            ? customOptions.split(",").map((o) => o.trim()).filter(Boolean)
            : undefined,
      },
    ]);
    setCustomLabel("");
    setCustomOptions("");
    setCustomType("text");
  };

  const update = (key: string, patch: Partial<EventFormField>) =>
    onChange(value.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <Label className="text-sm font-semibold">Registration form</Label>
        <p className="text-xs text-muted-foreground mt-1">
          These details are always collected. Add or remove extra questions below.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {CORE_EVENT_FIELDS.map((f) => (
            <Badge key={f.key} variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" /> {f.label}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ready-made questions</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SUGGESTED_EVENT_FIELDS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleSuggested(f)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                has(f.key)
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-border text-muted-foreground hover:border-emerald-600"
              }`}
            >
              {has(f.key) ? "✓ " : "+ "}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Questions on this event ({value.length})
          </Label>
          {value.map((f) => (
            <div key={f.key} className="flex items-center gap-2 rounded border p-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.label}</div>
                <div className="text-xs text-muted-foreground">
                  {TYPE_OPTIONS.find((t) => t.value === f.type)?.label}
                  {f.options?.length ? ` · ${f.options.join(", ")}` : ""}
                </div>
              </div>
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => update(f.key, { required: e.target.checked })}
                />
                Required
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(value.filter((x) => x.key !== f.key))}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Add a custom question</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Question label"
            className="flex-1"
          />
          <Select value={customType} onValueChange={(v) => setCustomType(v as EventFieldType)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addCustom} variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        {customType === "select" && (
          <Input
            value={customOptions}
            onChange={(e) => setCustomOptions(e.target.value)}
            placeholder="Options, comma separated (e.g. Yes, No)"
          />
        )}
      </div>
    </div>
  );
}
