import { getPaymentMethods } from "@/lib/payment-methods";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const paymentMethods = getPaymentMethods();
    return NextResponse.json({
      paymentMethods,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
