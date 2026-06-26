const Overview = () => {
  return (
    <>
      <h1 className="text-heading font-sans font-bold text-text-inverse">
        Balance Overview
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <p className="text-sm text-text-muted mb-1">Total balance</p>
          <p className="text-2xl font-bold text-success-500">+ ₹1,250</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <p className="text-sm text-text-muted mb-1">You owe</p>
          <p className="text-2xl font-bold text-secondary-500">₹450</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <p className="text-sm text-text-muted mb-1">You are owed</p>
          <p className="text-2xl font-bold text-success-500">₹1,700</p>
        </div>
      </div>
    </>
  );
};

export default Overview;
