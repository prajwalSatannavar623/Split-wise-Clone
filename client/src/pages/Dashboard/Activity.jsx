import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { apiClient } from "../../api/axios.js";

const Activity = () => {
  const currentUser = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState("all"); // "all", "paid", or "owed"
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Send the type as a query parameter (empty string for 'all')
        const typeQuery = activeTab === "all" ? "" : `?type=${activeTab}`;
        const response = await apiClient.get(`/expenses/user/me${typeQuery}`);

        setExpenses(response.data.data.expenses);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load activity.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [activeTab]); // Refetch whenever the tab changes

  return (
    <div className="flex flex-col gap-6 max-w-4xl pb-12">
      <div className="flex flex-col gap-2 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-text-inverse">
          Recent Activity
        </h1>
        <p className="text-text-muted">
          Track all your interactions across your groups.
        </p>
      </div>

      {/* --- FILTER TABS --- */}
      <div className="flex gap-4 p-1 bg-gray-900/50 rounded-lg w-fit border border-gray-800">
        {["all", "paid", "owed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-md text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- ERROR / LOADING STATES --- */}
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4 animate-pulse mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-800/50 rounded-xl border border-gray-800"
            ></div>
          ))}
        </div>
      ) : (
        /* --- EXPENSE LIST --- */
        <div className="flex flex-col gap-4 mt-2">
          {expenses.length > 0 ? (
            expenses.map((expense) => {
              // Logic for "You" vs "Other Person"
              const isPaidByMe = expense.paidBy?._id === currentUser?._id;
              const paidByName = isPaidByMe ? "You" : expense.paidBy?.fullName;
              const amountColor = isPaidByMe
                ? "text-green-400"
                : "text-red-400";
              const dateAdded = new Date(expense.createdAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              );

              return (
                <div
                  key={expense._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-800/30 border border-gray-800 rounded-xl hover:bg-gray-800/60 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    {/* Group Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gray-700 text-gray-300 font-semibold w-fit">
                        {expense.group?.name || "Unknown Group"}
                      </span>
                      <span className="text-xs text-gray-500">{dateAdded}</span>
                    </div>

                    {/* Expense Details */}
                    <div>
                      <p className="text-lg font-medium text-text-inverse leading-tight">
                        {expense.description}
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        Paid by{" "}
                        <span
                          className={
                            isPaidByMe
                              ? "text-primary-400 font-medium"
                              : "text-gray-300 font-medium"
                          }
                        >
                          {paidByName}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Amount Display */}
                  <div className={`text-2xl font-bold ${amountColor} shrink-0`}>
                    {expense.currencyType === "USD" ? "$" : "₹"}
                    {expense.amount}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
              <span className="text-4xl mb-3">👻</span>
              <p className="text-text-muted font-medium">
                No activity found here.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Time to go split a bill!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Activity;
