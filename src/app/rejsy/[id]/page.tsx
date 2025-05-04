import CruiseDetail from '../../../components/CruiseDetail';

export default function CruiseDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8 px-4">
      <CruiseDetail id={params.id} />
    </div>
  );
} 