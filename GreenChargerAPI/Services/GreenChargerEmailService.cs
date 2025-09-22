using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GreenChargerAPI.Services
{
    public class GreenChargerEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public GreenChargerEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = false)
        {
            try
            {
                var email = new MimeMessage();
                var settings = _configuration.GetSection("EmailSettings");

                email.From.Add(new MailboxAddress(settings["FromName"] ?? "GreenCharger", settings["FromEmail"] ?? "noreply@greencharger.com"));
                email.To.Add(MailboxAddress.Parse(to));
                email.Subject = subject;

                var builder = new BodyBuilder();
                if (isHtml)
                    builder.HtmlBody = body;
                else
                    builder.TextBody = body;

                email.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(
                    settings["SmtpServer"] ?? "smtp.gmail.com",
                    int.Parse(settings["Port"] ?? "587"),
                    SecureSocketOptions.StartTls
                );

                await smtp.AuthenticateAsync(settings["Username"] ?? "", settings["Password"] ?? "");
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Error sending email: {ex.Message}\n{ex.StackTrace}");
                throw; // vẫn ném lỗi ra ngoài để biết khi test
            }
        }

        public async Task SendPasswordResetEmailAsync(string to, string resetLink)
        {
            var subject = "Đặt lại mật khẩu - GreenCharger";
            var body = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <title>Đặt lại mật khẩu</title>
                </head>
                <body style='margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
                        <!-- Content -->
                        <div style='padding: 40px 30px;'>
                            <h2 style='color: #8B4513; margin-bottom: 20px; font-size: 24px;'>Đặt lại mật khẩu</h2>
                            <p style='color: #333; line-height: 1.6; margin-bottom: 20px;'>Xin chào,</p>
                            <p style='color: #333; line-height: 1.6; margin-bottom: 25px;'>
                                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản GreenCharger của mình. 
                                Vui lòng nhấp vào nút bên dưới để tạo mật khẩu mới:
                            </p>
                            <div style='text-align: center; margin: 35px 0;'>
                                <a href='{resetLink}' style='background: #2ecc71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;'>
                                    🔑 Đặt lại mật khẩu
                                </a>
                            </div>
                            <p style='color: #666; line-height: 1.6; font-size: 14px;'>
                                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. 
                                Mật khẩu của bạn sẽ không bị thay đổi.
                            </p>
                        </div>
                    </div>
                </body>
                </html>";
            await SendEmailAsync(to, subject, body, true);
        }

        public async Task SendRegistrationEmailAsync(string to, string confirmLink)
        {
            var subject = "Xác nhận đăng ký tài khoản - GreenCharger";
            var body = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <title>Chào mừng đến với GreenCharger</title>
                </head>
                <body style='margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
                        <div style='padding: 40px 30px;'>
                            <h2 style='color: #8B4513; margin-bottom: 20px; font-size: 24px;'>Chào mừng bạn đến với GreenCharger!</h2>
                            <p style='color: #333; line-height: 1.6; margin-bottom: 20px;'>Xin chào,</p>
                            <p style='color: #333; line-height: 1.6; margin-bottom: 25px;'>
                                Cảm ơn bạn đã đăng ký tài khoản tại GreenCharger - hệ thống sạc điện xanh bền vững.
                            </p>
                            <p style='color: #333; line-height: 1.6; margin-bottom: 25px;'>
                                Để hoàn tất đăng ký, vui lòng xác nhận địa chỉ email của bạn:
                            </p>
                            <div style='text-align: center; margin: 35px 0;'>
                                <a href='{confirmLink}' style='background: #2ecc71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;'>
                                    Xác nhận email
                                </a>
                            </div>
                            <p style='color: #666; line-height: 1.6; font-size: 14px;'>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
                        </div>
                    </div>
                </body>
                </html>";
            await SendEmailAsync(to, subject, body, true);
        }

        public async Task SendPaymentSuccessEmailAsync(string to, string customerName, int orderId, decimal totalAmount, IEnumerable<object> orderItems)
        {
            var subject = "Thanh toán thành công - GreenCharger";
            var itemsHtml = "";
            
            foreach (var item in orderItems)
            {
                dynamic dynItem = item;
                itemsHtml += $@"
                    <tr style='border-bottom: 1px solid #eee;'>
                        <td style='padding: 10px; text-align: left;'>{dynItem.ProductName}</td>
                        <td style='padding: 10px; text-align: center;'>{dynItem.Quantity}</td>
                        <td style='padding: 10px; text-align: right;'>{dynItem.UnitPrice:N0}₫</td>
                        <td style='padding: 10px; text-align: right; font-weight: bold;'>{dynItem.Subtotal:N0}₫</td>
                    </tr>";
            }
            
            var body = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <title>Thanh toán thành công</title>
                    <style>
                        @media screen and (max-width: 600px) {{
                            .container {{ max-width: 100% !important; margin: 0 !important; }}
                            .content {{ padding: 20px !important; }}
                            .button {{ display: block !important; margin: 10px 0 !important; }}
                            .total-section {{ padding: 15px !important; }}
                            table {{ font-size: 12px !important; }}
                            th, td {{ padding: 8px !important; }}
                        }}
                    </style>
                </head>
                <body style='margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, sans-serif; line-height: 1.6;'>
                    <div class='container' style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);'>
                        <!-- Content -->
                        <div style='padding: 30px;'>
                            <h2 style='color: #8B4513; margin-bottom: 20px;'>Xin chào {customerName},</h2>
                            <p style='color: #333; line-height: 1.6; margin-bottom: 20px;'>
                                Chúng tôi đã nhận được thanh toán của bạn và đơn hàng của bạn đang được xử lý. 
                                Dưới đây là chi tiết đơn hàng:
                            </p>
                            <!-- Order Info -->
                            <div style='background-color: #FFF8DC; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 5px solid #D2691E;'>
                                <h3 style='color: #8B4513; margin-top: 0;'>📋 Thông tin đơn hàng</h3>
                                <p style='margin: 5px 0; color: #333;'><strong>Mã đơn hàng:</strong> #{orderId}</p>
                                <p style='margin: 5px 0; color: #333;'><strong>Ngày đặt:</strong> {DateTime.Now:dd/MM/yyyy HH:mm}</p>
                                <p style='margin: 5px 0; color: #333;'><strong>Trạng thái:</strong> <span style='color: #28a745; font-weight: bold;'>Đã thanh toán</span></p>
                            </div>
                            <!-- Order Items -->
                            <div style='margin: 25px 0;'>
                                <h3 style='color: #8B4513; margin-bottom: 15px;'>🛒 Chi tiết sản phẩm</h3>
                                <table style='width: 100%; border-collapse: collapse; background-color: #f9f9f9; border-radius: 8px; overflow: hidden;'>
                                    <thead>
                                        <tr style='background-color: #8B4513; color: white;'>
                                            <th style='padding: 12px; text-align: left;'>Sản phẩm</th>
                                            <th style='padding: 12px; text-align: center;'>SL</th>
                                            <th style='padding: 12px; text-align: right;'>Đơn giá</th>
                                            <th style='padding: 12px; text-align: right;'>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsHtml}
                                    </tbody>
                                </table>
                            </div>
                            <!-- Total -->
                            <div style='background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px solid #D2691E;'>
                                <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;'>
                                    <span style='color: #333; font-size: 16px;'>Tổng tiền sản phẩm:</span>
                                    <span style='color: #333; font-size: 16px;'>{totalAmount - 30000:N0}₫</span>
                                </div>
                                <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;'>
                                    <span style='color: #333; font-size: 16px;'>Phí vận chuyển:</span>
                                    <span style='color: #333; font-size: 16px;'>30,000₫</span>
                                </div>
                                <hr style='border: 0; border-top: 1px solid #D2691E; margin: 15px 0;'>
                                <div style='display: flex; justify-content: space-between; align-items: center;'>
                                    <span style='color: #8B4513; font-size: 20px; font-weight: bold;'>Tổng cộng:</span>
                                    <span style='color: #8B4513; font-size: 20px; font-weight: bold;'>{totalAmount:N0}₫</span>
                                </div>
                            </div>
                            <!-- Next Steps -->
                            <div style='background-color: #e7f3ff; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 5px solid #007bff;'>
                                <h3 style='color: #007bff; margin-top: 0;'>📦 Bước tiếp theo</h3>
                                <ul style='color: #333; padding-left: 20px; margin: 0;'>
                                    <li>Đơn hàng của bạn sẽ được đóng gói trong 1-2 ngày làm việc</li>
                                    <li>Bạn sẽ nhận được email thông báo khi đơn hàng được gửi đi</li>
                                    <li>Thời gian giao hàng dự kiến: 3-5 ngày làm việc</li>
                                    <li>Bạn có thể theo dõi đơn hàng trong tài khoản của mình</li>
                                </ul>
                            </div>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='http://www.greencharger.me/orders' style='background: #2ecc71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(46,204,113,0.3); margin-right: 15px;'>
                                    📋 Xem đơn hàng
                                </a>
                               
                            </div>
                        </div>
                    </div>
                </body>
                </html>";
                
            await SendEmailAsync(to, subject, body, true);
        }
    }
}
