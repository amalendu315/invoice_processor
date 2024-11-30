"use client";
// VoucherContext.tsx
import { _Voucher } from "@/constants";
import { createContext, useState, useEffect } from "react";

// Define a type for the pushed voucher ranges
type PushedVoucherRanges = {
  [key: string]: {
    // The key could be a combination of startDate and endDate, or a unique identifier
    startDate: string;
    endDate: string;
    startVoucher: number;
    endVoucher: number;
  };
};

const VoucherContext = createContext<{
  lastUpdatedVoucher: _Voucher | null;
  setLastUpdatedVoucher: (voucher: _Voucher) => void;
  lastUpdatedVoucherDate: string;
  setLastUpdatedVoucherDate: (date: string) => void;
  submissionDate: string;
  setSubmissionDate: (date: string) => void;
  pushedVoucherRanges: PushedVoucherRanges;
  setPushedVoucherRanges: (ranges: PushedVoucherRanges) => void;
}>({
  lastUpdatedVoucher: null,
  setLastUpdatedVoucher: () => {},
  lastUpdatedVoucherDate: "",
  setLastUpdatedVoucherDate: () => {},
  submissionDate: "",
  setSubmissionDate: () => {},
  pushedVoucherRanges: {},
  setPushedVoucherRanges: () => {},
});

export const VoucherProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [lastUpdatedVoucher, setLastUpdatedVoucher] = useState<_Voucher | null>(
    null
  );
  const [lastUpdatedVoucherDate, setLastUpdatedVoucherDate] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [pushedVoucherRanges, setPushedVoucherRanges] = useState<
    PushedVoucherRanges
  >({});

  useEffect(() => {
    const storedVoucher = localStorage.getItem("lastUpdatedVoucher");
    if (storedVoucher) {
      setLastUpdatedVoucher(JSON.parse(storedVoucher));
    }
    const storedDate = localStorage.getItem("lastUpdatedVoucherDate");
    if (storedDate) {
      setLastUpdatedVoucherDate(storedDate);
    }
    const storedSubmissionDate = localStorage.getItem("submissionDate");
    if (storedSubmissionDate) {
      setSubmissionDate(storedSubmissionDate);
    }
    const storedPushedRanges = localStorage.getItem("pushedVoucherRanges");
    if (storedPushedRanges) {
      setPushedVoucherRanges(JSON.parse(storedPushedRanges));
    }
  }, []);

  return (
    <VoucherContext.Provider
      value={{
        lastUpdatedVoucher,
        setLastUpdatedVoucher: (voucher: _Voucher) => {
          setLastUpdatedVoucher(voucher);
          localStorage.setItem("lastUpdatedVoucher", JSON.stringify(voucher));
        },
        lastUpdatedVoucherDate,
        setLastUpdatedVoucherDate: (date: string) => {
          setLastUpdatedVoucherDate(date);
          localStorage.setItem("lastUpdatedVoucherDate", date);
        },
        submissionDate,
        setSubmissionDate: (date: string) => {
          setSubmissionDate(date);
          localStorage.setItem("submissionDate", date);
        },
        pushedVoucherRanges,
        setPushedVoucherRanges: (ranges: PushedVoucherRanges) => {
          setPushedVoucherRanges(ranges);
          localStorage.setItem("pushedVoucherRanges", JSON.stringify(ranges));
        },
      }}
    >
      {children}
    </VoucherContext.Provider>
  );
};

export default VoucherContext;
