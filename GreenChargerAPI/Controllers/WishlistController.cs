using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;
using AutoMapper;
using GreenChargerAPI.Models.DTOs;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public WishlistController(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _mapper = mapper;
        }

        // GET: api/Wishlist
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WishlistDto>>> GetWishlists()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var wishlists = await _unitOfWork.Wishlists.GetAllAsync(
                filter: w => w.UserId == userId,
                includeProperties: q => q.Include(w => w.Product)
                    .ThenInclude(p => p.Category));

            var wishlistDtos = _mapper.Map<IEnumerable<WishlistDto>>(wishlists);

            return Ok(wishlistDtos.OrderByDescending(w => w.CreatedAt));
        }

        // GET: api/Wishlist/products
        [HttpGet("products")]
        public async Task<ActionResult<IEnumerable<GreenChargerAPI.Models.DTOs.ProductDto>>> GetWishlistProducts()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var wishlists = await _unitOfWork.Wishlists.GetAllAsync(
                filter: w => w.UserId == userId,
                includeProperties: q => q.Include(w => w.Product)
                    .ThenInclude(p => p.Category));

            var products = wishlists.Select(w => w.Product).ToList();
            var productDtos = _mapper.Map<IEnumerable<GreenChargerAPI.Models.DTOs.ProductDto>>(products);

            return Ok(productDtos);
        }

        // POST: api/Wishlist
        [HttpPost]
        public async Task<ActionResult<WishlistDto>> AddToWishlist([FromBody] AddToWishlistDto addDto)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            // Kiểm tra product có tồn tại không
            var product = await _unitOfWork.Products.GetByIdAsync(addDto.ProductId);
            if (product == null)
                return BadRequest("Sản phẩm không tồn tại.");

            // Kiểm tra xem sản phẩm đã có trong wishlist chưa
            var existingWishlists = await _unitOfWork.Wishlists
                .GetAllAsync(w => w.UserId == userId && w.ProductId == addDto.ProductId);

            if (existingWishlists.Any())
                return BadRequest("Sản phẩm đã có trong danh sách yêu thích.");

            var wishlist = new Wishlist
            {
                UserId = userId,
                ProductId = addDto.ProductId
            };

            await _unitOfWork.Wishlists.AddAsync(wishlist);
            await _unitOfWork.CompleteAsync();

            var wishlistDto = _mapper.Map<WishlistDto>(wishlist);
            return CreatedAtAction(nameof(GetWishlists), new { id = wishlist.Id }, wishlistDto);
        }

        // DELETE: api/Wishlist/{productId}
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var wishlists = await _unitOfWork.Wishlists
                .GetAllAsync(w => w.UserId == userId && w.ProductId == productId);
            
            var wishlist = wishlists.FirstOrDefault();
            if (wishlist == null)
                return NotFound("Sản phẩm không có trong danh sách yêu thích.");

            _unitOfWork.Wishlists.Remove(wishlist);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // POST: api/Wishlist/{productId}/toggle
        [HttpPost("{productId}/toggle")]
        public async Task<IActionResult> ToggleWishlist(int productId)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            // Kiểm tra product có tồn tại không
            var product = await _unitOfWork.Products.GetByIdAsync(productId);
            if (product == null)
                return BadRequest("Sản phẩm không tồn tại.");

            var existingWishlists = await _unitOfWork.Wishlists
                .GetAllAsync(w => w.UserId == userId && w.ProductId == productId);
            
            var existingWishlist = existingWishlists.FirstOrDefault();

            if (existingWishlist != null)
            {
                // Remove from wishlist
                _unitOfWork.Wishlists.Remove(existingWishlist);
                await _unitOfWork.CompleteAsync();

                return Ok(new { message = "Đã xóa khỏi danh sách yêu thích.", inWishlist = false });
            }
            else
            {
                // Add to wishlist
                var wishlist = new Wishlist
                {
                    UserId = userId,
                    ProductId = productId
                };

                await _unitOfWork.Wishlists.AddAsync(wishlist);
                await _unitOfWork.CompleteAsync();

                return Ok(new { message = "Đã thêm vào danh sách yêu thích.", inWishlist = true });
            }
        }

        // GET: api/Wishlist/{productId}/check
        [HttpGet("{productId}/check")]
        public async Task<ActionResult<bool>> CheckInWishlist(int productId)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var wishlists = await _unitOfWork.Wishlists
                .GetAllAsync(w => w.UserId == userId && w.ProductId == productId);

            return Ok(wishlists.Any());
        }

        // GET: api/Wishlist/count
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetWishlistCount()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var wishlists = await _unitOfWork.Wishlists
                .GetAllAsync(w => w.UserId == userId);

            return Ok(wishlists.Count());
        }

        // POST: api/Wishlist/move-all-to-cart
        [HttpPost("move-all-to-cart")]
        public async Task<IActionResult> MoveAllToCart()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var wishlists = await _unitOfWork.Wishlists.GetAllAsync(w => w.UserId == userId);

            if (!wishlists.Any())
                return BadRequest("Danh sách yêu thích rỗng.");

            // Thêm tất cả vào giỏ hàng
            foreach (var wishlist in wishlists)
            {
                // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
                var existingCarts = await _unitOfWork.Carts
                    .GetAllAsync(c => c.UserId == userId && c.ProductId == wishlist.ProductId);

                if (existingCarts.Any())
                {
                    // Nếu đã có trong giỏ hàng, tăng số lượng
                    var existingCart = existingCarts.First();
                    existingCart.Quantity += 1;
                    _unitOfWork.Carts.Update(existingCart);
                }
                else
                {
                    // Nếu chưa có, thêm mới vào giỏ hàng
                    var cart = new Cart
                    {
                        UserId = userId,
                        ProductId = wishlist.ProductId,
                        Quantity = 1
                    };
                    await _unitOfWork.Carts.AddAsync(cart);
                }
            }

            // Xóa tất cả khỏi wishlist
            foreach (var wishlist in wishlists)
            {
                _unitOfWork.Wishlists.Remove(wishlist);
            }

            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Đã chuyển tất cả sản phẩm vào giỏ hàng." });
        }

        // DELETE: api/Wishlist/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearWishlist()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var wishlists = await _unitOfWork.Wishlists.GetAllAsync(w => w.UserId == userId);

            if (wishlists.Any())
            {
                foreach (var wishlist in wishlists)
                {
                    _unitOfWork.Wishlists.Remove(wishlist);
                }
                await _unitOfWork.CompleteAsync();
            }

            return Ok(new { message = "Đã xóa tất cả sản phẩm khỏi danh sách yêu thích." });
        }
    }
}