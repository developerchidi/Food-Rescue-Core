export const getPartnershipEmailTemplate = (
  name: string,
  email: string,
  company: string,
  phone: string,
  type: string,
  message: string
) => {
  const subject = `[Food Rescue] Đề xuất hợp tác từ ${company}`;

  const text = `
YÊU CẦU HỢP TÁC - FOOD RESCUE
--------------------------------
DOANH NGHIỆP: ${company}
LIÊN HỆ: ${name} - ${phone}
EMAIL: ${email}
LOẠI HÌNH: ${type}
--------------------------------
"${message}"
--------------------------------
`;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Partnership Email</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700;900&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  
  <style>
    /* Reset */
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #fdfcf8; }
    
    /* Font Stack an toàn cho tiếng Việt: Ưu tiên Be Vietnam Pro */
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
    
    /* LOGO CHUẨN MÀU */
    .logo-text { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .text-food { color: #81A49C; } /* Màu xám nhạt cho chữ Food */
    .text-rescue { color: #A8E6CF; } /* Màu xanh Mint chuẩn cho chữ Rescue */

    .header-title { 
      color: #009975; 
      font-size: 24px; 
      font-weight: 900; 
      margin-top: 15px; 
      margin-bottom: 5px;
      font-family: 'Be Vietnam Pro', sans-serif;
      letter-spacing: -0.8px;
    }
    
    /* Content */
    .content { padding: 20px 40px 40px 40px; }
    
    /* Info Card Styles */
    .info-group { margin-bottom: 25px; }
    .label { 
      font-size: 12px; 
      color: #636e72; 
      text-transform: uppercase; 
      font-weight: 600; 
      letter-spacing: 0.5px; 
      margin-bottom: 8px; 
      display: block; 
    }
    .value { 
      font-size: 16px; 
      color: #2d3436; 
      font-weight: 500; 
      line-height: 1.5; 
    }

    /* Highlight Type Badge */
    .badge {
      color: #009975;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      display: inline-block;
    }

    /* Message Box - Giống style card trên web */
    .message-card {
      background-color: #f8f9fa;
      padding: 20px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .message-content {
      color: #2d3436;
      font-size: 15px;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    /* Button */
    .btn-wrap { text-align: center; margin-top: 35px; }
    .btn {
      background-color: #00b894;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 35px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      display: inline-block;
      box-shadow: 0 4px 6px rgba(0, 184, 148, 0.2);
    }
    
    /* Footer */
    .footer { 
      background-color: #fdfcf8; 
      padding: 20px; 
      text-align: center; 
      border-top: 1px solid #dfe6e9; 
    }
    .footer-text { font-size: 12px; color: #b2bec3; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <div class="header">
        <div class="logo-text">
          <span class="text-food">Food</span><span class="text-rescue">Rescue</span>
        </div>
        <div class="header-title">Đề Xuất Hợp Tác Mới</div>
      </div>

      <div class="content">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="60%" valign="top" style="padding-bottom: 20px;">
              <span class="label">Doanh nghiệp</span>
              <span class="value" style="font-size: 18px; font-weight: 700;">${company}</span>
            </td>
            <td width="40%" valign="top" style="padding-bottom: 20px;">
              <span class="label">Phân loại</span>
              <span class="badge">${type}</span>
            </td>
          </tr>
          <tr>
            <td width="60%" valign="top" style="padding-bottom: 20px;">
              <span class="label">Người liên hệ</span>
              <span class="value">${name}</span>
            </td>
            <td width="40%" valign="top" style="padding-bottom: 20px;">
              <span class="label">Số điện thoại</span>
              <span class="value" style="font-family: monospace; letter-spacing: -0.5px; font-size: 16px;">${phone}</span>
            </td>
          </tr>
        </table>

        <div class="info-group">
          <span class="label">Email</span>
          <a href="mailto:${email}" class="value" style="color: #00b894; text-decoration: none;">${email}</a>
        </div>

        <div class="info-group">
          <span class="label">Lời nhắn từ đối tác</span>
          <div class="message-card">
            <div class="message-content">${message}</div>
          </div>
        </div>

        <div class="btn-wrap">
          <a href="mailto:${email}?subject=${encodeURIComponent(`[Food Rescue] Phản hồi: Hợp tác cùng ${company}`)}" class="btn">
            Phản Hồi Ngay
          </a>
        </div>
      </div>

      <div class="footer">
        <div class="footer-text">© ${new Date().getFullYear()} Food Rescue System</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, text, html };
};