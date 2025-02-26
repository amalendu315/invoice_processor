"use client";
// VoucherContext.tsx
import { _Voucher } from "@/constants";
import { createContext, useState, useEffect } from "react";

// Define a type for the pushed voucher ranges
export type PushedReturnVoucherRanges = {
  [key: string]: {
    // The key could be a combination of startDate and endDate, or a unique identifier
    startDate: string;
    endDate: string;
    startVoucher: number;
    endVoucher: number;
  };
};

const ReturnVoucherContext = createContext<{
  lastUpdatedReturnVoucher: _Voucher | null;
  setLastUpdatedReturnVoucher: (voucher: _Voucher) => void;
  lastUpdatedReturnVoucherDate: string;
  setLastUpdatedReturnVoucherDate: (date: string) => void;
  submissionDate: string;
  setSubmissionDate: (date: string) => void;
  pushedReturnVoucherRanges: PushedReturnVoucherRanges;
  setPushedReturnVoucherRanges: (
    updater: (prev: PushedReturnVoucherRanges) => PushedReturnVoucherRanges
  ) => void;
}>({
  lastUpdatedReturnVoucher: null,
  setLastUpdatedReturnVoucher: () => {},
  lastUpdatedReturnVoucherDate: "",
  setLastUpdatedReturnVoucherDate: () => {},
  submissionDate: "",
  setSubmissionDate: () => {},
  pushedReturnVoucherRanges: {},
  setPushedReturnVoucherRanges: () => {},
});


export const ReturnVoucherProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [lastUpdatedReturnVoucher, setLastUpdatedReturnVoucher] = useState<_Voucher | null>(
    null
  );
  const [lastUpdatedReturnVoucherDate, setLastUpdatedReturnVoucherDate] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [pushedReturnVoucherRanges, setPushedReturnVoucherRanges] = useState<
    PushedReturnVoucherRanges
  >({});

  useEffect(() => {
    const storedVoucher = localStorage.getItem("lastUpdatedVoucher");
    if (storedVoucher) {
      setLastUpdatedReturnVoucher(JSON.parse(storedVoucher));
    }
    const storedDate = localStorage.getItem("lastUpdatedVoucherDate");
    if (storedDate) {
      setLastUpdatedReturnVoucherDate(storedDate);
    }
    const storedSubmissionDate = localStorage.getItem("submissionDate");
    if (storedSubmissionDate) {
      setSubmissionDate(storedSubmissionDate);
    }
    const storedPushedRanges = localStorage.getItem("pushedVoucherRanges");
    if (storedPushedRanges) {
      setPushedReturnVoucherRanges(JSON.parse(storedPushedRanges));
    }
  }, []);

  return (
    <ReturnVoucherContext.Provider
      value={{
        lastUpdatedReturnVoucher,
        setLastUpdatedReturnVoucher: (voucher: _Voucher) => {
          setLastUpdatedReturnVoucher(voucher);
          localStorage.setItem(
            "lastUpdatedReturnVoucher",
            JSON.stringify(voucher)
          );
        },
        lastUpdatedReturnVoucherDate,
        setLastUpdatedReturnVoucherDate: (date: string) => {
          setLastUpdatedReturnVoucherDate(date);
          localStorage.setItem("lastUpdatedReturnVoucherDate", date);
        },
        submissionDate,
        setSubmissionDate: (date: string) => {
          setSubmissionDate(date);
          localStorage.setItem("submissionDate", date);
        },
        pushedReturnVoucherRanges,
        setPushedReturnVoucherRanges: (updater) => {
          setPushedReturnVoucherRanges((prev) => {
            const newRanges = updater(prev);
            localStorage.setItem(
              "pushedReturnVoucherRanges",
              JSON.stringify(newRanges)
            );
            return newRanges;
          });
        },
      }}
    >
      {children}
    </ReturnVoucherContext.Provider>
  );
};

export default ReturnVoucherContext;
