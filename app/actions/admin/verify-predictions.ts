"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function verifyPredictionsFromResults() {
  try {
    await sql`
      UPDATE predictions p
      SET
        is_verified = true,
        is_correct = CASE
          WHEN p.lottery_type = '4_digits' AND p.predicted_number = r.digits_4 THEN true
          WHEN p.lottery_type = '3_digits' AND p.predicted_number = r.digits_3 THEN true
          WHEN p.lottery_type = '2_digits' AND p.predicted_number = r.digits_2 THEN true
          ELSE false
        END,
        actual_number = CASE
          WHEN p.lottery_type = '4_digits' THEN r.digits_4
          WHEN p.lottery_type = '3_digits' THEN r.digits_3
          WHEN p.lottery_type = '2_digits' THEN r.digits_2
        END
      FROM lottery_results r
      WHERE
        p.lottery_name = r.lottery_name
        AND p.draw_date = r.draw_date
        AND p.is_verified = false;
    `
    return { success: true }
  } catch (error) {
    console.error("Error verifying predictions", error)
    return { error: "No se pudieron verificar los pronósticos" }
  }
}
