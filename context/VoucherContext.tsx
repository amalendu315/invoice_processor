"use client";
// VoucherContext.tsx
import { _Voucher } from "@/constants";
import { createContext, useState, useEffect } from "react";

// Define a type for the pushed voucher ranges
interface PushedVoucherRange {
  startDate: string;
  endDate: string;
  startVoucher: number;
  endVoucher: number;
}

// Context State Types
interface PushedVoucherRanges {
  [key: string]: PushedVoucherRange;
}

// Props for setState functions
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

const VoucherContext = createContext<{
  lastUpdatedVoucher: _Voucher | null;
  setLastUpdatedVoucher: SetState<_Voucher | null>;
  lastUpdatedVoucherDate: string;
  setLastUpdatedVoucherDate: SetState<string>;
  submissionDate: string;
  setSubmissionDate: SetState<string>;
  pushedVoucherRanges: PushedVoucherRanges;
  setPushedVoucherRanges: SetState<PushedVoucherRanges>;
} | null>(null); // ✅ Fixed: Default to null to avoid undefined context issues

export const VoucherProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [lastUpdatedVoucher, setLastUpdatedVoucher] = useState<_Voucher | null>(
    null
  );
  const [lastUpdatedVoucherDate, setLastUpdatedVoucherDate] =
    useState<string>("");
  const [submissionDate, setSubmissionDate] = useState<string>("");
  const [pushedVoucherRanges, setPushedVoucherRanges] =
    useState<PushedVoucherRanges>({});

  useEffect(() => {
    const storedVoucher = localStorage.getItem("lastUpdatedVoucher");
    if (storedVoucher) {
      try {
        setLastUpdatedVoucher(JSON.parse(storedVoucher));
      } catch (error) {
        console.error("Error parsing lastUpdatedVoucher:", error);
        localStorage.removeItem("lastUpdatedVoucher"); // Clear invalid storage
      }
    }

    const storedDate = localStorage.getItem("lastUpdatedVoucherDate");
    if (storedDate) setLastUpdatedVoucherDate(storedDate);

    const storedSubmissionDate = localStorage.getItem("submissionDate");
    if (storedSubmissionDate) setSubmissionDate(storedSubmissionDate);

    const storedPushedRanges = localStorage.getItem("pushedVoucherRanges");
    if (storedPushedRanges) {
      try {
        const parsedRanges = JSON.parse(storedPushedRanges);
        if (parsedRanges && typeof parsedRanges === "object") {
          setPushedVoucherRanges(parsedRanges);
        } else {
          console.error("Invalid pushedVoucherRanges format:", parsedRanges);
          localStorage.removeItem("pushedVoucherRanges");
        }
      } catch (error) {
        console.error("Error parsing pushedVoucherRanges:", error);
        localStorage.removeItem("pushedVoucherRanges"); // Clear invalid data
      }
    }
  }, []);
  // ✅ Fix: Wrap the state setters properly
  const updateLastUpdatedVoucher = (
    value: _Voucher | null | ((prev: _Voucher | null) => _Voucher | null)
  ) => {
    setLastUpdatedVoucher((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      if (newValue !== null) {
        localStorage.setItem("lastUpdatedVoucher", JSON.stringify(newValue));
      } else {
        localStorage.removeItem("lastUpdatedVoucher");
      }
      return newValue;
    });
  };

  const updateLastUpdatedVoucherDate = (
    value: string | ((prev: string) => string)
  ) => {
    setLastUpdatedVoucherDate((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      localStorage.setItem("lastUpdatedVoucherDate", newValue);
      return newValue;
    });
  };

  const updateSubmissionDate = (value: string | ((prev: string) => string)) => {
    setSubmissionDate((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      localStorage.setItem("submissionDate", newValue);
      return newValue;
    });
  };

  const updatePushedVoucherRanges = (
    value:
      | PushedVoucherRanges
      | ((prev: PushedVoucherRanges) => PushedVoucherRanges)
  ) => {
    setPushedVoucherRanges((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      localStorage.setItem("pushedVoucherRanges", JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <VoucherContext.Provider
      value={{
        lastUpdatedVoucher,
        setLastUpdatedVoucher: updateLastUpdatedVoucher, // ✅ Wrapped function
        lastUpdatedVoucherDate,
        setLastUpdatedVoucherDate: updateLastUpdatedVoucherDate, // ✅ Wrapped function
        submissionDate,
        setSubmissionDate: updateSubmissionDate, // ✅ Wrapped function
        pushedVoucherRanges,
        setPushedVoucherRanges: updatePushedVoucherRanges, // ✅ Wrapped function
      }}
    >
      {children}
    </VoucherContext.Provider>
  );
};

export default VoucherContext;
