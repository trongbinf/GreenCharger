using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GreenChargerAPI.Models;
using GreenChargerAPI.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderDetailController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public OrderDetailController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // GET: api/orderdetail/order/5
        [Authorize]
        [HttpGet("order/{orderId}")]
        public async Task<ActionResult<IEnumerable<OrderDetail>>> GetOrderDetails(int orderId)
        {
            var orderDetails = await _unitOfWork.OrderDetails.GetAllAsync(
                od => od.OrderId == orderId,
                q => q.Include(od => od.Product)
            );
            return Ok(orderDetails);
        }

        // POST: api/orderdetail
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<OrderDetail>> AddOrderDetail([FromBody] OrderDetail orderDetail)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = await _unitOfWork.Products.GetByIdAsync(orderDetail.ProductId);
            if (product == null)
                return BadRequest($"Product with ID {orderDetail.ProductId} not found");

            orderDetail.UnitPrice = product.Price;
            orderDetail.Subtotal = orderDetail.Quantity * orderDetail.UnitPrice;

            await _unitOfWork.OrderDetails.AddAsync(orderDetail);
            await _unitOfWork.CompleteAsync();

            return CreatedAtAction(nameof(GetOrderDetails), new { orderId = orderDetail.OrderId }, orderDetail);
        }

        // PUT: api/orderdetail/5
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrderDetail(int id, [FromBody] OrderDetail orderDetail)
        {
            if (id != orderDetail.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingDetail = await _unitOfWork.OrderDetails.GetByIdAsync(id);
            if (existingDetail == null)
                return NotFound();

            var product = await _unitOfWork.Products.GetByIdAsync(orderDetail.ProductId);
            if (product == null)
                return BadRequest($"Product with ID {orderDetail.ProductId} not found");

            orderDetail.UnitPrice = product.Price;
            orderDetail.Subtotal = orderDetail.Quantity * orderDetail.UnitPrice;

            _unitOfWork.OrderDetails.Update(orderDetail);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // DELETE: api/orderdetail/5
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderDetail(int id)
        {
            var orderDetail = await _unitOfWork.OrderDetails.GetByIdAsync(id);
            if (orderDetail == null)
                return NotFound();

            _unitOfWork.OrderDetails.Remove(orderDetail);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var orderDetails = await _unitOfWork.OrderDetails.GetAllAsync(
                null,
                q => q.Include(od => od.Product)
            );
            return Ok(orderDetails);
        }
    }
} 