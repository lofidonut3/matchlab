import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

const typeStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: <Info className="w-5 h-5 text-blue-600" />,
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  success: {
    container: 'bg-success-50 border-success-200',
    icon: <CheckCircle className="w-5 h-5 text-success-600" />,
    title: 'text-success-800',
    text: 'text-success-700',
  },
  warning: {
    container: 'bg-warning-50 border-warning-200',
    icon: <AlertCircle className="w-5 h-5 text-warning-600" />,
    title: 'text-warning-800',
    text: 'text-warning-700',
  },
  error: {
    container: 'bg-danger-50 border-danger-200',
    icon: <XCircle className="w-5 h-5 text-danger-600" />,
    title: 'text-danger-800',
    text: 'text-danger-700',
  },
}

export default function Alert({ 
  type = 'info', 
  title, 
  children, 
  onClose,
  className = '' 
}: AlertProps) {
  const styles = typeStyles[type]

  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-1' : ''} text-sm ${styles.text}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-black/5 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
