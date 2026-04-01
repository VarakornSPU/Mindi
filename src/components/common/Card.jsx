function Card({
  actionLabel,
  description,
  eyebrow,
  icon,
  onClick,
  title,
}) {
  const cardClassName = `mindi-card ${onClick ? 'mindi-card--interactive' : ''}`.trim()

  const content = (
    <>
      {icon ? (
        <span className="mindi-card__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      <div className="mindi-card__content">
        {eyebrow ? <div className="mindi-card__eyebrow">{eyebrow}</div> : null}
        <h3 className="mindi-card__title">{title}</h3>
        <p className="mindi-card__description">{description}</p>
        {actionLabel ? (
          <span className="mindi-card__action">
            {actionLabel}
            <i className="bi bi-arrow-right-short" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button className={cardClassName} type="button" onClick={onClick}>
        {content}
      </button>
    )
  }

  return <article className={cardClassName}>{content}</article>
}

export default Card
