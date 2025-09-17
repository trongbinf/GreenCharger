using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Security.Cryptography;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Models;
using GreenChargerAPI.Services;
using GreenChargerAPI.Data;
using Microsoft.AspNetCore.Identity;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public PaymentController(IHttpClientFactory httpClientFactory, IConfiguration configuration, IUnitOfWork unitOfWork, IEmailService emailService, ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _context = context;
            _userManager = userManager;
        }

        // Helper method: Get UserId by Email
        private async Task<string?> GetUserIdByEmail(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            return user?.Id;
        }

        // Helper method: Clear cart by email
        private async Task<bool> ClearCartByEmailAsync(string email)
        {
            try
            {
                var userId = await GetUserIdByEmail(email);
                if (string.IsNullOrEmpty(userId))
                    return false;

                var carts = await _context.Carts.Where(c => c.UserId == userId).ToListAsync();
                if (carts.Any())
                {
                    _context.Carts.RemoveRange(carts);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"[PaymentController] Cart cleared for user with email: {email}");
                    return true;
                }
                return true; // No items to clear, consider success
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PaymentController] Failed to clear cart for email {email}: {ex.Message}");
                return false;
            }
        }





        [HttpGet("sepay-config")]
        public IActionResult GetSepayConfig()
        {
            var acc = _configuration["SePay:Account"] ?? string.Empty;
            var bank = _configuration["SePay:Bank"] ?? string.Empty;
            return Ok(new { acc, bank });
        }

        // Endpoint kiểm tra giao dịch bằng SePay API transactions list thực tế
        [HttpGet("sepay/transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] int? limit = 10)
        {
            var apiKey = _configuration["SePay:ApiKey"] ?? string.Empty;
            var accountNumber = _configuration["SePay:Account"] ?? string.Empty;

            var client = _httpClientFactory.CreateClient();
            var url = $"https://my.sepay.vn/userapi/transactions/list?account_number={accountNumber}&limit={limit}";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Authorization", $"Bearer {apiKey}");

            var response = await client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = "Failed to fetch transactions", details = body });

            return Content(body, "application/json");
        }



        // Endpoint để đồng bộ tất cả đơn hàng pending với transactions từ SePay
        [HttpPost("sepay/sync-payments")]
        public async Task<IActionResult> SyncPayments()
        {
            try
            {
                var apiKey = _configuration["SePay:ApiKey"] ?? string.Empty;
                var accountNumber = _configuration["SePay:AccountCheck"] ?? string.Empty;

                // Lấy tất cả đơn hàng pending
                var pendingOrders = await _unitOfWork.Orders.GetAllAsync(
                    o => o.Status == OrderStatus.Pending && o.CreatedAt > DateTime.Now.AddDays(-7) // Chỉ check đơn hàng trong 7 ngày gần đây
                );

                if (!pendingOrders.Any())
                {
                    return Ok(new { message = "Không có đơn hàng pending để kiểm tra", updatedCount = 0 });
                }

                // Lấy danh sách transactions từ SePay
                var client = _httpClientFactory.CreateClient();
                var url = $"https://my.sepay.vn/userapi/transactions/list?account_number={accountNumber}&limit=100";
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Authorization", $"Bearer {apiKey}");

                var response = await client.SendAsync(request);
                var body = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, new { error = "Failed to fetch transactions from SePay" });

                var transactionData = JsonConvert.DeserializeObject<TransactionListResponse>(body);

                if (transactionData?.transactions == null)
                {
                    return Ok(new { message = "Không có giao dịch nào từ SePay", updatedCount = 0 });
                }

                int updatedCount = 0;

                // Kiểm tra từng đơn hàng pending
                foreach (var order in pendingOrders)
                {
                    var expectedContent = $"VIETCRAFTYORDER000{order.Id}";
                    var matchingTransaction = transactionData.transactions.FirstOrDefault(tx =>
                        tx.transaction_content != null &&
                        tx.transaction_content.Contains(expectedContent, StringComparison.OrdinalIgnoreCase) &&
                        tx.amount_in >= order.TotalAmount &&
                        tx.transaction_date > order.CreatedAt.AddMinutes(-5) // Giao dịch phải sau khi tạo order
                    );

                    if (matchingTransaction != null)
                    {
                        // Cập nhật trạng thái order
                        order.Status = OrderStatus.Processing;
                        order.UpdatedAt = DateTime.UtcNow;
                        _unitOfWork.Orders.Update(order);
                        updatedCount++;

                        // Send payment success email for synced orders
                        try
                        {
                            // Get order details for email
                            var orderWithDetails = await _unitOfWork.Orders.GetByIdAsync(
                                order.Id,
                                q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product)
                            );

                            if (orderWithDetails?.OrderDetails != null)
                            {
                                var orderItems = orderWithDetails.OrderDetails.Select(od => new
                                {
                                    ProductName = od.Product?.Name ?? "Sản phẩm không xác định",
                                    Quantity = od.Quantity,
                                    UnitPrice = od.UnitPrice,
                                    Subtotal = od.Subtotal
                                }).Cast<object>().ToList();

                                await _emailService.SendPaymentSuccessEmailAsync(
                                    order.CustomerEmail,
                                    order.CustomerName,
                                    order.Id,
                                    order.TotalAmount,
                                    orderItems // List<object> is compatible with IEnumerable<object>
                                );

                                Console.WriteLine($"[PaymentController] Sync payment success email sent to {order.CustomerEmail} for order #{order.Id}");
                            }
                        }
                        catch (Exception emailEx)
                        {
                            Console.WriteLine($"[PaymentController] Failed to send sync payment success email for order #{order.Id}: {emailEx.Message}");
                        }

                        // Clear cart after successful sync payment
                        try
                        {
                            var cartCleared = await ClearCartByEmailAsync(order.CustomerEmail);
                            if (cartCleared)
                            {
                                Console.WriteLine($"[PaymentController] Cart cleared successfully for {order.CustomerEmail} after sync payment");
                            }
                            else
                            {
                                Console.WriteLine($"[PaymentController] Failed to clear cart for {order.CustomerEmail} after sync payment");
                            }
                        }
                        catch (Exception cartEx)
                        {
                            Console.WriteLine($"[PaymentController] Exception while clearing cart for {order.CustomerEmail} during sync: {cartEx.Message}");
                        }
                    }
                }

                if (updatedCount > 0)
                {
                    await _unitOfWork.CompleteAsync();
                }

                return Ok(new
                {
                    message = $"Đã cập nhật {updatedCount} đơn hàng thành công",
                    updatedCount,
                    totalPendingOrders = pendingOrders.Count()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        private string GenerateSePaySignature(string merchantId, string orderId, decimal amount, string secretKey)
        {
            var raw = $"{merchantId}{orderId}{amount}{secretKey}";
            using (SHA256 sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
                return BitConverter.ToString(bytes).Replace("-", "").ToLower();
            }
        }

        public class SenbayPaymentRequest
        {
            public int Amount { get; set; }
            public string? Description { get; set; }
            public string? OrderId { get; set; }
        }

        public class SePayPaymentRequest
        {
            public string? merchant_id { get; set; }
            public string? order_id { get; set; }
            public decimal amount { get; set; }
            public string? description { get; set; }
            public string? callback_url { get; set; }
            public string? signature { get; set; }
        }

        public class BankTransaction
        {
            public string? Content { get; set; }
            public decimal Amount { get; set; }
            public string? Status { get; set; }
        }

        // SePay transaction response models
        public class TransactionListResponse
        {
            public bool status { get; set; }
            public string? message { get; set; }
            public List<SepayTransaction>? transactions { get; set; }
        }

        public class SepayTransaction
        {
            public string? transaction_content { get; set; }
            public decimal amount_in { get; set; }
            public decimal amount_out { get; set; }
            public DateTime transaction_date { get; set; }
            public string? reference_number { get; set; }
            public string? account_number { get; set; }
        }

            [HttpGet("sepay/check-transaction")]
            public async Task<IActionResult> CheckSepayTransaction(string code, decimal amount)
            {
                  var apiKey = _configuration["SePay:ApiKey"] ?? string.Empty;
                var client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
                var response = await client.GetAsync("https://my.sepay.vn/userapi/transactions/list");
                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, "Không thể kết nối Sepay");
                var json = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrEmpty(json))
                    return Ok(new { success = false });
                var data = JObject.Parse(json);
                if ((int?)data["status"] != 200 || data["transactions"] == null)
                    return Ok(new { success = false });
                foreach (var tran in data["transactions"] ?? new JArray())
                {
                    string? content = (string?)tran["transaction_content"];
                    string? amountIn = (string?)tran["amount_in"];
                    if (!string.IsNullOrEmpty(content) && content.Contains(code) && decimal.TryParse(amountIn, out decimal amt) && amt == amount)
                    {
                        return Ok(new { success = true });
                    }
                }
                return Ok(new { success = false });
            }
        
        // Endpoint để cập nhật inventory realtime khi thanh toán thành công
        [HttpPost("sepay/update-inventory-realtime")]
        public async Task<IActionResult> UpdateInventoryRealtime([FromBody] UpdateInventoryRequest request)
        {
            try
            {
                var apiKey = _configuration["SePay:ApiKey"] ?? string.Empty;
                var accountNumber = _configuration["SePay:AccountCheck"] ?? string.Empty;

                // Lấy đơn hàng cần kiểm tra, luôn include OrderDetails và Product
                var order = await _unitOfWork.Orders.GetByIdAsync(
                    request.OrderId,
                    q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product)
                );

                if (order == null || order.Status != OrderStatus.Pending)
                {
                    return BadRequest(new { error = "Đơn hàng không tồn tại hoặc không ở trạng thái pending" });
                }

                if (order.OrderDetails == null || !order.OrderDetails.Any())
                {
                    return BadRequest(new { error = "Đơn hàng không có chi tiết sản phẩm" });
                }

                // Kiểm tra transaction từ SePay
                var client = _httpClientFactory.CreateClient();
                var url = $"https://my.sepay.vn/userapi/transactions/list?account_number={accountNumber}&limit=50";
                var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);
                httpRequest.Headers.Add("Authorization", $"Bearer {apiKey}");

                var response = await client.SendAsync(httpRequest);
                var body = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, new { error = "Không thể kết nối SePay" });

                var transactionData = JsonConvert.DeserializeObject<TransactionListResponse>(body);

                if (transactionData?.transactions == null)
                {
                    return Ok(new { success = false, message = "Không có giao dịch nào từ SePay" });
                }

                // Tìm transaction khớp với đơn hàng
                var expectedContent = $"VIETCRAFTYORDER000{order.Id}";
                var matchingTransaction = transactionData.transactions.FirstOrDefault(tx =>
                    tx.transaction_content != null &&
                    tx.transaction_content.Contains(expectedContent, StringComparison.OrdinalIgnoreCase) &&
                    tx.amount_in >= order.TotalAmount &&
                    tx.transaction_date > order.CreatedAt.AddMinutes(-5)
                );

                if (matchingTransaction != null)
                {
                    // Kiểm tra và cập nhật inventory cho từng sản phẩm
                    var inventoryUpdates = new List<InventoryUpdateResult>();
                    bool allProductsAvailable = true;

                    foreach (var orderDetail in order.OrderDetails)
                    {
                        if (orderDetail.Product == null)
                        {
                            allProductsAvailable = false;
                            inventoryUpdates.Add(new InventoryUpdateResult
                            {
                                ProductId = orderDetail.ProductId,
                                ProductName = null,
                                OldQuantity = 0,
                                NewQuantity = 0,
                                OrderQuantity = orderDetail.Quantity,
                                Success = false,
                                Error = "Không tìm thấy sản phẩm trong đơn hàng"
                            });
                            continue;
                        }
                        var product = orderDetail.Product;
                        if (product.StockQuantity >= orderDetail.Quantity)
                        {
                            // Cập nhật số lượng sản phẩm
                            product.StockQuantity -= orderDetail.Quantity;
                            _unitOfWork.Products.Update(product);

                            inventoryUpdates.Add(new InventoryUpdateResult
                            {
                                ProductId = product.Id,
                                ProductName = product.Name,
                                OldQuantity = product.StockQuantity + orderDetail.Quantity,
                                NewQuantity = product.StockQuantity,
                                OrderQuantity = orderDetail.Quantity,
                                Success = true
                            });
                        }
                        else
                        {
                            allProductsAvailable = false;
                            inventoryUpdates.Add(new InventoryUpdateResult
                            {
                                ProductId = product.Id,
                                ProductName = product.Name,
                                OldQuantity = product.StockQuantity,
                                NewQuantity = product.StockQuantity,
                                OrderQuantity = orderDetail.Quantity,
                                Success = false,
                                Error = "Không đủ số lượng trong kho"
                            });
                        }
                    }

                    if (allProductsAvailable)
                    {
                        // Cập nhật trạng thái đơn hàng
                        order.Status = OrderStatus.Processing;
                        order.UpdatedAt = DateTime.UtcNow;
                        _unitOfWork.Orders.Update(order);

                        await _unitOfWork.CompleteAsync();

                        // Send payment success email
                        try
                        {
                            // Prepare order items for email
                            var orderItems = order.OrderDetails.Select(od => new
                            {
                                ProductName = od.Product?.Name ?? "Sản phẩm không xác định",
                                Quantity = od.Quantity,
                                UnitPrice = od.UnitPrice,
                                Subtotal = od.Subtotal
                            }).Cast<object>().ToList();

                            await _emailService.SendPaymentSuccessEmailAsync(
                                order.CustomerEmail,
                                order.CustomerName,
                                order.Id,
                                order.TotalAmount,
                                orderItems
                            );

                            Console.WriteLine($"[PaymentController] Payment success email sent to {order.CustomerEmail} for order #{order.Id}");
                        }
                        catch (Exception emailEx)
                        {
                            // Log email error but don't fail the payment process
                            Console.WriteLine($"[PaymentController] Failed to send payment success email: {emailEx.Message}");
                        }

                        // Clear cart after successful payment
                        try
                        {
                            var cartCleared = await ClearCartByEmailAsync(order.CustomerEmail);
                            if (cartCleared)
                            {
                                Console.WriteLine($"[PaymentController] Cart cleared successfully for {order.CustomerEmail} after payment completion");
                            }
                            else
                            {
                                Console.WriteLine($"[PaymentController] Failed to clear cart for {order.CustomerEmail} after payment completion");
                            }
                        }
                        catch (Exception cartEx)
                        {
                            Console.WriteLine($"[PaymentController] Exception while clearing cart for {order.CustomerEmail}: {cartEx.Message}");
                        }

                        return Ok(new
                        {
                            success = true,
                            message = "Thanh toán thành công và đã cập nhật inventory",
                            orderId = order.Id,
                            orderStatus = order.Status.ToString(),
                            inventoryUpdates,
                            emailSent = true,
                            cartCleared = true
                        });
                    }
                    else
                    {
                        // Có sản phẩm hết hàng, hủy đơn hàng
                        order.Status = OrderStatus.Cancelled;
                        order.UpdatedAt = DateTime.UtcNow;
                        _unitOfWork.Orders.Update(order);
                        await _unitOfWork.CompleteAsync();

                        return Ok(new
                        {
                            success = false,
                            message = "Một số sản phẩm đã hết hàng, đơn hàng được hủy",
                            orderId = order.Id,
                            orderStatus = order.Status.ToString(),
                            inventoryUpdates
                        });
                    }
                }

                return Ok(new { success = false, message = "Chưa tìm thấy giao dịch thanh toán" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Lỗi server", message = ex.Message });
            }
        }

        // Endpoint kiểm tra tồn kho trước khi tạo đơn hàng
        [HttpPost("check-inventory")]
        public async Task<IActionResult> CheckInventory([FromBody] List<CartItemCheck> cartItems)
        {
            try
            {
                var inventoryCheck = new List<InventoryCheckResult>();
                bool allAvailable = true;

                foreach (var item in cartItems)
                {
                    var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId);
                    
                    if (product == null)
                    {
                        inventoryCheck.Add(new InventoryCheckResult
                        {
                            ProductId = item.ProductId,
                            RequestedQuantity = item.Quantity,
                            AvailableQuantity = 0,
                            IsAvailable = false,
                            Message = "Sản phẩm không tồn tại"
                        });
                        allAvailable = false;
                    }
                    else if (product.StockQuantity < item.Quantity)
                    {
                        inventoryCheck.Add(new InventoryCheckResult
                        {
                            ProductId = item.ProductId,
                            ProductName = product.Name,
                            RequestedQuantity = item.Quantity,
                            AvailableQuantity = product.StockQuantity,
                            IsAvailable = false,
                            Message = product.StockQuantity == 0 ? "Sản phẩm đã hết hàng" : $"Chỉ còn {product.StockQuantity} sản phẩm"
                        });
                        allAvailable = false;
                    }
                    else
                    {
                        inventoryCheck.Add(new InventoryCheckResult
                        {
                            ProductId = item.ProductId,
                            ProductName = product.Name,
                            RequestedQuantity = item.Quantity,
                            AvailableQuantity = product.StockQuantity,
                            IsAvailable = true,
                            Message = "Sản phẩm có sẵn"
                        });
                    }
                }

                return Ok(new 
                { 
                    allAvailable, 
                    inventoryCheck,
                    message = allAvailable ? "Tất cả sản phẩm đều có sẵn" : "Một số sản phẩm không đủ số lượng hoặc hết hàng"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Lỗi server", message = ex.Message });
            }
        }

        // Request/Response models for inventory management
        public class UpdateInventoryRequest
        {
            public int OrderId { get; set; }
        }

        public class CartItemCheck
        {
            public int ProductId { get; set; }
            public int Quantity { get; set; }
        }

        public class InventoryUpdateResult
        {
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public int OldQuantity { get; set; }
            public int NewQuantity { get; set; }
            public int OrderQuantity { get; set; }
            public bool Success { get; set; }
            public string? Error { get; set; }
        }

        public class InventoryCheckResult
        {
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public int RequestedQuantity { get; set; }
            public int AvailableQuantity { get; set; }
            public bool IsAvailable { get; set; }
            public string? Message { get; set; }
        }
    }
}