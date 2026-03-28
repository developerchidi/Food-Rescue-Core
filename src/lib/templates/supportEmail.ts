
export const getSupportEmailTemplate = (name: string, email: string, message: string) => {
  const subject = `[Food Rescue] Yêu cầu hỗ trợ mới từ ${name}`;

  const text = `
FOOD RESCUE - HỆ THỐNG HỖ TRỢ

Xin chào Admin,

Bạn vừa nhận được một yêu cầu hỗ trợ mới.

CHI TIẾT NGƯỜI GỬI
------------------
Họ tên: ${name}
Email: ${email}
Thời gian: ${new Date().toLocaleString('vi-VN')}

NỘI DUNG TIN NHẮN
------------------
${message}
------------------

Vui lòng phản hồi yêu cầu này sớm nhất có thể.

Trân trọng,
Đội ngũ Food Rescue
`;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Support Request</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700;900&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  
  <style>
    /* Reset */
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #fdfcf8; }
    
    /* Font Stack */
    body, td, th {
      font-family: 'Be Vietnam Pro', 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    /* Layout */
    .wrapper { width: 100%; background-color: #fdfcf8; padding: 40px 0; }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      border-radius: 20px; 
      box-shadow: 0 5px 25px rgba(0,0,0,0.03); 
      overflow: hidden; 
      border: 1px solid #f1f2f6;
    }

    /* Header */
    .header { text-align: center; padding: 40px 0 20px 0; }
    
    .logo-text { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .text-food { color: #81A49C; }
    .text-rescue { color: #A8E6CF; }

    .header-title { 
      color: #009975; 
      font-size: 24px; 
      font-weight: 900; 
      margin-top: 15px; 
      margin-bottom: 5px;
      letter-spacing: -0.8px;
    }
    
    /* Content */
    .content { padding: 20px 40px 40px 40px; }
    
    /* Info Card Styles */
    .info-group { margin-bottom: 25px; }
    .label { 
      font-size: 11px; 
      color: #636e72; 
      text-transform: uppercase; 
      font-weight: 600; 
      letter-spacing: 0.8px; 
      margin-bottom: 8px; 
      display: block; 
    }
    .value { 
      font-size: 16px; 
      color: #2d3436; 
      font-weight: 500; 
      line-height: 1.5; 
    }

    /* Message Box */
    .message-card {
      background-color: #f8f9fa;
      padding: 24px;
      margin-top: 16px;
      border-radius: 12px;
      border: 1px dashed #00b89430;
    }
    .message-content {
      color: #2d3436;
      font-size: 15px;
      line-height: 1.7;
      white-space: pre-wrap;
      font-style: italic;
    }

    /* Button */
    .btn-wrap { text-align: center; margin-top: 35px; }
    .btn {
      background-color: #00b894;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 15px;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(0, 184, 148, 0.2);
    }
    
    /* Footer */
    .footer { 
      background-color: #fdfcf8; 
      padding: 30px; 
      text-align: center; 
      border-top: 1px solid #dfe6e9; 
    }
    .footer-text { font-size: 12px; color: #b2bec3; font-weight: 500; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <div class="header">
        <div class="logo-text">
          <span class="text-food">Food</span><span class="text-rescue">Rescue</span>
        </div>
        <div class="header-title">Yêu Cầu Hỗ Trợ</div>
      </div>

      <div class="content">
        <div style="margin-bottom: 30px; text-align: center;">
          <p style="color: #636e72; margin: 0; font-size: 14px;">Hệ thống vừa nhận được thông báo hỗ trợ từ người dùng mới.</p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" valign="top" style="padding-bottom: 25px;">
              <span class="label">Người gửi</span>
              <span class="value" style="font-weight: 700;">${name}</span>
            </td>
            <td width="50%" valign="top" style="padding-bottom: 25px;">
              <span class="label">Thời gian</span>
              <span class="value" style="font-size: 14px;">${new Date().toLocaleString('vi-VN')}</span>
            </td>
          </tr>
        </table>

        <div class="info-group">
          <span class="label">Địa chỉ Email</span>
          <a href="mailto:${email}" class="value" style="color: #00b894; text-decoration: none; font-weight: 600;">${email}</a>
        </div>

        <div class="info-group">
          <span class="label">Nội dung yêu cầu</span>
          <div class="message-card">
            <div class="message-content">${message}</div>
          </div>
        </div>

        <div class="btn-wrap">
          <a href="mailto:${email}?subject=${encodeURIComponent(`Re: [Food Rescue] Phản hồi yêu cầu hỗ trợ`)}" class="btn">
            Gửi Phản Hồi
          </a>
        </div>
      </div>

      <div class="footer">
        <div class="footer-text">© ${new Date().getFullYear()} FOOD RESCUE VIETNAM • SYSTEM ADMIN</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, text, html };
};
