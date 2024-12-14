// components/SideHeader.jsx

"use client";
import React, { useContext } from "react";

import { format } from "date-fns";
import VoucherContext from "@/context/VoucherContext";
import AuthContext from "@/context/AuthContext";

const SideHeader = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const {
    lastUpdatedVoucherDate,
    submissionDate,
    pushedVoucherRanges,
  } = useContext(VoucherContext);

  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  return (
    <aside className="bg-gray-800 text-white p-4 w-64 h-screen fixed top-0 left-0 flex flex-col justify-center items-center gap-8">
      {isAuthenticated && (
        <>
          <h2 className="text-xl font-bold mb-4">Voucher Date Details</h2>
          <div className="flex flex-col gap-8">
            <p className="flex flex-col items-center justify-center">
              Last Updated Voucher Date:{" "}
              <span className="text-md font-bold text-green-500">
                {lastUpdatedVoucherDate || "N/A"}
              </span>
            </p>
            <p className="flex flex-col items-center justify-center">
              Submission Date:{" "}
              <span className="text-md font-bold text-green-500">
                {submissionDate || "N/A"}
              </span>
            </p>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-center mb-3">
                Tally Entry Dates with Voucher Ranges:
              </h3>
              <ul className="text-center">
                {Object.entries(pushedVoucherRanges).map(
                  ([key, range]) =>
                    range?.startVoucher !== range?.endVoucher && (
                      <li
                        key={key}
                        className="text-md font-bold"
                        style={{ color: getRandomColor() }}
                      >
                        {range.startDate} - {range.endDate}:{" "}
                        {range.startVoucher} - {range.endVoucher}
                      </li>
                    )
                )}
                {/* {Object.entries(pushedVoucherRanges).map(
                  ([key, range]) =>
                    range?.startVoucher === range?.endVoucher && (
                      <li
                        key={key}
                        className={`text-md font-bold `}
                        style={{ color: getRandomColor() }}
                      >
                        {format(new Date(range.startDate), "MM/dd/yyyy")} -{" "}
                        {format(new Date(range.endDate), "MM/dd/yyyy")}:{" "}
                        {range.startVoucher}
                      </li>
                    )
                )} */}
              </ul>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default SideHeader;
