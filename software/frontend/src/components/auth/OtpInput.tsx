import { useRef } from 'react'

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  onComplete?: (value: string) => void
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  onComplete,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  function buildNextValue(current: string, index: number, digit: string) {
    const chars = Array.from({ length }, (_, i) => current[i] ?? '')
    chars[index] = digit
    return chars.join('')
  }

  function maybeComplete(nextValue: string) {
    const normalized = nextValue.replace(/\D/g, '').slice(0, length)
    if (normalized.length === length && onComplete) {
      onComplete(normalized)
    }
  }

  function handleChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, '').slice(-1)
    const next = buildNextValue(value, index, digit)
    onChange(next)

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    maybeComplete(next)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()

      if (value[index]) {
        const next = buildNextValue(value, index, '')
        onChange(next)
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus()
        const next = buildNextValue(value, index - 1, '')
        onChange(next)
      }
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputsRef.current[index - 1]?.focus()
    }

    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return

    onChange(pasted)
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus()
    maybeComplete(pasted)
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label={`Código OTP de ${length} dígitos`}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[index] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={`Dígito ${index + 1}`}
          className="h-12 w-12 rounded-md border border-slate-300 bg-background text-center text-lg font-semibold outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-200 disabled:opacity-50 dark:border-slate-700 dark:focus:border-green-500 dark:focus:ring-green-900/40"
        />
      ))}
    </div>
  )
}