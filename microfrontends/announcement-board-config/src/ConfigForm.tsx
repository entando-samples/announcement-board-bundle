import { CATEGORY_OPTIONS, type BoardParams, type ParamErrors, type ParamName } from './params';

interface ConfigFormProps {
  values: BoardParams;
  errors: ParamErrors;
  onChange: (name: ParamName, value: string) => void;
}

const ID_PREFIX = 'announcement-board-config';

export default function ConfigForm({ values, errors, onChange }: ConfigFormProps) {
  const describedBy = (name: ParamName) => (errors[name] ? `${ID_PREFIX}-${name}-error` : undefined);
  const error = (name: ParamName) =>
    errors[name] && (
      <span id={`${ID_PREFIX}-${name}-error`} className="announcement-board-config__error">
        {errors[name]}
      </span>
    );

  return (
    <fieldset className="announcement-board-config">
      <legend>Announcement Board settings</legend>
      <div className="announcement-board-config__field">
        <label htmlFor={`${ID_PREFIX}-boardTitle`}>Title</label>
        <input
          id={`${ID_PREFIX}-boardTitle`}
          value={values.boardTitle}
          maxLength={100}
          onChange={(e) => onChange('boardTitle', e.target.value)}
          aria-invalid={Boolean(errors.boardTitle)}
          aria-describedby={describedBy('boardTitle')}
        />
        {error('boardTitle')}
      </div>
      <div className="announcement-board-config__field">
        <label htmlFor={`${ID_PREFIX}-pageSize`}>Results per page (1–50)</label>
        <input
          id={`${ID_PREFIX}-pageSize`}
          type="number"
          min={1}
          max={50}
          value={values.pageSize}
          onChange={(e) => onChange('pageSize', e.target.value)}
          aria-invalid={Boolean(errors.pageSize)}
          aria-describedby={describedBy('pageSize')}
        />
        {error('pageSize')}
      </div>
      <div className="announcement-board-config__field">
        <label htmlFor={`${ID_PREFIX}-defaultCategory`}>Default category</label>
        <select
          id={`${ID_PREFIX}-defaultCategory`}
          value={values.defaultCategory}
          onChange={(e) => onChange('defaultCategory', e.target.value)}
          aria-invalid={Boolean(errors.defaultCategory)}
          aria-describedby={describedBy('defaultCategory')}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All categories' : option}
            </option>
          ))}
        </select>
        {error('defaultCategory')}
      </div>
      <div className="announcement-board-config__field announcement-board-config__field--inline">
        <input
          id={`${ID_PREFIX}-showSearchBox`}
          type="checkbox"
          checked={values.showSearchBox === 'true'}
          onChange={(e) => onChange('showSearchBox', String(e.target.checked))}
        />
        <label htmlFor={`${ID_PREFIX}-showSearchBox`}>Show the free-text search box</label>
      </div>
      {Object.keys(errors).length > 0 && (
        <p className="announcement-board-config__notice" role="status">
          Invalid values are not saved: the previously saved value is kept.
        </p>
      )}
    </fieldset>
  );
}
