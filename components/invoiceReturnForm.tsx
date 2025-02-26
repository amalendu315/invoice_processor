// InvoiceReturnForm.tsx
"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { _Voucher } from "@/constants";
import SumContext from "@/context/SumContext";
import * as XLSX from "xlsx"; // Import xlsx library
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VoucherList from "@/components/voucherList";
import { format } from "date-fns";
import ReturnVoucherContext from "@/context/ReturnVoucherContext";

const InvoiceReturnForm = () => {
  const {
    setLastUpdatedReturnVoucher,
    setSubmissionDate,
    setLastUpdatedReturnVoucherDate,
    setPushedReturnVoucherRanges,
    pushedReturnVoucherRanges,
  } = React.useContext(ReturnVoucherContext);

  const { setTotalSum } = React.useContext(SumContext);

  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [vouchers, setVouchers] = useState<_Voucher[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<number[]>([]);

  const handleFetchSalesEntries = async () => {
    setIsSalesLoading(true);
    try {
      const response = await fetch(
        `/api/sales?startDate=${dateRange.start}&endDate=${dateRange.end}`
      );

      const data = await response?.json();
      if (!response?.ok) {
        toast.error("No Data Found");
      } else {
        const testKeywords = ["test", "dummy", "demo", "xyz", "airline test"]; // Add more if needed

        const sortedVouchers = [...data.data]
          .filter(
            (voucher) =>
              voucher.Types === "Invoice Return" &&
              !testKeywords.some(
                (keyword) =>
                  voucher.AccountName?.toLowerCase().includes(keyword) // Exclude test accounts
              )
          )
          .sort((a, b) => {
            // First sort by InvoiceNo (ascending order)
            if (a.InvoiceNo !== b.InvoiceNo) {
              return a.InvoiceNo - b.InvoiceNo; // Change to `b.InvoiceNo - a.InvoiceNo` for descending
            }

            // If InvoiceNo is the same, sort by SaleEntryDate (newest first)
            return (
              new Date(b.SaleEntryDate).getTime() -
              new Date(a.SaleEntryDate).getTime()
            );
          });

        setVouchers(sortedVouchers);
        const totalFinalRate = sortedVouchers?.reduce((acc, voucher) => {
          const voucherFinalRate =
            typeof voucher?.FinalRate === "number"
              ? voucher?.FinalRate * voucher?.pax
              : 0;
          return acc + voucherFinalRate;
        }, 0);
        setTotalSum(totalFinalRate);
        const length = sortedVouchers?.length;
        toast.success(
          `Total ${length} "Invoice Return" vouchers fetched for the selected range!`
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error Fetching The Data :(");
    } finally {
      setIsSalesLoading(false);
    }
  };

  const handleSubmitToCloud = async () => {
    if (selectedEntries.length === 0) {
      toast.error(`Please select at least one voucher to push!`);
      return;
    }

    try {
      setIsCloudLoading(true);
      const vouchersPerRequest = 50;
      const currentDate = new Date().toISOString().split("T")[0];
      setSubmissionDate(currentDate);

      const firstSelectedVoucher = vouchers.find(
        (v) => v.InvoiceID === selectedEntries[0]
      );
      const lastSelectedVoucher = vouchers.find(
        (v) => v.InvoiceID === selectedEntries[selectedEntries.length - 1]
      );

      const rangeKey = `${dateRange.start}-${dateRange.end}`;

      for (let i = 0; i < selectedEntries.length; i += vouchersPerRequest) {
        const dataForCloud = selectedEntries
          .slice(i, i + vouchersPerRequest)
          .map((invoiceNo) => {
            const voucher = vouchers.find((v) => v.InvoiceNo === invoiceNo);

            if (!voucher) {
              console.warn(`⚠️ Missing voucher for InvoiceNo: ${invoiceNo}`);
              return null;
            }

            if (
              pushedReturnVoucherRanges[rangeKey] &&
              (voucher.InvoiceNo ===
                pushedReturnVoucherRanges[rangeKey].startVoucher ||
                voucher.InvoiceNo ===
                  pushedReturnVoucherRanges[rangeKey].endVoucher)
            ) {
              toast.error(`Voucher ${voucher.InvoiceNo} already pushed!`);
              return null;
            }

            let ledgerName = voucher.AccountName ?? "Unknown Ledger";
            const ledgerPrefix =
              voucher.FinPrefix === "ASCN/24-25/" ? "SR/24-25/" : "";

            if (voucher.Country?.toLowerCase() === "nepal") {
              ledgerName = "Air IQ Nepal";
            }

            return {
              branchName: "AirIQ",
              vouchertype: "Credit Note",
              voucherno: `${ledgerPrefix}${voucher.InvoiceNo}`,
              voucherdate: voucher.SaleEntryDate
                ? voucher.SaleEntryDate.split("T")[0].replace(/-/g, "/")
                : "N/A",
              narration: `${voucher.Pnr ?? "Unknown PNR"} | PAX :- ${
                voucher.pax ?? 0
              }`,
              ledgerAllocation: [
                {
                  lineno: 1,
                  ledgerName: ledgerName,
                  ledgerAddress: `${voucher.Add1 ?? ""}, ${
                    voucher.Add2 ?? ""
                  }, ${voucher.CityName ?? ""} - ${voucher.Pin ?? ""}`,
                  amount: (
                    (voucher.FinalRate ?? 0) * (voucher.pax ?? 0)
                  ).toFixed(2),
                  drCr: "dr",
                },
                {
                  lineno: 2,
                  ledgerName: "Domestic Base Fare",
                  amount: (
                    (voucher.FinalRate ?? 0) * (voucher.pax ?? 0)
                  ).toFixed(2),
                  drCr: "cr",
                },
              ],
            };
          })
          .filter((voucher) => voucher !== null); // Remove any null values

        if (dataForCloud.length === 0) {
          toast.error(`No valid vouchers available for submission!`);
          continue;
        }

        console.log("🟢 Pushing Vouchers to Cloud:", dataForCloud);

        const response = await fetch("/api/return-cloud", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: dataForCloud }),
        });

        if (!response.ok) {
          console.error("Cloud server error:", response.status);
          throw new Error(`Cloud server responded with status ${response.status}`);
        }

        toast.success(`Batch ${i / vouchersPerRequest + 1} Vouchers Pushed!`);
      }

      // ✅ Update pushed voucher ranges
      if (firstSelectedVoucher && lastSelectedVoucher) {
        setPushedReturnVoucherRanges((prev) => ({
          ...prev,
          [rangeKey]: {
            startDate: format(
              new Date(firstSelectedVoucher?.SaleEntryDate ?? ""),
              "dd/MM/yyyy"
            ),
            endDate: format(
              new Date(lastSelectedVoucher?.SaleEntryDate ?? ""),
              "dd/MM/yyyy"
            ),
            startVoucher: firstSelectedVoucher?.InvoiceNo ?? 0,
            endVoucher: lastSelectedVoucher?.InvoiceNo ?? 0,
          },
        }));


        setLastUpdatedReturnVoucher(lastSelectedVoucher);

        if (lastSelectedVoucher.InvoiceEntryDate) {
          setLastUpdatedReturnVoucherDate(
            new Date(lastSelectedVoucher.InvoiceEntryDate)
              .toISOString()
              .split("T")[0]
          );
        }
      }

      toast.success("Vouchers Submitted Successfully!");
    } catch (error) {
      console.error("❌ Error submitting data:", error);
      toast.error("Error Submitting Data To Cloud!");
    } finally {
      setIsCloudLoading(false);
    }
  };


  const handleExportToExcel = () => {
    // If no vouchers are available
    if (vouchers.length === 0) {
      toast.error("No data available to export!");
      return;
    }

    // Check if there are selected vouchers
    const selectedVouchers =
      selectedEntries.length > 0
        ? vouchers.filter((voucher) =>
            selectedEntries.includes(voucher.InvoiceNo)
          )
        : vouchers; // If nothing is selected, export all

    // Format the data for Excel
    const formattedData = selectedVouchers.map((voucher) => ({
      InvoiceNo: voucher.InvoiceNo,
      SaleEntryDate: voucher.SaleEntryDate,
      Pnr: voucher.Pnr,
      Pax: voucher.pax,
      AccountName: voucher.AccountName,
      Country: voucher.Country ?? voucher.CityName, // Fix null issue
      FinalRate: voucher.FinalRate,
      TotalAmount: voucher.FinalRate * voucher.pax,
    }));

    if (formattedData.length === 0) {
      toast.error("No selected vouchers available to export!");
      return;
    }

    // Create and download the Excel file
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vouchers");
    XLSX.writeFile(workbook, "Selected_Vouchers.xlsx");

    toast.success("Excel file has been downloaded successfully!");
  };


  return (
    <>
      <Card>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 pt-4 items-center ">
            <div>
              <label htmlFor="startDate">Start Date:</label>
              <Input
                type="date"
                id="startDate"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="endDate">End Date:</label>
              <Input
                type="date"
                id="endDate"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
            <Button
              className="mt-5"
              onClick={handleFetchSalesEntries}
              disabled={isSalesLoading}
            >
              Fetch Invoice Return Entries
            </Button>
            <Button
              className="mt-5"
              onClick={handleSubmitToCloud}
              disabled={isCloudLoading}
            >
              Submit to Cloud
            </Button>
            <Button className="mt-5" onClick={handleExportToExcel}>
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>
      {vouchers?.length > 0 && (
        <VoucherList
          vouchers={vouchers}
          onSelect={setSelectedEntries}
          selectedEntries={selectedEntries}
        />
      )}
    </>
  );
};

export default InvoiceReturnForm;
