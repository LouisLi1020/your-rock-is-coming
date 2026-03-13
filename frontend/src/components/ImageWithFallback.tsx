import { useState } from 'react'

const FALLBACK_SVG =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjZTRlNWViIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
}

export function ImageWithFallback({ src, alt, className, ...rest }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className ?? ''}`}
      >
        <img src={FALLBACK_SVG} alt="" aria-hidden className="w-12 h-12 opacity-50" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  )
}
