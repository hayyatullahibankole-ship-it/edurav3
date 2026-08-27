export type EventFieldType = "text" | "email" | "tel" | "textarea" | "select" | "number" | "date";

export interface EventFormField {
  key: string;
  label: string;
  type: EventFieldType;
  required: boolean;
  placeholder?: string;
  /** Options for select fields */
  options?: string[];
}

/**
 * Fields that are always collected and stored in dedicated columns.
 * Admins cannot remove these.
 */
export const CORE_EVENT_FIELDS: EventFormField[] = [
  { key: "full_name", label: "Full name", type: "text", required: true, placeholder: "Your full name" },
  { key: "email", label: "Email address", type: "email", required: true, placeholder: "you@example.com" },
  { key: "phone", label: "Phone number", type: "tel", required: true, placeholder: "080..." },
];

/**
 * Ready-made extra questions an admin can toggle on per event,
 * on top of the core fields. They can also add fully custom ones.
 */
export const SUGGESTED_EVENT_FIELDS: EventFormField[] = [
  { key: "gender", label: "Gender", type: "select", required: false, options: ["Male", "Female", "Prefer not to say"] },
  { key: "age", label: "Age", type: "number", required: false, placeholder: "e.g. 18" },
  { key: "school", label: "School / Institution", type: "text", required: false, placeholder: "Name of your school" },
  { key: "level", label: "Class / Level", type: "text", required: false, placeholder: "e.g. SS3, 200 Level" },
  { key: "course", label: "Course of study", type: "text", required: false, placeholder: "e.g. Computer Science" },
  { key: "address", label: "Address", type: "textarea", required: false, placeholder: "Where do you live?" },
  { key: "state", label: "State of residence", type: "text", required: false, placeholder: "e.g. Lagos" },
  { key: "occupation", label: "Occupation", type: "text", required: false, placeholder: "Student, Teacher, ..." },
  { key: "experience", label: "Experience level", type: "select", required: false, options: ["Beginner", "Intermediate", "Advanced"] },
  { key: "expectations", label: "What do you hope to gain?", type: "textarea", required: false, placeholder: "Tell us briefly" },
  { key: "referral", label: "How did you hear about this?", type: "select", required: false, options: ["Instagram", "WhatsApp", "Friend", "School", "Other"] },
  { key: "laptop", label: "Do you have a laptop?", type: "select", required: false, options: ["Yes", "No"] },
  { key: "dietary", label: "Dietary requirements", type: "text", required: false, placeholder: "Optional" },
  { key: "emergency_contact", label: "Emergency contact", type: "text", required: false, placeholder: "Name and phone" },
];

export function parseFormFields(value: unknown): EventFormField[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (f): f is EventFormField =>
      !!f && typeof f === "object" && typeof (f as any).key === "string" && typeof (f as any).label === "string"
  );
}

export function slugifyKey(label: string): string {
  return (
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `field_${Date.now()}`
  );
}
