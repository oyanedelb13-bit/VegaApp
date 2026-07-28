import './Input.css';

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`input-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${icon ? 'has-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  rows = 4,
  className = ''
}) {
  return (
    <div className={`input-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="input-field textarea-field"
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  error,
  disabled = false,
  className = ''
}) {
  return (
    <div className={`input-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="input-field select-field"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1 }) {
  const displayValue = value === '' || value === undefined ? '' : value;

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, (Number(value) || 0) - step))}
        disabled={(Number(value) || 0) <= min}
      >
        -
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange('');
          } else {
            const val = parseInt(raw, 10);
            if (!isNaN(val)) onChange(Math.min(max, Math.max(min, val)));
          }
        }}
        onBlur={() => {
          if (value === '' || value === undefined) onChange(min);
        }}
        className="stepper-input"
      />
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, (Number(value) || 0) + step))}
        disabled={(Number(value) || 0) >= max}
      >
        +
      </button>
    </div>
  );
}
