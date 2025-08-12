"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  ChangeEvent,
  MouseEvent,
} from "react";

// Model for a single issue row
export type Issue = {
  id: string;
  type: string;
  errorMessage: string;
  status: "open" | "resolved";
  numEvents: number;
  numUsers: number;
  // Higher means the issue matters more when we add up selected ones
  impactScore: number;
};

type TableProps = {
  issues: Issue[];
};

const Table = ({ issues }: TableProps) => {
  // One boolean value per row to track selection. Row styles are derived from this.
  const [selectedByIndex, setSelectedByIndex] = useState<boolean[]>(() =>
    issues.map(() => false)
  );

  // Clear selection whenever the issues list changes
  useEffect(() => {
    setSelectedByIndex(issues.map(() => false));
  }, [issues]);

  // Figure out which rows are selectable (only "open") and some helpful counts
  const selectableByIndex = useMemo(
    () => issues.map((i) => i.status === "open"),
    [issues]
  );
  const totalSelectableCount = useMemo(
    () => selectableByIndex.filter(Boolean).length,
    [selectableByIndex]
  );

  // Totals shown in the UI are derived; we don't duplicate them in state
  const selectedCount = useMemo<number>(() => {
    return selectedByIndex.reduce<number>(
      (count: number, isSelected: boolean, i: number) =>
        count + (isSelected && selectableByIndex[i] ? 1 : 0),
      0
    );
  }, [selectedByIndex, selectableByIndex]);

  const selectedValueTotal = useMemo<number>(() => {
    return selectedByIndex.reduce<number>(
      (sum: number, isSelected: boolean, i: number) =>
        sum + (isSelected && selectableByIndex[i] ? issues[i].impactScore : 0),
      0
    );
  }, [selectedByIndex, selectableByIndex, issues]);

  // Control the "select all" indeterminate state via a ref + effect
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectAllChecked =
    totalSelectableCount > 0 && selectedCount === totalSelectableCount;
  const selectAllIndeterminate =
    selectedCount > 0 && selectedCount < totalSelectableCount;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectAllIndeterminate;
    }
  }, [selectAllIndeterminate]);

  const toggleIndex = (index: number): void => {
    if (!selectableByIndex[index]) return; // Skip: resolved rows can't be selected
    setSelectedByIndex((prev: boolean[]) => {
      const next = [...prev];
      next[index] = !prev[index];
      return next;
    });
  };

  const handleRowClick = (index: number): void => {
    toggleIndex(index);
  };

  const handleCheckboxClick = (event: MouseEvent<HTMLInputElement>): void => {
    // Stop the row click from firing too (avoids double toggle)
    event.stopPropagation();
  };

  const handleCheckboxChange = (index: number): void => {
    toggleIndex(index);
  };

  const handleSelectDeselectAll = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const { checked } = event.target;
    // Only affect open rows when selecting all; resolved stay unchecked
    setSelectedByIndex(
      issues.map((_, i) => (selectableByIndex[i] ? checked : false))
    );
  };

  return (
    <table className="w-full border-collapse shadow-lg table-fixed">
      <colgroup>
        <col className="w-12" />
        <col className="w-80" />
        <col className="w-auto" />
        <col className="w-64" />
      </colgroup>
      <thead>
        <tr className="border-2 border-gray-200">
          <th className="py-6 pl-6 text-left w-[48px]">
            <input
              ref={selectAllRef}
              className="w-5 h-5 cursor-pointer"
              type="checkbox"
              id="select-all"
              name="select-all"
              aria-label="Select all open issues"
              checked={selectAllChecked}
              onChange={handleSelectDeselectAll}
            />
          </th>
          <th className="py-6 text-left text-black" colSpan={3}>
            {selectedCount ? `Selected ${selectedCount}` : "None selected"}
            {/* If present, show the total impact next to the count */}
            {selectedValueTotal > 0 && (
              <span className="ml-2 text-gray-500">
                (Total impact {selectedValueTotal})
              </span>
            )}
          </th>
        </tr>
        <tr className="border-2 border-gray-200">
          <th className="py-6 pl-6" />
          <th className="py-6 text-left font-medium text-black">Type</th>
          <th className="py-6 text-left font-medium text-black">
            Error message
          </th>
          <th className="py-6 text-left font-medium text-black">Status</th>
        </tr>
      </thead>

      <tbody>
        {issues.map(({ id, type, errorMessage }, index) => {
          const issueIsOpen = selectableByIndex[index];
          const issueIsSelected = selectedByIndex[index];

          const rowClasses = `border-b border-gray-200 ${
            issueIsOpen
              ? "cursor-pointer hover:bg-blue-50 text-black"
              : "text-gray-600 cursor-not-allowed"
          } ${issueIsSelected ? "bg-blue-50" : ""}`;

          return (
            <tr
              className={rowClasses}
              key={id}
              onClick={issueIsOpen ? () => handleRowClick(index) : undefined}
            >
              <td className="py-6 pl-6">
                {issueIsOpen ? (
                  <input
                    className="w-5 h-5 cursor-pointer"
                    type="checkbox"
                    aria-label={`Select issue ${type}`}
                    checked={issueIsSelected}
                    onClick={handleCheckboxClick}
                    onChange={() => handleCheckboxChange(index)}
                  />
                ) : (
                  <input
                    className="w-5 h-5 opacity-50"
                    type="checkbox"
                    disabled
                    aria-label="Resolved issue"
                  />
                )}
              </td>
              <td className="py-6">{type}</td>
              <td className="py-6">{errorMessage}</td>
              <td className="py-6">
                <div className="flex items-center gap-2">
                  {issueIsOpen ? (
                    <>
                      <span className="inline-block w-[15px] h-[15px] rounded-full bg-blue-600" />
                      <span className="text-blue-700 font-medium">Open</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-[15px] h-[15px] rounded-full bg-gray-400" />
                      <span className="text-gray-700 font-medium">
                        Resolved
                      </span>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
