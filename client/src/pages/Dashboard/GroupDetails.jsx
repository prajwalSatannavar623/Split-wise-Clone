import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiClient } from "../../api/axios.js";
import Button from "../../components/Button.jsx";

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);

  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("expenses");
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/groups/${groupId}`);
      setGroup(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load group details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // Authorization checks
  const isAdmin = group?.admin === currentUser?._id;

  if (isLoading)
    return (
      <div className="p-8 text-text-muted animate-pulse">Loading group...</div>
    );
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!group) return null;

  return (
    <div className="flex flex-col gap-8 max-w-4xl pb-24">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 bg-gray-800/40 border border-gray-700 rounded-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 text-[120px] font-black text-gray-800/20 select-none pointer-events-none">
          {group.name?.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col gap-2 z-10">
          <h1 className="text-3xl font-bold text-text-inverse">{group.name}</h1>
          <p className="text-text-muted">{group.description}</p>

          <div
            onClick={() => setIsMembersModalOpen(true)}
            className="mt-2 text-sm text-primary-500 hover:text-primary-400 cursor-pointer w-fit transition-colors flex items-center gap-1"
          >
            <span>👥</span> {group.members?.length || 0} Members
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-3 mt-4 md:mt-0 z-10">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 bg-gray-900/50"
            >
              Edit Group
            </Button>
            <Button variant="primary">+ Add Member</Button>
          </div>
        )}
      </div>

      {/* --- MAIN SECTION (TABS) --- */}
      <div className="flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "expenses"
                ? "text-primary-500 border-b-2 border-primary-500"
                : "text-text-muted hover:text-text-inverse"
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab("balances")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "balances"
                ? "text-primary-500 border-b-2 border-primary-500"
                : "text-text-muted hover:text-text-inverse"
            }`}
          >
            Balances
          </button>
        </div>

        {/* Tab Content: EXPENSES */}
        {activeTab === "expenses" && (
          <div className="flex flex-col gap-3">
            {group.expenses?.length > 0 ? (
              group.expenses.map((expense) => {
                const isPaidByMe = expense.paidBy?._id === currentUser?._id;
                const paidByName = isPaidByMe
                  ? "You"
                  : expense.paidBy?.fullName;
                const canEdit = isPaidByMe || isAdmin;
                const currencySymbol =
                  expense.currencyType === "USD" ? "$" : "₹";
                const totalAmount = Number(expense.amount);

                // --- NEW LOGIC: CALCULATE USER SHARE ---
                // Find my specific split inside the expense
                const mySplit = expense.splitInfo?.find(
                  (split) =>
                    (split.userId?._id || split.userId) === currentUser?._id,
                );
                const myShareAmount = mySplit ? Number(mySplit.shareAmount) : 0;

                // Determine the display text and colors for the share
                let shareText = "Not involved";
                let shareColor = "text-gray-500";
                let shareValue = null;

                if (isPaidByMe) {
                  const lentAmount = totalAmount - myShareAmount;
                  if (lentAmount > 0) {
                    shareText = "you lent";
                    shareColor = "text-green-400";
                    shareValue = lentAmount.toFixed(2);
                  } else {
                    shareText = "you paid for yourself";
                    shareColor = "text-gray-400";
                  }
                } else if (myShareAmount > 0) {
                  shareText = "you borrowed";
                  shareColor = "text-red-400";
                  shareValue = myShareAmount.toFixed(2);
                }

                const categoryInitial = expense.category
                  ? expense.category.charAt(0).toUpperCase()
                  : "O";

                return (
                  <div
                    key={expense._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-800/20 border border-gray-800 rounded-lg hover:bg-gray-800/40 transition-colors group"
                  >
                    {/* Left Side: Icon & Details */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gray-700/50 border border-gray-600 flex items-center justify-center font-bold text-xl text-gray-300 shrink-0">
                        {categoryInitial}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="text-text-inverse font-medium text-lg leading-none">
                            {expense.description}
                          </p>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gray-700 text-gray-300 leading-none">
                            {expense.category?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted">
                          <span className="font-medium text-gray-300">
                            {paidByName}
                          </span>{" "}
                          paid{" "}
                          <span className="font-medium text-gray-300">
                            {currencySymbol}
                            {totalAmount.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Your Share & Edit */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      {/* --- NEW SHARE DISPLAY --- */}
                      <div className="flex flex-col items-start sm:items-end min-w-25">
                        <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                          {shareText}
                        </span>
                        {shareValue && (
                          <div
                            className={`text-lg font-bold ${shareColor} leading-tight`}
                          >
                            {currencySymbol}
                            {shareValue}
                          </div>
                        )}
                      </div>

                      {/* Edit Button */}
                      {canEdit && (
                        <button
                          onClick={() =>
                            navigate(`/dashboard/expenses/edit/${expense._id}`)
                          }
                          className="text-gray-500 hover:text-primary-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100 p-2"
                          title="Edit Expense"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
                <p className="text-text-muted mb-2">No expenses yet.</p>
                <p className="text-sm text-gray-500">
                  Click the button below to add the first expense!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: BALANCES */}
        {activeTab === "balances" && (
          <div className="flex flex-col gap-3">
            {group.balances?.length > 0 ? (
              group.balances.map((balance) => {
                // Determine the color based on current user's involvement
                let amountColor = "text-orange-400"; // Default: not involved

                if (currentUser?._id === balance.from?._id) {
                  amountColor = "text-red-400"; // You owe someone
                } else if (currentUser?._id === balance.to?._id) {
                  amountColor = "text-green-400"; // Someone owes you
                }

                return (
                  <div
                    key={balance._id}
                    className="flex items-center gap-4 p-4 bg-gray-800/20 border border-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gray-700 text-xs flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-gray-600">
                        {balance.from?.avatar ? (
                          <img
                            src={balance.from.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          balance.from?.fullName?.charAt(0) || "U"
                        )}
                      </div>
                      <span className="text-text-inverse font-medium truncate">
                        {balance.from?.fullName}
                      </span>
                    </div>

                    <div className="text-sm text-text-muted shrink-0 uppercase tracking-widest text-[10px]">
                      owes
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-text-inverse font-medium truncate">
                        {balance.to?.fullName}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gray-700 text-xs flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                        {balance.to?.avatar ? (
                          <img
                            src={balance.to.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          balance.to?.fullName?.charAt(0)
                        )}
                      </div>
                    </div>

                    {/* Apply the dynamic color here */}
                    <div
                      className={`w-24 text-right font-bold shrink-0 ${amountColor}`}
                    >
                      ₹{balance.amount}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-text-muted py-8 text-center border border-dashed border-gray-800 rounded-xl">
                All balances are settled up!
              </p>
            )}
          </div>
        )}
      </div>

      {/* --- MEMBERS MODAL --- */}
      {isMembersModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsMembersModalOpen(false)}
        >
          <div
            className="bg-bg-dark border border-gray-700 rounded-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
              <h3 className="text-lg font-bold text-text-inverse">
                Group Members ({group.members?.length})
              </h3>
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col max-h-[60vh] overflow-y-auto p-4 gap-2">
              {group.members?.map((member) => (
                <div
                  key={member._id}
                  onClick={() => navigate(`/dashboard/members/${member._id}`)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-gray-600">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.fullName.charAt(0)
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-text-inverse font-medium truncate flex items-center gap-2">
                      {member.fullName}
                      {member._id === group.admin && (
                        <span className="text-[10px] uppercase tracking-wider bg-primary-500/20 text-primary-500 px-2 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-text-muted truncate">
                      @{member.userName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING ACTION BUTTON (Add Expense) --- */}
      <button
        onClick={() => navigate(`/dashboard/groups/${groupId}/add-expense`)}
        className="fixed bottom-10 right-10 flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-4 rounded-full shadow-lg shadow-primary-500/30 transition-all hover:scale-105 z-40 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="font-semibold hidden sm:block">Add Expense</span>
      </button>
    </div>
  );
};

export default GroupDetails;
