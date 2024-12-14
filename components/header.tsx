"use client";
import SumContext from '@/context/SumContext';
import React from 'react'

const Header = () => {
  const {totalSum} = React.useContext(SumContext)
  return (
    <>
      <div className=" flex justify-center items-center bg-gradient-to-r from-gray-800 to-gray-900">
        <header className="text-white text-center text-3xl font-bold p-2 flex flex-col items-center justify-around w-full gap-4">
          {/* Added flex items-center */}
          <h3>Voucher Processor</h3>
          {/* Conditionally render myValue */}
          <p className="text-white text-sm font-bold pb-2">
            Enter date range and process entries
          </p>
        </header>
        {totalSum !== 0 && (
          <p className="text-white text-sm font-bold pb-2">
            Total Final Rate of All the Vouchers :-{" "}
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(totalSum)}
          </p>
        )}
      </div>
    </>
  );
}

export default Header