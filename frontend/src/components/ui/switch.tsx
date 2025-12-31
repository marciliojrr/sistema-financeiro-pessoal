import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (onCheckedChange) {
              onCheckedChange(e.target.checked);
          }
      }
      
    return (
      <label className="inline-flex items-center cursor-pointer relative">
        <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            {...props}
        />
        <div className={cn(
            "w-9 h-5 bg-input rounded-full peer peer-focus:ring-2 peer-focus:ring-ring focus-visible:outline-none transition-colors peer-checked:bg-primary",
             className
        )}>
             <div className={cn(
                 "absolute top-1 left-1 bg-background shadow-sm rounded-full h-3 w-3 transition-transform",
                 checked ? "translate-x-4" : "translate-x-0"
             )} />
        </div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
