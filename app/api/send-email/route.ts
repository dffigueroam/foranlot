export async function POST() {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // usar este para pruebas
        to: ["tucorreo@gmail.com"],
        subject: "LotIQ | Lanzamiento",
        html: "<h1>Correo de prueba LotIQ</h1>",
      }),
    });

    const data = await response.json();

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error });
  }
}
