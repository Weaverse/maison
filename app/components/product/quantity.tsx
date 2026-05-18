import { useEffect, useState } from "react";

interface QuantityProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function Quantity(props: QuantityProps) {
  const { value, onChange, label = "Quantity" } = props;
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newQuantity = Number.parseInt(inputValue, 10);
    if (Number.isNaN(newQuantity)) {
      newQuantity = value;
    }
    newQuantity = Math.max(1, newQuantity);
    setInputValue(String(newQuantity));
    if (newQuantity !== value) {
      onChange(newQuantity);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setInputValue(String(value));
      (e.target as HTMLInputElement).blur();
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
          className="h-10 w-10 transition disabled:cursor-not-allowed disabled:opacity-50"
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
        >
          <span>&#8722;</span>
        </button>
        <input
          type="number"
          className="w-12 px-1 py-2.5 text-center focus:outline-none bg-transparent"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          min={1}
        />
        <button
          type="button"
          className="h-10 w-10 text-body transition hover:text-body"
          name="increase-quantity"
          aria-label="Increase quantity"
          onClick={() => onChange(value + 1)}
        >
          <span>&#43;</span>
        </button>
      </div>
    </div>
  );
}
