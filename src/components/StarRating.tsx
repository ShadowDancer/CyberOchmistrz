interface StarRatingProps {
  score: number;
  size?: 'small' | 'large';
  className?: string;
}

export default function StarRating({ score, size = 'large', className = '' }: StarRatingProps) {
  const starClass = size === 'small'
    ? 'text-sm'
    : 'text-md md:text-xl';

  const emptyStarClass = size === 'small'
    ? 'text-gray-200'
    : 'text-gray-300';

  return (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`${starClass} ${star <= score ? 'text-yellow-400' : emptyStarClass}`}>
          ★
        </span>
      ))}
    </div>
  );
}
