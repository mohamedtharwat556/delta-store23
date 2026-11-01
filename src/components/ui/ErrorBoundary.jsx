import { Component } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, Home, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // يبقى التفصيل في وحدة التحكم فقط، ولا يُعرض للعميل
    console.error('ErrorBoundary:', error, info?.componentStack ?? '')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className='container'>
        <section className='card error-state error-state--page' role='alert'>
          <CircleAlert size={22} aria-hidden='true' />
          <div>
            <h1>حدث خطأ في هذه الصفحة</h1>
            <p>
              المتجر ما زال يعمل محليًا على جهازك؛ لم تُفقد السلة أو الطلبات المسجّلة. أعد المحاولة أو
              ارجع إلى الرئيسية.
            </p>
            <div className='btn-row u-mt-3'>
              <button type='button' className='btn btn--primary' onClick={() => window.location.reload()}>
                <RotateCcw size={17} aria-hidden='true' /> إعادة المحاولة
              </button>
              <Link to='/' className='btn btn--ghost'>
                <Home size={17} aria-hidden='true' /> العودة للرئيسية
              </Link>
            </div>
            <details className='error-state__details'>
              <summary>تفاصيل للمطوّر</summary>
              <pre>{String(error?.message ?? error)}</pre>
            </details>
          </div>
        </section>
      </div>
    )
  }
}
