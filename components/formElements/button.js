import classes from "./button.module.css";

const Button = (props) => {
  const {
    outline,
    variant,
    pill,
    sizeFit,
    className: additClasses,
    style: additStyles,
    disabled,
  } = props;
  const btnClasses = `${classes.btn} ${variant && classes[variant]}  ${
    outline && classes.outline
  } ${pill && classes.pill} ${sizeFit && classes.sizeFit} ${additClasses}`;

  return (
    <button
      onClick={props.onClick}
      className={btnClasses}
      style={additStyles}
      disabled={disabled ? true : false}
    >
      {props.children}
    </button>
  );
};

export default Button;
