import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiClient } from "../../api/axios.js";

const ExpenseDetails = () => {
  const { expenseId } = useParams();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);

  const [expense, setExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Assuming your backend has an endpoint to get a single expense by ID
        const response = await apiClient.get(`/expenses/${expenseId}`);
        setExpense(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load expense details.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenseDetails();
  }, [expenseId]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl flex flex-col gap-4 animate-pulse">
        <div className="h-4 w-16 bg-gray-700 rounded mb-4"></div>
        <div className="h-64 bg-gray-800/40 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl flex flex-col gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-500 hover:text-primary-400 text-sm"
        >
          ← Back
        </button>
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!expense) return null;

  const currencySymbol = expense.currencyType === "USD" ? "$" : "₹";
  const totalAmount = Number(expense.amount).toFixed(2);
  const categoryInitial = expense.category
    ? expense.category.charAt(0).toUpperCase()
    : "O";

  // Format the date nicely
  const formattedDate = new Date(
    expense.createdAt || expense.date,
  ).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-2xl flex flex-col gap-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="text-primary-500 hover:text-primary-400 text-sm font-medium flex items-center gap-1 w-fit transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to Group
      </button>

      {/* Main Card */}
      <div className="flex flex-col bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
        {/* Top Section: Icon, Title, and Amount */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 border-b border-gray-800 bg-gray-800/60">
          <div className="w-20 h-20 rounded-2xl bg-gray-700/80 border-2 border-gray-600 flex items-center justify-center font-bold text-4xl text-gray-300 shadow-inner shrink-0">
            {categoryInitial}
          </div>

          <div className="flex flex-col items-center sm:items-start flex-1 text-center sm:text-left gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-inverse leading-tight">
              {expense.description}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black text-white tracking-tight">
                {currencySymbol}
                {totalAmount}
              </span>
            </div>
            <p className="text-sm text-text-muted mt-2">
              Added on {formattedDate}
            </p>
          </div>
        </div>

        {/* Middle Section: Who Paid */}
        <div className="p-6 sm:p-8 border-b border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 overflow-hidden flex items-center justify-center text-white shrink-0">
            {expense.paidBy?.avatar ? (
              <img
                src={expense.paidBy.avatar}
                alt="Payer avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              expense.paidBy?.fullName?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-text-inverse font-medium text-lg">
              {expense.paidBy?._id === currentUser?._id
                ? "You"
                : expense.paidBy?.fullName}{" "}
              paid {currencySymbol}
              {totalAmount}
            </span>
            <span className="text-sm text-text-muted">
              and split it{" "}
              {expense.splitInfo?.length > 0
                ? "among the group"
                : "with nobody"}
            </span>
          </div>
        </div>

        {/* Bottom Section: Split Breakdown */}
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Split Details
          </h3>

          <div className="flex flex-col gap-3">
            {expense.splitInfo?.map((split) => {
              const user = split.userId;
              if (!user) return null; // Safety check

              const isMe = user._id === currentUser?._id;
              const shareAmount = Number(split.shareAmount).toFixed(2);

              // Highlight the row slightly if it's the current user
              return (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-3 rounded-lg ${isMe ? "bg-primary-500/10 border border-primary-500/20" : "hover:bg-gray-800/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 overflow-hidden flex items-center justify-center text-xs text-white shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.fullName?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <span
                      className={`font-medium ${isMe ? "text-primary-400 font-bold" : "text-text-inverse"}`}
                    >
                      {isMe ? "You" : user.fullName}
                    </span>
                  </div>

                  <div
                    className={`font-bold ${isMe ? "text-primary-400" : "text-gray-300"}`}
                  >
                    {currencySymbol}
                    {shareAmount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetails;
