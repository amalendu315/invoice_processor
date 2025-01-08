"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";

interface Voucher {
  InvoiceID: number;
  InvoiceNo: number;
  SaleID: number;
  FinYID: number;
  InvoiceEntryDate: string;
  Prefix: string;
  Pnr: string;
  AccountName: string;
  DisplayRate: number;
  FinalRate: number;
  SaleEntryDate: string;
  FinFromDate: string;
  FinToDate: string;
  FinPrefix: string;
  pax: number;
  Add1: string;
  Add2: string;
  Pin: string;
  Country: string;
  CityName: string;
  Phone: string;
  Email: string;
}

interface VoucherListProps {
  vouchers: Voucher[];
  onSelect: (indexes: number[]) => void;
  selectedEntries: number[];
}

export default function VoucherList({
  vouchers,
  onSelect,
  selectedEntries,
}: VoucherListProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCountry] = useState<string>("All");
  const [vouchersPerPage] = useState<number>(50);

  // Single day filter
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  const indexOfLastVoucher = currentPage * vouchersPerPage;
  const indexOfFirstVoucher = indexOfLastVoucher - vouchersPerPage;

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const matchesCountry =
        selectedCountry === "All" ||
        voucher.Country?.toLowerCase() === selectedCountry.toLowerCase();

      const matchesDate =
        !filterDate || isSameDay(parseISO(voucher.SaleEntryDate), filterDate);

      return matchesCountry && matchesDate;
    });
  }, [vouchers, selectedCountry, filterDate]);

  const currentVouchers = useMemo(() => {
    return filteredVouchers.slice(indexOfFirstVoucher, indexOfLastVoucher);
  }, [filteredVouchers, indexOfFirstVoucher, indexOfLastVoucher]);

  const handleCheckboxChange = (index: number) => {
    const updatedSelection = [...selectedEntries];
    if (updatedSelection.includes(index)) {
      updatedSelection.splice(updatedSelection.indexOf(index), 1);
    } else {
      updatedSelection.push(index);
    }
    onSelect(updatedSelection);
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    onSelect(selectAll ? [] : vouchers.map((_, index) => index));
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="overflow-y-auto bg-slate-100 mt-3 pb-4 pt-2">
      {/* Single Date Picker */}
      <div className="flex gap-4 mb-4 items-center justify-center">
        <div>
          <label className="text-sm text-gray-700">Filter by Sale Entry Date: &nbsp;</label>
          <DatePicker
            selected={filterDate}
            onChange={(date: Date | null) => setFilterDate(date)}
            dateFormat="MM/dd/yyyy"
            className="border rounded p-2"
            placeholderText="Select a date"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAllChange}
              />
            </TableHead>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Invoice No</TableHead>
            <TableHead>Sale ID</TableHead>
            <TableHead>Invoice Entry Date</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>PNR</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead>Fin Prefix</TableHead>
            <TableHead>Final Rate</TableHead>
            <TableHead>Sale Entry Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentVouchers.map((voucher, index) => (
            <TableRow key={voucher.InvoiceID}>
              <TableCell>
                <Checkbox
                  checked={selectAll || selectedEntries.includes(index)}
                  onCheckedChange={() => handleCheckboxChange(index)}
                />
              </TableCell>
              <TableCell>{voucher.InvoiceID}</TableCell>
              <TableCell>{voucher.InvoiceNo}</TableCell>
              <TableCell>{voucher.SaleID}</TableCell>
              <TableCell>
                {format(
                  parseISO(voucher.InvoiceEntryDate),
                  "MM/dd/yyyy HH:mm:ss"
                )}
              </TableCell>
              <TableCell>
                {voucher.Country
                  ? `${voucher.CityName}, ${voucher.Country}`
                  : voucher.CityName}
              </TableCell>
              <TableCell>{voucher.Pnr}</TableCell>
              <TableCell>{voucher.AccountName}</TableCell>
              <TableCell>{voucher.FinPrefix}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(voucher.FinalRate)}
              </TableCell>
              <TableCell>
                {format(parseISO(voucher.SaleEntryDate), "MM/dd/yyyy HH:mm:ss")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="flex items-center justify-center mt-4 gap-2">
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        <span className="text-sm text-gray-500">
          Page {currentPage} of{" "}
          {Math.ceil(filteredVouchers.length / vouchersPerPage)}
        </span>
        <Button
          onClick={() =>
            setCurrentPage((prev) =>
              indexOfLastVoucher < filteredVouchers.length ? prev + 1 : prev
            )
          }
          disabled={indexOfLastVoucher >= filteredVouchers.length}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  )
  }