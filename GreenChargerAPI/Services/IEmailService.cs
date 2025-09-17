using System.Threading.Tasks;
using System.Collections.Generic;

namespace GreenChargerAPI.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = false);
        Task SendPasswordResetEmailAsync(string to, string resetLink);
        Task SendRegistrationEmailAsync(string to, string confirmLink);
        Task SendPaymentSuccessEmailAsync(string to, string customerName, int orderId, decimal totalAmount, IEnumerable<object> orderItems);
    }
}