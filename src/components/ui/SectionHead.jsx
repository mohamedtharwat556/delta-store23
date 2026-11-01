export default function SectionHead({ title, subtitle, action }) {
  return (
    <div className='section__head'>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p className='section__subtitle'>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
