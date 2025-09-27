using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;
using AutoMapper;

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

        // GET: api/wishlist
        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var wishlist = await _unitOfWork.Wishlists.GetAllAsync(
                w => w.UserId == userId,
                q => q.Include(w => w.Product).ThenInclude(p => p.Category)
            );

            var wishlistDtos = _mapper.Map<IEnumerable<WishlistDto>>(wishlist);
            return Ok(wishlistDtos);
        }

        // POST: api/wishlist
        [HttpPost]
        public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistRequest request)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Check if product exists
            var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId);
            if (product == null)
                return NotFound("Product not found");

            // Check if already in wishlist
            var existingWishlist = await _unitOfWork.Wishlists.GetAllAsync(
                w => w.UserId == userId && w.ProductId == request.ProductId
            );

            if (existingWishlist.Any())
                return BadRequest("Product already in wishlist");

            var wishlist = new Wishlist
            {
                UserId = userId,
                ProductId = request.ProductId,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Wishlists.AddAsync(wishlist);
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Product added to wishlist successfully" });
        }

        // DELETE: api/wishlist/{productId}
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var wishlist = await _unitOfWork.Wishlists.GetAllAsync(
                w => w.UserId == userId && w.ProductId == productId
            );

            if (!wishlist.Any())
                return NotFound("Product not found in wishlist");

            _unitOfWork.Wishlists.Remove(wishlist.First());
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Product removed from wishlist successfully" });
        }

        // DELETE: api/wishlist/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearWishlist()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var wishlist = await _unitOfWork.Wishlists.GetAllAsync(w => w.UserId == userId);
            
            foreach (var item in wishlist)
            {
                _unitOfWork.Wishlists.Remove(item);
            }

            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Wishlist cleared successfully" });
        }
    }

    public class AddToWishlistRequest
    {
        public int ProductId { get; set; }
    }
}
