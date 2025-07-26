import React, { useState } from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ValidatedInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => boolean;
  };
  showValidation?: boolean;
  autoFormat?: 'phone' | 'none';
}

export function ValidatedInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  validation,
  showValidation = true,
  autoFormat = 'none',
}: ValidatedInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const formatPhone = (phoneValue: string) => {
    const numbers = phoneValue.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{0,9})/, '($1) $2');
    }
    return numbers.slice(0, 11).replace(/(\d{2})(\d{0,9})/, '($1) $2');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (autoFormat === 'phone') {
      newValue = formatPhone(newValue);
    }
    
    onChange(newValue);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const isValid = () => {
    if (!value && required) return false;
    if (!value) return true; // Not required and empty is valid
    
    if (validation?.minLength && value.length < validation.minLength) return false;
    if (validation?.pattern && !validation.pattern.test(value)) return false;
    if (validation?.custom && !validation.custom(value)) return false;
    
    return true;
  };

  const shouldShowValidation = showValidation && touched && value;
  const valid = isValid();

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "pr-10 transition-colors",
            shouldShowValidation && (
              valid ? "border-green-500 focus:border-green-500" : "border-red-500 focus:border-red-500"
            )
          )}
        />
        
        {/* Password visibility toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-8 top-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        
        {/* Validation indicator */}
        {shouldShowValidation && (
          <div className="absolute right-3 top-3">
            {valid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Validation messages */}
      {shouldShowValidation && !valid && (
        <div className="text-sm text-red-500">
          {!value && required && "Este campo é obrigatório"}
          {value && validation?.minLength && value.length < validation.minLength && 
            `Mínimo de ${validation.minLength} caracteres`}
          {value && validation?.pattern && !validation.pattern.test(value) && 
            "Formato inválido"}
        </div>
      )}
      
      {/* Success message */}
      {shouldShowValidation && valid && (
        <div className="text-sm text-green-500">
          ✓ Válido
        </div>
      )}
    </div>
  );
}

// Password strength indicator
export function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const strengthLabels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Muito boa'];
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < strength ? strengthColors[strength - 1] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Força: {strengthLabels[strength - 1] || 'Muito fraca'}
      </p>
    </div>
  );
}