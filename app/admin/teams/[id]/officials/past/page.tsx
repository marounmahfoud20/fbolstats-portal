export default async function PastOfficialsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <div className="p-6">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Past Officials (Team ID: {params.id})</h1>
      </div>
      <div className="bg-white border border-[#040f4f] p-4 text-[#040f4f]">
        This page will show all past officials for the club.
      </div>
    </div>
  );
}
