import { useEffect, useState } from "react";
import { apiClient } from "../../api/axios.js";

const Overview = () => {
  const [totalBalance, setTotalExpense] = useState("");
  const [oweAmount, setOweAmount] = useState("");
  const [owedAmount, setOwedAmount] = useState("");

  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getBalanceOverview = async () => {
      setIsloading(true);
      setError(null);

      try {
        const response = await apiClient.get("/settlements/me/balances");

        const { netBalance, totalOwed, totalOwes } = response.data.data;

        setTotalExpense(netBalance);
        setOweAmount(totalOwes);
        setOwedAmount(totalOwed);

        console.log("Success:", response.data);
      } catch (err) {
        const backendErrorMessage =
          err.response?.data?.message || "Failed to load balances.";
        setError(backendErrorMessage);
      } finally {
        setIsloading(false);
      }
    };
    getBalanceOverview();
  }, []);

  if (isLoading) {
    return <div className="text-text-muted">Loading balances...</div>;
  }

  return (
    <>
      <h1 className="text-heading font-sans font-bold text-text-inverse">
        Balance Overview
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <p className="text-sm text-text-muted mb-1">Total balance</p>
          <p
            className={`text-2xl font-bold ${totalBalance > 0 ? "text-success-500" : "text-red-500"}`}
          >
            ₹ {totalBalance}
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <p className="text-sm text-text-muted mb-1">You owe</p>
          <p className="text-2xl font-bold text-red-500">₹{oweAmount}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <p className="text-sm text-text-muted mb-1">You are owed</p>
          <p className="text-2xl font-bold text-success-500">₹{owedAmount}</p>
        </div>
      </div>
      {error && (
        <div className="p-3 bg-red-500/10 text-secondary-600 border border-secondary-500 rounded-lg text-base text-center transition-all">
          {error}
        </div>
      )}
    </>
  );
};

export default Overview;
