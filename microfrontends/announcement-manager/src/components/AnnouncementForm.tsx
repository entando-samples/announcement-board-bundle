import { useState, type FormEvent } from 'react';
import { CATEGORIES, STATUSES, type AnnouncementInput } from '../types';
import { validateInput, type FieldErrors } from '../validation';

interface AnnouncementFormProps {
  initial?: AnnouncementInput;
  onSubmit: (input: AnnouncementInput) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: AnnouncementInput = {
  title: '',
  summary: '',
  body: '',
  category: 'GENERAL',
  status: 'DRAFT',
};

export default function AnnouncementForm({ initial, onSubmit, onCancel }: AnnouncementFormProps) {
  const [values, setValues] = useState<AnnouncementInput>(() =>
    initial
      ? {
          title: initial.title,
          summary: initial.summary,
          body: initial.body,
          category: initial.category,
          status: initial.status,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AnnouncementInput>(key: K, value: AnnouncementInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateInput(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSaving(true);
    setSubmitError(undefined);
    try {
      await onSubmit({
        ...values,
        title: values.title.trim(),
        summary: values.summary.trim(),
        body: values.body.trim(),
      });
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: keyof AnnouncementInput) =>
    errors[key] && (
      <span id={`${key}-error`} className="announcement-manager__field-error">
        {errors[key]}
      </span>
    );

  return (
    <form className="announcement-manager__form" onSubmit={submit} noValidate>
      <label>
        Title
        <input
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {fieldError('title')}
      </label>
      <label>
        Summary
        <input
          value={values.summary}
          onChange={(e) => set('summary', e.target.value)}
          aria-invalid={Boolean(errors.summary)}
          aria-describedby={errors.summary ? 'summary-error' : undefined}
        />
        {fieldError('summary')}
      </label>
      <label>
        Body
        <textarea
          rows={5}
          value={values.body}
          onChange={(e) => set('body', e.target.value)}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? 'body-error' : undefined}
        />
        {fieldError('body')}
      </label>
      <label>
        Category
        <select value={values.category} onChange={(e) => set('category', e.target.value as AnnouncementInput['category'])}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select value={values.status} onChange={(e) => set('status', e.target.value as AnnouncementInput['status'])}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {submitError && (
        <p className="announcement-manager__error" role="alert">
          {submitError}
        </p>
      )}
      <div className="announcement-manager__actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
