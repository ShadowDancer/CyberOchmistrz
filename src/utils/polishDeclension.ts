interface DeclensionForms {
  singular: string;
  paucal: string;
  plural: string;
}

const unitDeclensions: Record<string, DeclensionForms> = {
  'sztuki': { singular: 'sztuka', paucal: 'sztuki', plural: 'sztuk' },
  'gramy': { singular: 'gram', paucal: 'gramy', plural: 'gramów' },
  'mililitry': { singular: 'mililitr', paucal: 'mililitry', plural: 'mililitrów' },
  'ząbki': { singular: 'ząbek', paucal: 'ząbki', plural: 'ząbków' },
  'rolki': { singular: 'rolka', paucal: 'rolki', plural: 'rolek' },
  'tabliczka': { singular: 'tabliczka', paucal: 'tabliczki', plural: 'tabliczek' },
  'załogant': { singular: 'załogant', paucal: 'załoganci', plural: 'załogantów' },
};

export function declineUnit(unit: string, amount: number): string {
  const declension = unitDeclensions[unit];
  if (!declension) {
    return unit; // fallback to original unit if not defined
  }

  const absAmount = Math.abs(amount);
  const lastDigit = absAmount % 10;
  const lastTwoDigits = absAmount % 100;

  if (absAmount === 1) {
    return declension.singular;
  } else if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 10 && lastTwoDigits <= 14)) {
    return declension.paucal;
  } else {
    return declension.plural;
  }
}
