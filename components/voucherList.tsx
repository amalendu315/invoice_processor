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
  Types: string;
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
  const [vouchersPerPage] = useState<number>(50);

  // Filters
  const [filterInvoice, setFilterInvoice] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>("All");
  const [filterPnr, setFilterPnr] = useState<string>("");
  // const [filterType, setFilterType] = useState<string>("All");

  const indexOfLastVoucher = currentPage * vouchersPerPage;
  const indexOfFirstVoucher = indexOfLastVoucher - vouchersPerPage;

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const matchesCountry =
        filterCountry === "All" ||
        voucher.Country?.toLowerCase() === filterCountry.toLowerCase();

      const matchesInvoiceNumber =
        filterInvoice === null || Number(voucher.InvoiceNo) === filterInvoice;

      const matchesDate =
        !filterDate || isSameDay(parseISO(voucher.SaleEntryDate), filterDate);

      const matchesPnr =
        filterPnr === "" ||
        voucher.Pnr?.toLowerCase().includes(filterPnr.toLowerCase());

      // const matchesType =
      //   filterType === "All" ||
      //   voucher.Types?.toLowerCase() === filterType.toLowerCase();

      return (
        matchesCountry &&
        matchesInvoiceNumber &&
        matchesDate &&
        matchesPnr
      );
    });
  }, [
    vouchers,
    filterCountry,
    filterInvoice,
    filterDate,
    filterPnr,
  ]);

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
      {/* Filters */}
      <div className="flex gap-4 mb-4 items-center justify-center">
        <div>
          <label className="text-sm text-gray-700">
            Filter by Invoice No: &nbsp;
          </label>
          <input
            type="number"
            value={filterInvoice || ""}
            onChange={(e) => {
              const value = e.target.value;
              setFilterInvoice(value === "" ? null : Number(value));
            }}
            className="border rounded p-2"
            placeholder="Enter Invoice Number"
          />
        </div>
        {/* Date Picker */}
        <div>
          <label className="text-sm text-gray-700">
            Filter by Sale Entry Date: &nbsp;
          </label>
          <DatePicker
            selected={filterDate}
            onChange={(date: Date | null) => setFilterDate(date)}
            dateFormat="MM/dd/yyyy"
            className="border rounded p-2"
            placeholderText="Select a date"
          />
        </div>

        {/* Country Filter */}
        <div>
          <label className="text-sm text-gray-700">
            Filter by Country: &nbsp;
          </label>
          <select
            className="border rounded p-2"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="All">All</option>
            <option value="India">India</option>
            <option value="Nepal">Nepal</option>
          </select>
        </div>

        {/* PNR Filter */}
        <div>
          <label className="text-sm text-gray-700">Filter by PNR: &nbsp;</label>
          <input
            type="text"
            value={filterPnr}
            onChange={(e) => setFilterPnr(e.target.value)}
            className="border rounded p-2"
            placeholder="Enter PNR"
          />
        </div>
      </div>

      {/* Table */}
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
            <TableHead>Address</TableHead>
            <TableHead>PNR</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead>Pax Qty</TableHead>
            <TableHead>Total Rate</TableHead>
            <TableHead>Sale Entry Date</TableHead>
            <TableHead>Types</TableHead>
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
              <TableCell>{voucher.pax}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(voucher.FinalRate * voucher.pax)}
              </TableCell>
              <TableCell>
                {format(parseISO(voucher.SaleEntryDate), "MM/dd/yyyy HH:mm:ss")}
              </TableCell>
              <TableCell>{voucher.Types}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
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
  );
}
