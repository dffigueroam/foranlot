import { NextResponse } from "next/server";
import { getLoteriaRanking } from "@/lib/ranking";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const lottery = searchParams.get("lottery");
  if (!country || !lottery) {
    return NextResponse.json({ ranking: [] });
  }
  const ranking = await getLoteriaRanking(lottery, country);
  return NextResponse.json({ ranking });
}
