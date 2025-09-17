using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Helpers;
using Microsoft.EntityFrameworkCore;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/orders")]
    public class OrderController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public OrderController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // GET: api/order
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] DateTime? startDate = null, 
            [FromQuery] DateTime? endDate = null,
            [FromQuery] OrderStatus? status = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = "asc")
        {
            // Build predicate for filtering
            System.Linq.Expressions.Expression<Func<Order, bool>>? predicate = null;

            if (status.HasValue)
            {
                predicate = o => o.Status == status.Value;
            }

            if (startDate.HasValue)
            {
                var startDatePredicate = PredicateBuilder.True<Order>().And(o => o.CreatedAt >= startDate.Value);
                predicate = predicate == null ? startDatePredicate : predicate.And(startDatePredicate);
            }

            if (endDate.HasValue)
            {
                // Add a day to include the end date fully
                var adjustedEndDate = endDate.Value.AddDays(1).AddTicks(-1);
                var endDatePredicate = PredicateBuilder.True<Order>().And(o => o.CreatedAt <= adjustedEndDate);
                predicate = predicate == null ? endDatePredicate : predicate.And(endDatePredicate);
            }

            // Get orders with filtering
            var orders = await _unitOfWork.Orders.GetAllAsync(
                predicate,
                q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product)
            );

            // Apply sorting
            if (!string.IsNullOrEmpty(sortBy))
            {
                switch (sortBy.ToLower())
                {
                    case "price":
                    case "totalamount":
                        orders = sortOrder?.ToLower() == "desc" 
                            ? orders.OrderByDescending(o => o.TotalAmount).ToList()
                            : orders.OrderBy(o => o.TotalAmount).ToList();
                        break;
                    case "date":
                    case "createdat":
                        orders = sortOrder?.ToLower() == "desc"
                            ? orders.OrderByDescending(o => o.CreatedAt).ToList()
                            : orders.OrderBy(o => o.CreatedAt).ToList();
                        break;
                    default:
                        // Default sort by newest orders
                        orders = orders.OrderByDescending(o => o.CreatedAt).ToList();
                        break;
                }
            }
            else
            {
                // Default sort by newest orders if no sort specified
                orders = orders.OrderByDescending(o => o.CreatedAt).ToList();
            }

            var orderDtos = orders.Select(order => new OrderDto
            {
                Id = order.Id,
                CustomerName = order.CustomerName,
                CustomerEmail = order.CustomerEmail,
                CustomerPhone = order.CustomerPhone,
                ShippingAddress = order.ShippingAddress,
                TotalAmount = order.TotalAmount,
                Status = order.Status.ToString(), // Changed to string for easier frontend handling
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                OrderDetails = order.OrderDetails.Select(od => new OrderDetailDto
                {
                    Id = od.Id,
                    OrderId = od.OrderId,
                    ProductId = od.ProductId,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice,
                    Subtotal = od.Subtotal,
                    Product = od.Product == null ? null : new OrderDetailProductDto
                    {
                        Name = od.Product.Name,
                        MainImageUrl = od.Product.MainImageUrl
                    }
                }).ToList()
            }).ToList();

            return Ok(orderDtos);
        }

        // GET: api/order/5
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _unitOfWork.Orders.GetByIdAsync(
                id,
                q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product)
            );
            
            if (order == null) 
                return NotFound($"Order with ID {id} not found.");
            
            var orderDto = new OrderDto
            {
                Id = order.Id,
                CustomerName = order.CustomerName,
                CustomerEmail = order.CustomerEmail,
                CustomerPhone = order.CustomerPhone,
                ShippingAddress = order.ShippingAddress,
                TotalAmount = order.TotalAmount,
                Status = order.Status.ToString(),
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                OrderDetails = order.OrderDetails.Select(od => new OrderDetailDto
                {
                    Id = od.Id,
                    OrderId = od.OrderId,
                    ProductId = od.ProductId,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice,
                    Subtotal = od.Subtotal,
                    Product = od.Product == null ? null : new OrderDetailProductDto
                    {
                        Name = od.Product.Name,
                        MainImageUrl = od.Product.MainImageUrl
                    }
                }).ToList()
            };
            
            return Ok(orderDto);
        }

        // POST: api/orders
        [HttpPost]
        public async Task<ActionResult<object>> CreateOrder([FromBody] CreateOrderDto orderDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Tạo Order từ DTO
            var order = new Order
            {
                CustomerName = orderDto.CustomerName,
                CustomerEmail = orderDto.CustomerEmail,
                CustomerPhone = orderDto.CustomerPhone,
                ShippingAddress = orderDto.ShippingAddress,
                CreatedAt = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                OrderDetails = new List<OrderDetail>()
            };

            // Tính tổng tiền và tạo OrderDetails
            decimal totalAmount = 0;
            foreach (var item in orderDto.OrderItems)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId);
                if (product == null)
                    return BadRequest($"Product with ID {item.ProductId} not found");

                var orderDetail = new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price,
                    Subtotal = item.Quantity * item.Price
                };

                order.OrderDetails.Add(orderDetail);
                totalAmount += orderDetail.Subtotal;

                // Cập nhật stock
                if (product.StockQuantity < item.Quantity)
                    return BadRequest($"Insufficient stock for product {product.Name}");
                
                product.StockQuantity -= item.Quantity;
                _unitOfWork.Products.Update(product);
            }

            // Thêm phí ship 30,000₫
            const decimal shippingFee = 30000;
            order.TotalAmount = totalAmount + shippingFee;

            await _unitOfWork.Orders.AddAsync(order);
            await _unitOfWork.CompleteAsync();

            // Trả về orderId cho FE sinh QR
            return Ok(new { orderId = order.Id.ToString(), totalAmount = order.TotalAmount });
        }

        // PUT: api/order/5/status
       
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string status)
        {
            var order = await _unitOfWork.Orders.GetByIdAsync(id);
            if (order == null)
                return NotFound($"Order with ID {id} not found.");

            if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
                return BadRequest("Invalid order status.");

            // Only allow certain status transitions
            if (!IsValidStatusTransition(order.Status, newStatus))
                return BadRequest("Invalid status transition.");

            order.Status = newStatus;
            order.UpdatedAt = DateTime.UtcNow;
            
            _unitOfWork.Orders.Update(order);
            await _unitOfWork.CompleteAsync();
            
            return Ok(new { message = "Order status updated successfully.", status = newStatus.ToString() });
        }

        // Helper method to validate status transitions
        private bool IsValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus)
        {
            switch (currentStatus)
            {
                case OrderStatus.Pending:
                    // From Pending, we can move to Processing or Cancelled
                    return newStatus == OrderStatus.Processing || newStatus == OrderStatus.Cancelled;
                
                case OrderStatus.Processing:
                    // From Processing, we can move to Shipped or Cancelled
                    return newStatus == OrderStatus.Shipped || newStatus == OrderStatus.Cancelled;
                
                case OrderStatus.Shipped:
                    // From Shipped, we can only move to Delivered
                    return newStatus == OrderStatus.Delivered;
                
                case OrderStatus.Delivered:
                case OrderStatus.Cancelled:
                    // These are final states, no transitions allowed
                    return false;
                
                default:
                    return false;
            }
        }

        // GET: api/order/customer/{email}
        [Authorize]
        [HttpGet("customer/{email}")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetCustomerOrders(string email)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                    return BadRequest("Email cannot be empty");

                var orders = await _unitOfWork.Orders.GetAllAsync(
                    o => o.CustomerEmail == email,
                    q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product)
                );

                var orderDtos = orders.Select(order => new OrderDto
                {
                    Id = order.Id,
                    CustomerName = order.CustomerName,
                    CustomerEmail = order.CustomerEmail,
                    CustomerPhone = order.CustomerPhone,
                    ShippingAddress = order.ShippingAddress,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status.ToString(),
                    CreatedAt = order.CreatedAt,
                    UpdatedAt = order.UpdatedAt,
                    OrderDetails = order.OrderDetails.Select(od => new OrderDetailDto
                    {
                        Id = od.Id,
                        OrderId = od.OrderId,
                        ProductId = od.ProductId,
                        Quantity = od.Quantity,
                        UnitPrice = od.UnitPrice,
                        Subtotal = od.Subtotal,
                        Product = od.Product == null ? null : new OrderDetailProductDto
                        {
                            Name = od.Product.Name,
                            MainImageUrl = od.Product.MainImageUrl
                        }
                    }).ToList()
                });

                return Ok(orderDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetCustomerOrders: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { error = "An error occurred", message = ex.Message });
            }
        }

        // GET: api/order/status/{status}
        
        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrdersByStatus(OrderStatus status)
        {
            var orders = await _unitOfWork.Orders.GetAllAsync(
                o => o.Status == status,
                q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product)
            );
            return Ok(orders);
        }

        // PUT: api/orders/{id}/cancel
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelOrderRequest request)
        {
            try
            {
                var order = await _unitOfWork.Orders.GetByIdAsync(id);
                if (order == null)
                    return NotFound($"Order with ID {id} not found.");

                // Only allow cancellation of orders in Pending or Processing status
                if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
                    return BadRequest($"Cannot cancel an order with status {order.Status}");
                
                // Load order details with products if not already loaded
                if (order.OrderDetails == null)
                {
                    order = await _unitOfWork.Orders.GetByIdAsync(id, 
                        includeProperties: q => q.Include(o => o.OrderDetails).ThenInclude(od => od.Product));
                    
                    if (order == null || order.OrderDetails == null)
                        return NotFound($"Order details for order ID {id} not found.");
                }
                
                // Restore inventory quantities as the order is being cancelled
                foreach (var orderDetail in order.OrderDetails)
                {
                    // Only restore inventory if the product exists and the order is not already cancelled
                    if (orderDetail.Product != null && order.Status != OrderStatus.Cancelled)
                    {
                        orderDetail.Product.StockQuantity += orderDetail.Quantity;
                        _unitOfWork.Products.Update(orderDetail.Product);
                        Console.WriteLine($"Restored {orderDetail.Quantity} units to product {orderDetail.Product.Name} (ID: {orderDetail.ProductId})");
                    }
                }

                // Update order status to Cancelled
                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;
                // We don't have a Notes field, so we'll log the reason
                Console.WriteLine($"Order {id} cancelled due to: {request.Reason}");

                _unitOfWork.Orders.Update(order);
                await _unitOfWork.CompleteAsync();
                
                return Ok(new { message = "Order cancelled successfully.", status = order.Status.ToString() });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error cancelling order: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while cancelling the order", message = ex.Message });
            }
        }
    }

    // Request DTO for order cancellation
    public class CancelOrderRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}