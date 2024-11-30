"use client";
import { _Voucher } from "@/constants";
import { createContext, useState, useEffect } from "react";

const VoucherContext = createContext<{
  lastUpdatedVoucher: _Voucher | null;
  setLastUpdatedVoucher: (voucher: _Voucher) => void;
  lastUpdatedVoucherDate: string;
  setLastUpdatedVoucherDate: (date: string) => void;
  submissionDate: string;
  setSubmissionDate: (date: string) => void;
}>({
  lastUpdatedVoucher: null,
  setLastUpdatedVoucher: () => {},
  lastUpdatedVoucherDate: "",
  setLastUpdatedVoucherDate: () => {},
  submissionDate: "",
  setSubmissionDate: () => {},
});

export const VoucherProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
   const [lastUpdatedVoucher, setLastUpdatedVoucher] =
     useState<_Voucher | null>(null);
  const [lastUpdatedVoucherDate, setLastUpdatedVoucherDate] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");

  useEffect(() => {
    const storedVoucher = localStorage.getItem("lastUpdatedVoucher");
    if(storedVoucher){
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
          localStorage.setItem("submissionDate", date); // Save to localStorage
        },
      }}
    >
      {children}
    </VoucherContext.Provider>
  );
};

export default VoucherContext;
