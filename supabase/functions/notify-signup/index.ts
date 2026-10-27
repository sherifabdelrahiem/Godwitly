const functionName = "notify-signup";
const resendUrl = "https://api.resend.com/emails";
const dashboardUrl =
  "https://supabase.com/dashboard/project/ijpvbxglhxktnkabjdif/editor";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const jsonResponse = (status: number, body: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const constantTimeEqual = async (left: string, right: string) => {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }

  return difference === 0;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const expectedSecret = Deno.env.get("WEBHOOK_SECRET") ?? "";
  const suppliedSecret = request.headers.get("x-webhook-secret") ?? "";
  if (
    expectedSecret.length === 0 ||
    !(await constantTimeEqual(suppliedSecret, expectedSecret))
  ) {
    return jsonResponse(401, { error: "unauthorized" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "invalid_request" });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    !("created_at" in body) ||
    typeof body.id !== "string" ||
    typeof body.created_at !== "string" ||
    !uuidPattern.test(body.id) ||
    Number.isNaN(Date.parse(body.created_at))
  ) {
    return jsonResponse(400, { error: "invalid_request" });
  }

  const id = body.id;
  const createdAt = new Date(body.created_at).toISOString();

  try {
    const resendResponse = await fetch(resendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY") ?? ""}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `signup-${id}`,
      },
      body: JSON.stringify({
        from: "Godwitly <onboarding@resend.dev>",
        to: [Deno.env.get("NOTIFY_TO") ?? ""],
        subject: "New Godwitly sign-up",
        text: `Time (UTC): ${createdAt}\nRow ID: ${id}\nDashboard: ${dashboardUrl}`,
      }),
    });

    if (!resendResponse.ok) {
      console.error(
        `${functionName}: row ${id}, send failed, HTTP ${resendResponse.status}`,
      );
      return jsonResponse(502, { error: "send_failed" });
    }

    console.log(
      `${functionName}: row ${id}, sent, HTTP ${resendResponse.status}`,
    );
    return jsonResponse(200, { status: "sent" });
  } catch {
    console.error(`${functionName}: row ${id}, send failed, HTTP 502`);
    return jsonResponse(502, { error: "send_failed" });
  }
});
