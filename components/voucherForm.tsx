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

const VoucherForm = () => {
  const {
    setLastUpdatedVoucherDate,
    setSubmissionDate,
    setLastUpdatedVoucher,
    setPushedVoucherRanges,
    pushedVoucherRanges,
  } = React.useContext(VoucherContext);

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
        const sortedVouchers = [...data.data].sort(
          (a, b) => a.InvoiceNo - b.InvoiceNo
        );
        setVouchers(sortedVouchers);
        const totalFinalRate = sortedVouchers?.reduce((acc, voucher) => {
          const voucherFinalRate =
            typeof voucher.FinalRate === "number"
              ? voucher.FinalRate * voucher.pax
              : 0;
          return acc + voucherFinalRate;
        }, 0);
        setTotalSum(totalFinalRate);
        const length = sortedVouchers?.length;
        toast.success(
          `Total ${length} vouchers fetched for the selected range!`
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
    if (vouchers.length === 0) {
      toast.error("No data available to export!");
      return;
    }

    const formattedData = vouchers.map((voucher) => ({
      InvoiceNo: voucher.InvoiceNo,
      SaleEntryDate: voucher.SaleEntryDate,
      Pnr: voucher.Pnr,
      Pax: voucher.pax,
      AccountName: voucher.AccountName,
      Country: voucher.Country,
      FinalRate: voucher.FinalRate,
      TotalAmount: voucher.FinalRate * voucher.pax,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vouchers");
    XLSX.writeFile(workbook, "Vouchers.xlsx");

    toast.success("Excel file has been downloaded successfully!");
  };

  const handleSubmitToCloud = async () => {
    if (selectedEntries.length <= 0) {
      toast.error(`Please select at least one voucher to push!`);
      return;
    }

    try {
      setIsCloudLoading(true);
      const vouchersPerRequest = 50;
      const currentDate = new Date().toISOString().split("T")[0];
      setSubmissionDate(currentDate);

      const firstSelectedVoucher = vouchers[selectedEntries[0]];
      const lastSelectedVoucherIndex =
        selectedEntries[selectedEntries.length - 1];
      const lastSelectedVoucher = vouchers[lastSelectedVoucherIndex];

      const rangeKey = `${dateRange.start}-${dateRange.end}`;

      for (let i = 0; i < selectedEntries.length; i += vouchersPerRequest) {
        const dataForCloud = selectedEntries
          .slice(i, i + vouchersPerRequest)
          .map((index) => {
            const voucher = vouchers[index];

            if (
              pushedVoucherRanges[rangeKey] &&
              (voucher.InvoiceNo ===
                pushedVoucherRanges[rangeKey].startVoucher ||
                voucher.InvoiceNo === pushedVoucherRanges[rangeKey].endVoucher)
            ) {
              toast.error(`Voucher ${voucher.InvoiceNo} already pushed!`);
              return undefined;
            }

            let ledgerName = voucher.AccountName;
            if (voucher.Country && voucher.Country.toLowerCase() === "nepal") {
              ledgerName = "Air IQ Nepal";
            }

            return {
              branchName: "AirIQ",
              vouchertype: "Sales",
              voucherno: `${voucher.FinPrefix}${voucher.InvoiceNo}`,
              voucherdate: voucher.SaleEntryDate.split("T")[0].replace(
                /-/g,
                "/"
              ),
              narration: `${voucher.Pnr} | PAX :- ${voucher.pax}`,
              ledgerAllocation: [
                {
                  lineno: 1,
                  ledgerName: ledgerName,
                  ledgerAddress: `${voucher.Add1}, ${voucher.Add2}, ${voucher.CityName} - ${voucher.Pin}`,
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
          });

        if (dataForCloud.some((voucher) => voucher === undefined)) {
          toast.error(`Some selected vouchers are already pushed!`);
          throw new Error(`DataForCloud contains undefined vouchers!`);
        }
        const response = await fetch("/api/cloud", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: dataForCloud }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Cloud server error:", response.status, errorText);
          throw new Error(
            `Cloud server responded with status ${response.status}`
          );
        } else {
          if (i !== 0) {
            toast.success(`${i} Vouchers Pushed!`);
          }
        }
      }

      setPushedVoucherRanges({
        ...pushedVoucherRanges,
        [rangeKey]: {
          startDate: format(
            new Date(firstSelectedVoucher.SaleEntryDate),
            "dd/MM/yyyy"
          ),
          endDate: format(
            new Date(lastSelectedVoucher.SaleEntryDate),
            "dd/MM/yyyy"
          ),
          startVoucher: firstSelectedVoucher.InvoiceNo,
          endVoucher: lastSelectedVoucher.InvoiceNo,
        },
      });

      setLastUpdatedVoucher(lastSelectedVoucher);
      const lastVoucherDate = lastSelectedVoucher.InvoiceEntryDate;
      if (lastVoucherDate) {
        const formattedDate = new Date(lastVoucherDate)
          .toISOString()
          .split("T")[0];
        setLastUpdatedVoucherDate(formattedDate);
      }

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
