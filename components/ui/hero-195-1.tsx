import * as React from "react"
import { cn } from "@/lib/utils"

interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  description?: string
  primaryAction?: {
    text: string
    onClick: () => void
  }
  secondaryAction?: {
    text: string
    onClick: () => void
  }
  backgroundImage?: string
  gradient?: boolean
}

const Hero195 = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ 
    className, 
    title = "Master SSAT & SAT",
    subtitle = "AI-Powered Learning Platform",
    description = "Personalized study plans, adaptive questions, and intelligent feedback to help you achieve your target score.",
    primaryAction,
    secondaryAction,
    backgroundImage,
    gradient = true,
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-xl",
        gradient && "bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800",
        !gradient && "bg-gray-900",
        className
      )}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      {...props}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Content */}
      <div className="relative z-10 flex max-w-4xl flex-col items-center px-6 text-center">
        {/* Subtitle */}
        {subtitle && (
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-white/80">
            {subtitle}
          </p>
        )}
        
        {/* Title */}
        {title && (
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            {title}
          </h1>
        )}
        
        {/* Description */}
        {description && (
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            {description}
          </p>
        )}
        
        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white px-8 py-4 text-base font-bold leading-normal tracking-wide text-gray-900 shadow-lg transition-all duration-200 hover:bg-gray-100 hover:shadow-xl"
              >
                {primaryAction.text}
              </button>
            )}
            
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-bold leading-normal tracking-wide text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/50"
              >
                {secondaryAction.text}
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
    </div>
  )
)
Hero195.displayName = "Hero195"

export { Hero195 }
