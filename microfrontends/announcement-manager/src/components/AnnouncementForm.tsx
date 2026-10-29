import { useState, type FormEvent } from 'react';
import { CATEGORIES, STATUSES, type AnnouncementInput } from '../types';
import { validateInput, type FieldErrors } from '../validation';
import { ApiError } from '../api/http';

interface AnnouncementFormProps {
  initial?: AnnouncementInput;
  onSubmit: (input: AnnouncementInput) => Promise<void>;
  onCancel: () => void;
}

const ID_PREFIX = 'announcement-manager';

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
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors as FieldErrors);
      }
      setSubmitError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fieldProps = (key: 'title' | 'summary' | 'body') => ({
    id: `${ID_PREFIX}-${key}`,
    value: values[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${ID_PREFIX}-${key}-error` : undefined,
  });

  const fieldError = (key: keyof AnnouncementInput) =>
    errors[key] && (
      <span id={`${ID_PREFIX}-${key}-error`} className="announcement-manager__field-error">
        {errors[key]}
      </span>
    );

  return (
    <form className="announcement-manager__form" onSubmit={submit} noValidate>
      <div className="announcement-manager__field">
        <label htmlFor={`${ID_PREFIX}-title`}>Title</label>
        <input {...fieldProps('title')} />
        {fieldError('title')}
      </div>
      <div className="announcement-manager__field">
        <label htmlFor={`${ID_PREFIX}-summary`}>Summary</label>
        <input {...fieldProps('summary')} />
        {fieldError('summary')}
      </div>
      <div className="announcement-manager__field">
        <label htmlFor={`${ID_PREFIX}-body`}>Body</label>
        <textarea rows={5} {...fieldProps('body')} />
        {fieldError('body')}
      </div>
      <div className="announcement-manager__field">
        <label htmlFor={`${ID_PREFIX}-category`}>Category</label>
        <select
          id={`${ID_PREFIX}-category`}
          value={values.category}
          onChange={(e) => set('category', e.target.value as AnnouncementInput['category'])}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="announcement-manager__field">
        <label htmlFor={`${ID_PREFIX}-status`}>Status</label>
        <select
          id={`${ID_PREFIX}-status`}
          value={values.status}
          onChange={(e) => set('status', e.target.value as AnnouncementInput['status'])}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
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
