import { ReactNode } from 'react'

interface WidgetProps {
  title?: string
  children: ReactNode
  className?: string
}

export default function Widget({ title, children, className = '' }: WidgetProps) {
  return (
    <div className={`widget ${className}`}>
      {title && (
        <div className="widget-title">
          {title}
        </div>
      )}
      <div className="widget-content">
        {children}
      </div>
    </div>
  )
}
