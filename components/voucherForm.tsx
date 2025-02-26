"use client";
import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "./ui/card";
import VoucherList from "./voucherList";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import toast from "react-hot-toast";
import { _Voucher } from "@/constants";
import VoucherContext from "@/context/VoucherContext";
import SumContext from "@/context/SumContext";
import * as XLSX from "xlsx"; // Import xlsx library

interface VoucherData {
  branchName: string;
  vouchertype: string;
  voucherno: string;
  voucherdate: string;
  narration: string;
  ledgerAllocation: {
    lineno: number;
    ledgerName: string;
    ledgerAddress?: string;
    amount: string;
    drCr: "dr" | "cr";
  }[];
}

interface PushedVoucherRange {
  startDate: string;
  endDate: string;
  startVoucher: number;
  endVoucher: number;
}

// Context State Types
interface PushedVoucherRanges {
  [key: string]: PushedVoucherRange
}

// Props for setState functions
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

const VoucherForm = () => {
  const voucherContext = React.useContext(VoucherContext);
  if (!voucherContext) {
    throw new Error("VoucherContext must be used within a VoucherProvider");
  }

  // Now safely destructure
  const {
    setLastUpdatedVoucherDate,
    setSubmissionDate,
    setLastUpdatedVoucher,
    setPushedVoucherRanges,
    pushedVoucherRanges,
  } = voucherContext;


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
             voucher.Types === "Invoice" &&
             !testKeywords.some(
               (keyword) => voucher.AccountName?.toLowerCase().includes(keyword) // Exclude test accounts
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


       // Log filtered test accounts for debugging
       console.log(
         "Filtered valid vouchers (excluding test accounts):",
         sortedVouchers
       );

       // Calculate total final rate for real vouchers
       const totalFinalRate = sortedVouchers.reduce((acc, voucher) => {
         const voucherFinalRate =
           typeof voucher.FinalRate === "number"
             ? voucher.FinalRate * voucher.pax
             : 0;
         return acc + voucherFinalRate;
       }, 0);

       setTotalSum(totalFinalRate);

       const length = sortedVouchers.length;
       toast.success(
         `Total ${length} valid vouchers fetched for the selected range!`
       );
     }
   } catch (error) {
     console.error("Error fetching data:", error);
     toast.error("Error Fetching The Data :(");
   } finally {
     setIsSalesLoading(false);
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
           selectedEntries.includes(voucher.InvoiceID)
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


  const _prepareVoucherDataForCloud = (
    entriesBatch: number[], // Now contains InvoiceIDs, not indices
    vouchers: _Voucher[],
    pushedVoucherRanges: PushedVoucherRanges,
    rangeKey: string
  ): VoucherData[] => {
    return entriesBatch
      .map((invoiceNo) => {
        // Find the voucher using InvoiceID
        const voucher = vouchers.find((v) => v.InvoiceNo === invoiceNo);

        if (!voucher) {
          console.log(`No voucher found for InvoiceNo ${invoiceNo}`);
          return null;
        }

        if (
          pushedVoucherRanges[rangeKey] &&
          (voucher.InvoiceNo === pushedVoucherRanges[rangeKey].startVoucher ||
            voucher.InvoiceNo === pushedVoucherRanges[rangeKey].endVoucher)
        ) {
          toast.error(`Voucher ${voucher.InvoiceNo} already pushed!`);
          return null;
        }

        const isNepalVoucher = (voucher: _Voucher) => {
          const countryLower = voucher.Country?.toLowerCase() || "";
          const countryMainLower = voucher.CountryMain?.toLowerCase() || "";
          const stateLower = voucher.State?.toLowerCase() || "";

          return (
            countryLower === "nepal" ||
            countryMainLower === "nepal" ||
            voucher.CountryID === 4 ||
            stateLower.includes("province")
          );
        };

        let ledgerName = voucher.AccountName;
        if (isNepalVoucher(voucher)) {
          console.log("Nepal voucher:", voucher);
          ledgerName = "Air IQ Nepal";
        } else {
          console.log("Non-Nepal voucher:", voucher);
        }

        return {
          branchName: "AirIQ",
          vouchertype: "Sales",
          voucherno: `${voucher.FinPrefix}${voucher.InvoiceNo}`,
          voucherdate: voucher.SaleEntryDate.split("T")[0].replace(/-/g, "/"),
          narration: `${voucher.Pnr} | PAX :- ${voucher.pax}`,
          ledgerAllocation: [
            {
              lineno: 1,
              ledgerName: ledgerName,
              ledgerAddress: `${voucher.Add1 ?? ""}, ${voucher.Add2 ?? ""}, ${
                voucher.CityName ?? ""
              } - ${voucher.Pin ?? ""}`,
              amount: (voucher.FinalRate * voucher.pax).toFixed(2),
              drCr: "dr",
            },
            {
              lineno: 2,
              ledgerName: "Domestic Base Fare",
              amount: (voucher.FinalRate * voucher.pax).toFixed(2),
              drCr: "cr",
            },
          ],
        };
      })
      .filter((voucher): voucher is VoucherData => voucher !== null);
  };

  

  const _pushDataToCloud = async (
    dataForCloud: VoucherData[],
    retries: number = 3
  ): Promise<boolean> => {
    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await fetch("/api/cloud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dataForCloud }),
        });

        if (!response.ok) {
          console.error(
            `Cloud API error (attempt ${attempt + 1}):`,
            response.status
          );
          throw new Error(`Cloud server error ${response.status}`);
        }
        return true;
      } catch (error) {
        attempt++;
        console.warn(`Retrying batch (${attempt}/${retries})...`, error);
        await new Promise((res) => setTimeout(res, 2000 * attempt)); // Exponential backoff
      }
    }
    return false;
  };

   const _updateLastPushedVoucher = (
    selectedEntries: number[],
    vouchers: _Voucher[],
    _setPushedVoucherRanges: SetState<PushedVoucherRanges>,
    setLastUpdatedVoucher: SetState<_Voucher | null>,
    setLastUpdatedVoucherDate: SetState<string>,
    dateRange: { start: string; end: string }
  ) => {
    if (selectedEntries.length === 0) return;

    const firstVoucher = vouchers[selectedEntries[0]];
    const lastVoucher = vouchers[selectedEntries[selectedEntries.length - 1]];

    if (!firstVoucher || !lastVoucher) return;

    // Ensure state update uses the correct function signature
    _setPushedVoucherRanges((prev: PushedVoucherRanges) => ({
      ...prev,
      [`${dateRange.start}-${dateRange.end}`]: {
        startDate: format(new Date(firstVoucher.SaleEntryDate), "dd/MM/yyyy"),
        endDate: format(new Date(lastVoucher.SaleEntryDate), "dd/MM/yyyy"),
        startVoucher: firstVoucher.InvoiceNo,
        endVoucher: lastVoucher.InvoiceNo,
      },
    }));

    setLastUpdatedVoucher(lastVoucher);

    if (lastVoucher.InvoiceEntryDate) {
      setLastUpdatedVoucherDate(
        new Date(lastVoucher.InvoiceEntryDate).toISOString().split("T")[0]
      );
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

     const rangeKey = `${dateRange.start}-${dateRange.end}`;

     for (let i = 0; i < selectedEntries.length; i += vouchersPerRequest) {
       // Pass InvoiceIDs instead of array indices
       const dataForCloud = _prepareVoucherDataForCloud(
         selectedEntries.slice(i, i + vouchersPerRequest),
         vouchers,
         pushedVoucherRanges,
         rangeKey
       );

       if (dataForCloud.length === 0) continue;

       const success = await _pushDataToCloud(dataForCloud);
       if (!success) {
         toast.error(`Error submitting batch ${i + 1} to cloud`);
         break;
       }
      console.log('dataForCloud', dataForCloud)

       toast.success(`Batch ${i / vouchersPerRequest + 1} Vouchers Pushed!`);
     }

     _updateLastPushedVoucher(
       selectedEntries,
       vouchers,
       setPushedVoucherRanges,
       setLastUpdatedVoucher,
       setLastUpdatedVoucherDate,
       dateRange
     );

     toast.success("Vouchers Submitted Successfully!");
   } catch (error) {
     console.error("Error submitting data:", error);
     toast.error("Error Submitting Data To Cloud!");
   } finally {
     setIsCloudLoading(false);
   }
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
              Fetch Sales Entries
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

export default VoucherForm;
