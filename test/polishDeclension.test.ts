import { declineUnit } from '../src/utils/polishDeclension';

describe('declineUnit', () => {
  it('should decline "sztuki" correctly', () => {
    expect(declineUnit('sztuki', 1)).toBe('sztuka');
    expect(declineUnit('sztuki', 2)).toBe('sztuki');
    expect(declineUnit('sztuki', 3)).toBe('sztuki');
    expect(declineUnit('sztuki', 4)).toBe('sztuki');
    expect(declineUnit('sztuki', 5)).toBe('sztuk');
    expect(declineUnit('sztuki', 10)).toBe('sztuk');
    expect(declineUnit('sztuki', 11)).toBe('sztuk');
    expect(declineUnit('sztuki', 12)).toBe('sztuk'); // exception: 12 should be plural
    expect(declineUnit('sztuki', 13)).toBe('sztuk');
    expect(declineUnit('sztuki', 14)).toBe('sztuk');
    expect(declineUnit('sztuki', 15)).toBe('sztuk');
    expect(declineUnit('sztuki', 21)).toBe('sztuk');
    expect(declineUnit('sztuki', 22)).toBe('sztuki'); // 22 should be paucal
    expect(declineUnit('sztuki', 23)).toBe('sztuki');
    expect(declineUnit('sztuki', 24)).toBe('sztuki');
    expect(declineUnit('sztuki', 25)).toBe('sztuk');
    expect(declineUnit('sztuki', 51)).toBe('sztuk');
  });

  it('should decline "gramy" correctly', () => {
    expect(declineUnit('gramy', 1)).toBe('gram');
    expect(declineUnit('gramy', 2)).toBe('gramy');
    expect(declineUnit('gramy', 3)).toBe('gramy');
    expect(declineUnit('gramy', 4)).toBe('gramy');
    expect(declineUnit('gramy', 5)).toBe('gramów');
    expect(declineUnit('gramy', 10)).toBe('gramów');
    expect(declineUnit('gramy', 11)).toBe('gramów');
    expect(declineUnit('gramy', 12)).toBe('gramów');
    expect(declineUnit('gramy', 13)).toBe('gramów');
    expect(declineUnit('gramy', 14)).toBe('gramów');
    expect(declineUnit('gramy', 15)).toBe('gramów');
    expect(declineUnit('gramy', 21)).toBe('gramów');
    expect(declineUnit('gramy', 22)).toBe('gramy');
    expect(declineUnit('gramy', 23)).toBe('gramy');
    expect(declineUnit('gramy', 24)).toBe('gramy');
    expect(declineUnit('gramy', 25)).toBe('gramów');
    expect(declineUnit('gramy', 51)).toBe('gramów');
  });

  it('should decline "mililitry" correctly', () => {
    expect(declineUnit('mililitry', 1)).toBe('mililitr');
    expect(declineUnit('mililitry', 2)).toBe('mililitry');
    expect(declineUnit('mililitry', 3)).toBe('mililitry');
    expect(declineUnit('mililitry', 4)).toBe('mililitry');
    expect(declineUnit('mililitry', 5)).toBe('mililitrów');
    expect(declineUnit('mililitry', 10)).toBe('mililitrów');
    expect(declineUnit('mililitry', 11)).toBe('mililitrów');
    expect(declineUnit('mililitry', 12)).toBe('mililitrów');
    expect(declineUnit('mililitry', 13)).toBe('mililitrów');
    expect(declineUnit('mililitry', 14)).toBe('mililitrów');
    expect(declineUnit('mililitry', 15)).toBe('mililitrów');
    expect(declineUnit('mililitry', 21)).toBe('mililitrów');
    expect(declineUnit('mililitry', 22)).toBe('mililitry');
    expect(declineUnit('mililitry', 23)).toBe('mililitry');
    expect(declineUnit('mililitry', 24)).toBe('mililitry');
    expect(declineUnit('mililitry', 25)).toBe('mililitrów');
    expect(declineUnit('mililitry', 51)).toBe('mililitrów');
  });

  it('should decline "załogant" correctly', () => {
    expect(declineUnit('załogant', 1)).toBe('załogant');
    expect(declineUnit('załogant', 2)).toBe('załoganci');
    expect(declineUnit('załogant', 3)).toBe('załoganci');
    expect(declineUnit('załogant', 4)).toBe('załoganci');
    expect(declineUnit('załogant', 5)).toBe('załogantów');
    expect(declineUnit('załogant', 10)).toBe('załogantów');
    expect(declineUnit('załogant', 11)).toBe('załogantów');
    expect(declineUnit('załogant', 12)).toBe('załogantów');
    expect(declineUnit('załogant', 13)).toBe('załogantów');
    expect(declineUnit('załogant', 14)).toBe('załogantów');
    expect(declineUnit('załogant', 15)).toBe('załogantów');
    expect(declineUnit('załogant', 21)).toBe('załogantów');
    expect(declineUnit('załogant', 22)).toBe('załoganci');
    expect(declineUnit('załogant', 23)).toBe('załoganci');
    expect(declineUnit('załogant', 24)).toBe('załoganci');
    expect(declineUnit('załogant', 25)).toBe('załogantów');
    expect(declineUnit('załogant', 51)).toBe('załogantów');
  });

  it('should return unit as is if not defined', () => {
    expect(declineUnit('unknown', 1)).toBe('unknown');
  });
});
