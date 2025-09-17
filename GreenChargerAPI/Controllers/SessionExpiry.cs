using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using GreenChargerAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Models;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/session")]
    public class SessionExpiryController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        
        public SessionExpiryController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }
        
        // POST: api/session/checkout-abandoned
        [HttpPost("checkout-abandoned")]
        public async Task<IActionResult> HandleAbandonedCheckout([FromBody] AbandonedCheckoutRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Invalid order information");
            }
            
            try
            {
                var order = await _unitOfWork.Orders.GetByIdAsync(request.OrderId, 
                    includeProperties: q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product));
                
                if (order == null)
                {
                    return NotFound($"Order with ID {request.OrderId} not found");
                }
                
                // Only cancel if order is still in Pending status
                if (order.Status == OrderStatus.Pending)
                {
                    // Restore inventory for all items in the order
                    foreach (var orderDetail in order.OrderDetails)
                    {
                        if (orderDetail.Product != null)
                        {
                            // Return items to inventory
                            orderDetail.Product.StockQuantity += orderDetail.Quantity;
                            _unitOfWork.Products.Update(orderDetail.Product);
                            Console.WriteLine($"Restored {orderDetail.Quantity} units to product {orderDetail.Product.Name} (ID: {orderDetail.ProductId})");
                        }
                    }
                    
                    // Update order status
                    order.Status = OrderStatus.Cancelled;
                    order.UpdatedAt = DateTime.UtcNow;
                    
                    _unitOfWork.Orders.Update(order);
                    await _unitOfWork.CompleteAsync();
                    
                    return Ok(new { message = "Order cancelled due to abandoned checkout", status = "Cancelled" });
                }
                
                return Ok(new { message = "Order already processed", status = order.Status.ToString() });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling abandoned checkout: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while processing", message = ex.Message });
            }
        }
    }
    
    public class AbandonedCheckoutRequest
    {
        public int OrderId { get; set; }
        public string Reason { get; set; } = "abandoned-checkout";
    }
}
