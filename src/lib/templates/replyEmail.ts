
export const getReplyEmailTemplate = (originalName: string, replyMessage: string) => {
  const subject = `[Food Rescue] Phản hồi yêu cầu hỗ trợ của bạn`;

  const text = `
Chào ${originalName},

Cảm ơn bạn đã liên hệ với Food Rescue. Dưới đây là phản hồi từ đội ngũ hỗ trợ của chúng tôi:

${replyMessage}

Nếu bạn cần thêm thông tin, vui lòng trả lời email này hoặc liên hệ qua hotline.

Trân trọng,
Đội ngũ Food Rescue
`;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Be Vietnam Pro', sans-serif; background-color: #fdfcf8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #fdfcf8; padding: 40px 0; }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 24px; 
      overflow: hidden; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.02);
      border: 1px solid #f1f2f6;
    }
    
    /* Header */
    .header { text-align: center; padding: 45px 30px 25px 30px; }
    .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 20px; }
    .text-food { color: #81A49C; }
    .text-rescue { color: #A8E6CF; }
    
    /* Content */
    .content { padding: 0 45px 45px 45px; color: #2d3436; line-height: 1.8; font-size: 15px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1a4d44; margin-bottom: 20px; display: block; }
    
    /* Reply Box */
    .reply-box { 
      background: #fdfcf8; 
      border-radius: 16px; 
      padding: 30px; 
      margin: 25px 0; 
      border: 1px dashed #00b89430;
      color: #2d3436;
      font-style: italic;
    }
    
    .signature { 
      margin-top: 40px; 
      padding-top: 25px; 
      border-top: 1px solid #f1f2f6;
    }
    
    /* Footer */
    .footer { 
      text-align: center; 
      padding: 30px; 
      font-size: 11px; 
      color: #b2bec3; 
      background: #fdfcf8; 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">
          <span class="text-food">Food</span><span class="text-rescue">Rescue</span>
        </div>
        <div style="height: 2px; width: 40px; background: #00b894; margin: 0 auto;"></div>
      </div>
      
      <div class="content">
        <span class="greeting">Xin chào ${originalName},</span>
        <p>Cảm ơn bạn đã liên hệ với <strong>Food Rescue</strong>. Chúng tôi đã nhận được yêu cầu của bạn và xin được phản hồi cụ thể như sau:</p>
        
        <div class="reply-box">
          ${replyMessage.replace(/\n/g, '<br/>')}
        </div>

        <p>Hy vọng phản hồi này đã giải đáp được thắc mắc của bạn. Nếu bạn cần hỗ trợ thêm bất cứ điều gì, đừng ngần ngại trả lời email này hoặc liên lạc với chúng tôi qua các kênh hỗ trợ chính thức nhé.</p>
        
        <div class="signature">
          Chúc bạn một ngày tốt lành,<br/>
          <strong>Đội ngũ vận hành Food Rescue</strong>
        </div>
      </div>
      
      <div class="footer">
        &copy; ${new Date().getFullYear()} Food Rescue Vietnam • Community First
      </div>
    </div>
  </div>
</body>
</html>
  `;
  return { subject, text, html };
};
