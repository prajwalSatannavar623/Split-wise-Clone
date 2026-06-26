const Input = ({
  onChange = () => {},
  value,
  label,
  id,
  className = "",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-1/2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-inverse">
          {label}
        </label>
      )}

      <input
        onChange={(e) => onChange(e.target.value)}
        value={value}
        id={id}
        className={`
          w-full px-4 py-2 border rounded-lg outline-none transition-all
          border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export default Input;
