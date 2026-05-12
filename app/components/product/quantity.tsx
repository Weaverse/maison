import { useEffect, useState } from "react";

interface QuantityProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export function Quantity(props: QuantityProps) {
  const { value, onChange, label = "Quantity", min = 1, max } = props;
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    let newValue = Number.parseInt(inputValue, 10);
    if (Number.isNaN(newValue) || newValue < min) {
      newValue = min;
    } else if (max && newValue > max) {
      newValue = max;
    }

    if (newValue !== value) {
      onChange(newValue);
    } else {
      setInputValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="space-y-1.5" data-motion="fade-up">
      <legend className="font-bold leading-tight">{label}</legend>
      <div className="w-fit border border-line flex items-center">
        <button
          type="button"
          name="decrease-quantity"
          aria-label="Decrease quantity"
          className="h-10 w-10 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <span className="text-xl leading-none">&#8722;</span>
        </button>
        <input
          type="number"
          className="w-12 px-1 h-10 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
        />
        <button
          type="button"
          className="h-10 w-10 text-body transition hover:text-body flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          name="increase-quantity"
          aria-label="Increase quantity"
          disabled={max !== undefined && value >= max}
          onClick={() => onChange(value + 1)}
        >
          <span className="text-xl leading-none">&#43;</span>
        </button>
      </div>
    </div>
  );
}
