import { Link } from "react-router-dom";

const Button = ({
  children,
  to,
  onClick,
  type = "button",
  className = "",
  variant = "primary",
  ...props
}) => {
  const baseStyles =
    "px-6 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 hover:cursor-pointer";

  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700",
    secondary: "bg-secondary-500 text-white hover:bg-secondary-600",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
  };

  if (to && type !== "submit") {
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]} ${className} ${props}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className} ${props}`}
    >
      {children}
    </button>
  );
};

export default Button;
