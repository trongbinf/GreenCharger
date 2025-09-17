using Microsoft.AspNetCore.Mvc;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Data;
using Microsoft.AspNetCore.Identity;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public CartController(IUnitOfWork unitOfWork, ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _unitOfWork = unitOfWork;
            _context = context;
            _userManager = userManager;
        }

        // Helper method: Get UserId by Email
        private async Task<string?> GetUserIdByEmail(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            return user?.Id;
        }

        // GET: api/cart/{userId}
        [HttpGet("{userId}")]
        public async Task<ActionResult<IEnumerable<CartDto>>> GetCart(string userId)
        {
            var carts = await _context.Carts
                .Include(c => c.Product)
                .Where(c => c.UserId == userId)
                .ToListAsync();
            var dtos = carts.Select(c => new CartDto
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ProductName = c.Product?.Name ?? string.Empty,
                Price = c.Product?.Price ?? 0,
                Discount = c.Product?.Discount,
                ImageUrl = c.Product?.MainImageUrl ?? string.Empty,
                Quantity = c.Quantity,
                StockQuantity = c.Product?.StockQuantity ?? 0,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();
            return Ok(dtos);
        }

        // GET: api/cart/by-email/{email}
        [HttpGet("by-email/{email}")]
        public async Task<ActionResult<IEnumerable<CartDto>>> GetCartByEmail(string email)
        {
            var userId = await GetUserIdByEmail(email);
            if (string.IsNullOrEmpty(userId))
                return NotFound(new { message = "Không tìm thấy user với email này" });
            var carts = await _context.Carts
                .Include(c => c.Product)
                .Where(c => c.UserId == userId)
                .ToListAsync();
            var dtos = carts.Select(c => new CartDto
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ProductName = c.Product?.Name ?? string.Empty,
                Price = c.Product?.Price ?? 0,
                Discount = c.Product?.Discount,
                ImageUrl = c.Product?.MainImageUrl ?? string.Empty,
                Quantity = c.Quantity,
                StockQuantity = c.Product?.StockQuantity ?? 0,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();
            return Ok(dtos);
        }

        // POST: api/cart/{userId}/add
        [HttpPost("{userId}/add")]
        public async Task<ActionResult<IEnumerable<CartDto>>> AddToCart(string userId, [FromBody] CartDto itemDto)
        {
            // Kiểm tra thông tin sản phẩm và số lượng tồn kho
            var product = await _context.Products.FindAsync(itemDto.ProductId);
            if (product == null)
            {
                return BadRequest(new { message = "Sản phẩm không tồn tại" });
            }
            
            // Kiểm tra đã có cart cho sản phẩm này chưa
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == itemDto.ProductId);
            
            // Tính toán số lượng mới sau khi thêm vào giỏ hàng
            int newQuantity = itemDto.Quantity;
            if (cart != null)
            {
                newQuantity = cart.Quantity + itemDto.Quantity;
            }
            
            // Kiểm tra số lượng mới có vượt quá số lượng tồn kho không
            if (newQuantity > product.StockQuantity)
            {
                return BadRequest(new { 
                    message = $"Không đủ sản phẩm trong kho. Hiện chỉ còn {product.StockQuantity} sản phẩm.", 
                    availableStock = product.StockQuantity,
                    currentCartQuantity = cart?.Quantity ?? 0
                });
            }
            
            if (cart != null)
            {
                cart.Quantity += itemDto.Quantity;
                cart.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                cart = new Cart
                {
                    UserId = userId,
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(cart);
            }
            await _context.SaveChangesAsync();
            return await GetCart(userId);
        }

        // POST: api/cart/{userId}/remove/{productId}
        [HttpPost("{userId}/remove/{productId}")]
        public async Task<ActionResult<IEnumerable<CartDto>>> RemoveFromCart(string userId, int productId)
        {
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);
            if (cart != null)
            {
                _context.Carts.Remove(cart);
                await _context.SaveChangesAsync();
            }
            return await GetCart(userId);
        }

        // POST: api/cart/{userId}/clear
        [HttpPost("{userId}/clear")]
        public async Task<IActionResult> ClearCart(string userId)
        {
            var carts = await _context.Carts.Where(c => c.UserId == userId).ToListAsync();
            if (carts.Any())
            {
                _context.Carts.RemoveRange(carts);
                await _context.SaveChangesAsync();
            }
            return NoContent();
        }

        // POST: api/cart/by-email/{email}/clear
        [HttpPost("by-email/{email}/clear")]
        public async Task<IActionResult> ClearCartByEmail(string email)
        {
            var userId = await GetUserIdByEmail(email);
            if (string.IsNullOrEmpty(userId))
                return NotFound(new { message = "Không tìm thấy user với email này" });
            var carts = await _context.Carts.Where(c => c.UserId == userId).ToListAsync();
            if (carts.Any())
            {
                _context.Carts.RemoveRange(carts);
                await _context.SaveChangesAsync();
            }
            return NoContent();
        }
    }
}
