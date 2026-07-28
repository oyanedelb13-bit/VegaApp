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
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
      >
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10) || 0;
          onChange(Math.min(max, Math.max(min, val)));
        }}
        className="stepper-input"
      />
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
