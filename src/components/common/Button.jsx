function Button({
  as: Component = 'button',
  children,
  className = '',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const buttonClassName = [
    'mindi-button',
    `mindi-button--${variant}`,
    fullWidth ? 'mindi-button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const iconNode = icon ? (
    <span className="mindi-button__icon" aria-hidden="true">
      {icon}
    </span>
  ) : null

  return (
    <Component
      className={buttonClassName}
      type={Component === 'button' ? type : undefined}
      {...props}
    >
      {iconPosition === 'left' ? iconNode : null}
      <span>{children}</span>
      {iconPosition === 'right' ? iconNode : null}
    </Component>
  )
}

export default Button
