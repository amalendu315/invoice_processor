// components/SideHeader.jsx

"use client";
import React, { useContext } from "react";

import VoucherContext from "@/context/VoucherContext";
import AuthContext from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import ReturnVoucherContext from "@/context/ReturnVoucherContext";

const SideHeader = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useContext(AuthContext);
  const {
    lastUpdatedVoucherDate,
    submissionDate,
    pushedVoucherRanges,
  } = useContext(VoucherContext);

  const { lastUpdatedReturnVoucherDate, submissionDate:returnVoucherSubmissionDate, pushedReturnVoucherRanges } =
    useContext(ReturnVoucherContext);

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
            {pathname === "/" && (
              <p className="flex flex-col items-center justify-center">
                Last Updated Voucher Date:{" "}
                <span className="text-md font-bold text-green-500">
                  {lastUpdatedVoucherDate || "N/A"}
                </span>
              </p>
            )}
            {pathname === "/invoice-return" && (
              <p className="flex flex-col items-center justify-center">
                Last Updated Return Voucher Date:{" "}
                <span className="text-md font-bold text-green-500">
                  {lastUpdatedReturnVoucherDate || "N/A"}
                </span>
              </p>
            )}
            {pathname === "/" && (
              <p className="flex flex-col items-center justify-center">
                Submission Date:{" "}
                <span className="text-md font-bold text-green-500">
                  {submissionDate || "N/A"}
                </span>
              </p>
            )}
            {pathname === "/invoice-return" && (
              <p className="flex flex-col items-center justify-center">
                Invoice Return Submission Date:{" "}
                <span className="text-md font-bold text-green-500">
                  {returnVoucherSubmissionDate || "N/A"}
                </span>
              </p>
            )}
            {pathname === "/" && (
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
                </ul>
              </div>
            )}
            {pathname === "/invoice-return" && (
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-center mb-3">
                  Tally Entry Dates with Return Voucher Ranges:
                </h3>
                <ul className="text-center">
                  {Object.entries(pushedReturnVoucherRanges).map(
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
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default SideHeader;
