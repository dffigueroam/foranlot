import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateContractCompensation } from "@/lib/compensation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const data = await calculateContractCompensation();
  return NextResponse.json(data);
}
