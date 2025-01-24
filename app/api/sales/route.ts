import axios from "axios";
import { NextResponse } from "next/server";

import { salesURL,authorization,cookie } from "@/constants/index";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const formattedStartDate = startDate?.replace(/-/g, "/");
    const formattedEndDate = endDate?.replace(/-/g, "/");

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: salesURL,
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        Cookie:
          cookie,
      },
      data: {
        from_date: formattedStartDate,
        to_date: formattedEndDate,
      },
    };

    const response = await axios.request(config);
    if(response?.data?.code === '404'){
      return NextResponse.json(
        { error: "No Data Found" },
        { status: 404 }
      );
    }
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales entries" },
      { status: 500 }
    );
  }
}
