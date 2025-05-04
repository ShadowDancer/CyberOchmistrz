import CruiseDetail from '../../../components/CruiseDetail';

export default async function CruiseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = (await params).id;
  return (
    <div className="container mx-auto py-8 px-4">
      <CruiseDetail id={id} />
    </div>
  );
} 

export async function generateStaticParams() {
  // Temporary return empty object to avoid errors during static generation
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}

