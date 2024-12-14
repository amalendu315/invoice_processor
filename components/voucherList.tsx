"use client";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
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
  const [selectedCountry] = useState("All");
  const [vouchersPerPage] = useState(50);
  // Calculate the indexes for the current page
  const indexOfLastVoucher = currentPage * vouchersPerPage;
  const indexOfFirstVoucher = indexOfLastVoucher - vouchersPerPage;
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(
      (voucher) =>
        selectedCountry === "All" || voucher.Country?.toLowerCase() === selectedCountry.toLowerCase()
    );
  }, [vouchers, selectedCountry]);

  const currentVouchers = useMemo(() => {
    return filteredVouchers.slice(indexOfFirstVoucher, indexOfLastVoucher);
  }, [filteredVouchers, indexOfFirstVoucher, indexOfLastVoucher]);

  //@ts-expect-error due to index
  const handleCheckboxChange = (index) => {
    //@ts-expect-error due to prevSelected
    onSelect((prevSelected) => {
      const updatedSelection = [...prevSelected];
      if (updatedSelection.includes(index)) {
        updatedSelection.splice(updatedSelection.indexOf(index), 1);
      } else {
        updatedSelection.push(index);
      }
      return updatedSelection;
    });
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
  } else {
    return (
      <div className="overflow-y-auto bg-slate-100 mt-3 pb-4 pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAllChange}
                />
              </TableHead>
              <TableHead>Invoice ID</TableHead> {/* Added Invoice ID */}
              <TableHead>Invoice No</TableHead>
              <TableHead>Sale ID</TableHead> {/* Added Sale ID */}
              <TableHead>Invoice Entry Date</TableHead>
              <TableHead>Country</TableHead> {/* Added Prefix */}
              <TableHead>PNR</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Fin Prefix</TableHead> {/* Added Display Rate */}
              <TableHead>Final Rate</TableHead>
              <TableHead>Sale Entry Date</TableHead>
              {/* Added Sale Entry Date */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentVouchers.map((voucher, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox
                    checked={selectAll || selectedEntries.includes(index)}
                    onCheckedChange={() => handleCheckboxChange(index)}
                  />
                </TableCell>
                <TableCell>{voucher.InvoiceID}</TableCell>
                <TableCell>{voucher.InvoiceNo}</TableCell>
                <TableCell>{voucher.SaleID}</TableCell> {/* Added Sale ID */}
                <TableCell>
                  {format(
                    new Date(voucher.InvoiceEntryDate),
                    "MM/dd/yyyy HH:mm:ss"
                  )}
                </TableCell>
                {/* Added Invoice Entry Date */}
                <TableCell>
                  {voucher.Country
                    ? `${voucher.CityName}, ${voucher.Country}`
                    : voucher.CityName}
                </TableCell>{" "}
                {/* Added Prefix */}
                <TableCell>{voucher.Pnr}</TableCell>
                <TableCell>{voucher.AccountName}</TableCell>
                <TableCell>{voucher.FinPrefix}</TableCell>
                {/* Added Display Rate */}
                <TableCell>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(voucher.FinalRate)}
                </TableCell>
                <TableCell>
                  {format(
                    new Date(voucher.SaleEntryDate),
                    "MM/dd/yyyy HH:mm:ss"
                  )}
                </TableCell>
                {/* Added Sale Entry Date */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination controls */}
        <div className="flex items-center justify-center mt-4 gap-2">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {Math.ceil(vouchers.length / vouchersPerPage)}
          </span>
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={indexOfLastVoucher >= vouchers.length}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    );
  }
}
