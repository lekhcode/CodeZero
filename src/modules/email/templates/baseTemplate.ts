export function baseEmailTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#100b07;font-family:Inter,Segoe UI,sans-serif;color:#f0ebe4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#100b07;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#1a1512;border:1px solid rgba(111,72,38,0.35);border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 8px;">
              <div style="font-family:'Fira Code',monospace;font-size:18px;font-weight:700;color:#d9990b;">c&lt;&gt;de<span style="color:#a99b76;">{0}</span></div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-size:14px;line-height:1.65;color:#f0ebe4;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-size:11px;color:#5c4f42;line-height:1.5;">
              If you did not request this email, you can safely ignore it. Never share your OTP with anyone.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
