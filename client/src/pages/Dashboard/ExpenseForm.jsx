import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiClient } from "../../api/axios.js";
import Button from "../../components/Button.jsx";

const CATEGORIES = [
  "FOOD AND DRINKS",
  "GROCERIES",
  "STAY",
  "HOME",
  "TRANSPORTATION",
  "ENTERTAINMENT",
  "MUSIC",
  "GAS",
  "CLOTHING",
  "OTHER",
];

const ExpenseForm = () => {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const isEditMode = Boolean(expenseId);

  // form states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyType, setCurrencyType] = useState("INR");
  const [category, setCategory] = useState("OTHER");
  const [paidBy, setPaidBy] = useState(currentUser?._id || "");
  const [splitStrategy, setSplitStrategy] = useState("EQUAL");
  const [percentages, setPercentages] = useState({});

  // data states
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let targetGroupId = groupId;

        if (isEditMode) {
          const expenseRes = await apiClient.get(`/expenses/${expenseId}`);
          const expense = expenseRes.data.data;

          targetGroupId = expense.group._id;

          setDescription(expense.description);
          setAmount(expense.amount.toString());
          setCurrencyType(expense.currencyType);
          setCategory(expense.category);
          setPaidBy(expense.paidBy._id);
          setSplitStrategy(expense.splitStrategy);

          if (expense.splitStrategy === "PERCENTAGE" && expense.splitInfo) {
            const loadedPercentages = {};
            expense.splitInfo.forEach((info) => {
              if (info.percentage) {
                loadedPercentages[info.userId._id || info.userId] =
                  info.percentage;
              }
            });
            setPercentages(loadedPercentages);
          }
        }

        if (targetGroupId) {
          const groupRes = await apiClient.get(`/groups/${targetGroupId}`);
          setGroupMembers(groupRes.data.data.members);

          if (!isEditMode && !paidBy) {
            setPaidBy(currentUser?._id);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [groupId, expenseId, isEditMode, currentUser, paidBy]);

  // handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      setIsLoading(false);
      return;
    }

    let splitInfo = [];

    if (splitStrategy === "EQUAL") {
      const splitAmount = numAmount / groupMembers.length;
      splitInfo = groupMembers.map((member) => ({
        userId: member._id,
        shareAmount: Number(splitAmount.toFixed(2)),
      }));
    } else if (splitStrategy === "PERCENTAGE") {
      // Validate that total percentage equal to 100
      const totalPercentage = Object.values(percentages).reduce(
        (sum, val) => sum + (val || 0),
        0,
      );

      if (Math.abs(totalPercentage - 100) > 0.01) {
        setError(
          `Total percentage must equal 100%. Currently at ${totalPercentage}%.`,
        );
        setIsLoading(false);
        return;
      }

      splitInfo = groupMembers.map((member) => ({
        userId: member._id,
        percentage: percentages[member._id] || 0,
        shareAmount: Number(
          ((numAmount * (percentages[member._id] || 0)) / 100).toFixed(2),
        ),
      }));
    }

    const payload = {
      description,
      amount: numAmount,
      currencyType,
      category,
      paidBy,
      splitStrategy,
      splitInfo,
      group: groupId,
    };

    try {
      if (isEditMode) {
        await apiClient.put(`/expenses/${expenseId}`, payload);
        navigate(-1);
      } else {
        await apiClient.post(`/expenses/${groupId}`, payload);
        navigate(`/dashboard/groups/${groupId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save expense.");
      setIsLoading(false);
    }
  };

  if (isLoading && !groupMembers.length) {
    return (
      <div className="p-8 text-text-muted animate-pulse">Loading form...</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl pb-12">
      <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-text-inverse">
          {isEditMode ? "Edit Expense" : "Add an Expense"}
        </h1>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at Goa"
              required
              className="bg-gray-800/50 border border-gray-700 text-text-inverse p-3 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">Amount</label>
            <div className="flex">
              <select
                value={currencyType}
                onChange={(e) => setCurrencyType(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-text-inverse p-3 rounded-l-lg focus:outline-none"
              >
                <option value="INR">₹</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="bg-gray-800/50 border border-gray-700 border-l-0 text-text-inverse p-3 rounded-r-lg w-full focus:outline-none focus:border-primary-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 text-text-inverse p-3 rounded-lg focus:outline-none focus:border-primary-500 capitalize"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">Paid By</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 text-text-inverse p-3 rounded-lg focus:outline-none focus:border-primary-500"
            >
              {groupMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member._id === currentUser?._id ? "You" : member.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4 bg-gray-800/30 border border-gray-700 rounded-xl mt-2">
          <label className="text-sm font-medium text-text-inverse mb-2">
            Split Options
          </label>
          <div className="flex gap-2 mb-4">
            {["EQUAL", "PERCENTAGE"].map((strategy) => (
              <button
                key={strategy}
                type="button"
                onClick={() => setSplitStrategy(strategy)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  splitStrategy === strategy
                    ? "bg-primary-500/20 border-primary-500 text-primary-500"
                    : "bg-gray-800 border-gray-700 text-text-muted hover:text-white"
                }`}
              >
                {strategy}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {groupMembers.map((member) => {
              let displayAmount = 0;
              if (splitStrategy === "EQUAL" && amount > 0) {
                displayAmount = (
                  parseFloat(amount) / groupMembers.length
                ).toFixed(2);
              }

              return (
                <div
                  key={member._id}
                  className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 text-xs flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        member.fullName.charAt(0)
                      )}
                    </div>
                    <span className="text-sm text-text-inverse">
                      {member.fullName}
                    </span>
                  </div>

                  {splitStrategy === "EQUAL" ? (
                    <span className="text-sm font-medium text-gray-300">
                      {currencyType === "USD" ? "$" : "₹"}
                      {displayAmount}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        value={percentages[member._id] || ""}
                        className="w-16 bg-gray-800 border border-gray-700 rounded p-1 text-right text-sm text-white focus:outline-none focus:border-primary-500"
                        onChange={(e) => {
                          setPercentages({
                            ...percentages,
                            [member._id]: parseFloat(e.target.value) || 0,
                          });
                        }}
                      />
                      <span className="text-sm text-text-muted">%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Save Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
