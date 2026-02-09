"use server"

import { getRanking, getDailyAccuracy, getAccuracyByType, getUserStats } from "@/lib/ranking"

export async function fetchRanking(limit?: number) {
  return await getRanking(limit)
}

export async function fetchDailyAccuracy(userId: number) {
  return await getDailyAccuracy(userId)
}

export async function fetchAccuracyByType(userId: number) {
  return await getAccuracyByType(userId)
}

export async function fetchUserStats(userId: number) {
  return await getUserStats(userId)
}
