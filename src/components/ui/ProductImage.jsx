import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function ProductImage({ src, alt, ratio = 'square', className = '', priority = false }) {
  const [status, setStatus] = useState(() => (src ? 'loading' : 'empty'))

  return (
    <div className={`product-image product-image--${ratio} ${className}`}>
      {status === 'loading' ? <span className='product-image__skeleton' aria-hidden='true' /> : null}
      {status === 'empty' || status === 'error' ? (
        <span className='product-image__fallback'>
          <ImageOff size={24} aria-hidden='true' />
          <span>{status === 'empty' ? 'بلا صورة بعد' : 'صورة غير متاحة'}</span>
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding='async'
          className={status === 'loaded' ? 'is-loaded' : 'is-pending'}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  )
}
