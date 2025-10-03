'use client';

import { Supply } from '../types';

interface IngredientAmountEditorProps {
  value: number;
  onChange: (value: number) => void;
  supply: Supply;
  step?: number;
  immediate?: boolean; // If false, changes are not immediate (for forms with save buttons)
}

export default function IngredientAmountEditor({
  value,
  onChange,
  supply,
  step
}: IngredientAmountEditorProps) {
  const defaultStep = supply.isIngredient ? 0.1 : 1;
  const actualStep = step ?? defaultStep;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(Math.max(0, newValue));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        step={actualStep}
        value={value}
        onChange={handleInputChange}
        className="input-simple text-center w-20 px-2 py-1"
      />
      <span className="text-sm text-muted-dark min-w-fit">
        {supply.unit}
      </span>
    </div>
  );
}
