import { useCallback, useEffect, useRef, useState } from 'react';
import { PIN_CODE, PIN_GATE_SUBTITLE, PIN_GATE_TITLE, PIN_LENGTH } from '../content';
import { HeartIcon } from './HeartIcon';

const STORAGE_KEY = 'for-you-my-love-unlocked';

export function isPinUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setPinUnlocked(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* private browsing */
  }
}

type PinGateProps = {
  onUnlock: () => void;
};

export function PinGate({ onUnlock }: PinGateProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const verify = useCallback(
    (values: string[]) => {
      const entered = values.join('');
      if (entered.length < PIN_LENGTH) return;

      if (entered === PIN_CODE) {
        setError(false);
        setSuccess(true);
        setPinUnlocked();
        window.setTimeout(onUnlock, 700);
      } else {
        setError(true);
        setDigits(Array(PIN_LENGTH).fill(''));
        window.setTimeout(() => {
          focusAt(0);
        }, 50);
        window.setTimeout(() => setError(false), 600);
      }
    },
    [onUnlock],
  );

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(false);

    if (digit && index < PIN_LENGTH - 1) {
      focusAt(index + 1);
    }

    if (digit && index === PIN_LENGTH - 1) {
      verify(next);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        focusAt(index - 1);
      }
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' && index > 0) focusAt(index - 1);
    if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) focusAt(index + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pasted) return;

    const next = Array(PIN_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusAt(Math.min(pasted.length, PIN_LENGTH - 1));
    if (pasted.length === PIN_LENGTH) verify(next);
  };

  useEffect(() => {
    focusAt(0);
  }, []);

  return (
    <div className={`pin-gate${success ? ' pin-gate--success' : ''}${error ? ' pin-gate--error' : ''}`}>
      <div className="pin-gate__hearts" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className="drift-heart"
            style={{
              left: `${10 + i * 11}%`,
              animationDelay: `${i * 2.1}s`,
              animationDuration: `${16 + (i % 3) * 2}s`,
              fontSize: `${0.7 + (i % 3) * 0.15}rem`,
            }}
          >
            ♥
          </span>
        ))}
      </div>

      <div className="pin-gate__card">
        <HeartIcon pulse size={28} className="pin-gate__icon" />
        <h1 className="pin-gate__title">{PIN_GATE_TITLE}</h1>
        <p className="pin-gate__subtitle">{PIN_GATE_SUBTITLE}</p>

        <div
          className="pin-gate__digits"
          role="group"
          aria-label="8-digit access code"
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              className="pin-gate__cell"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              aria-label={`Digit ${index + 1} of ${PIN_LENGTH}`}
              aria-invalid={error}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>

        <p className="pin-gate__hint" aria-live="polite">
          {error ? 'That code isn’t quite right — try again' : `${PIN_LENGTH} digits, just for you`}
        </p>
      </div>
    </div>
  );
}
