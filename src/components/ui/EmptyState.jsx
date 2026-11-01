export default function EmptyState({ title, hint, action, icon: Icon }) {
  return (
    <div className='empty-state'>
      {Icon ? (
        <span className='empty-state__icon'>
          <Icon size={26} aria-hidden='true' />
        </span>
      ) : null}
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
      {action ? <div className='empty-state__action'>{action}</div> : null}
    </div>
  )
}
