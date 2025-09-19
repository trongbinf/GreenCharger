using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;
using AutoMapper;
using System.Linq.Expressions;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public ReviewController(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _mapper = mapper;
        }

        // GET: api/Review
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ReviewDto>>> GetReviews(
            [FromQuery] bool? isApproved = null,
            [FromQuery] int? productId = null,
            [FromQuery] int? rating = null)
        {
            Expression<Func<Review, bool>>? filter = null;

            if (isApproved.HasValue || productId.HasValue || rating.HasValue)
            {
                filter = r => (!isApproved.HasValue || r.IsApproved == isApproved.Value) &&
                             (!productId.HasValue || r.ProductId == productId.Value) &&
                             (!rating.HasValue || r.Rating == rating.Value);
            }

            var reviews = await _unitOfWork.Reviews.GetAllAsync(
                filter: filter,
                includeProperties: q => q.Include(r => r.User).Include(r => r.Product));

            var reviewDtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);

            return Ok(reviewDtos.OrderByDescending(r => r.CreatedAt));
        }

        // GET: api/Review/product/5
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<ReviewDto>>> GetProductReviews(
            int productId,
            [FromQuery] int? rating = null)
        {
            Expression<Func<Review, bool>> filter = r => r.ProductId == productId && r.IsApproved &&
                                                          (!rating.HasValue || r.Rating == rating.Value);

            var reviews = await _unitOfWork.Reviews.GetAllAsync(
                filter: filter,
                includeProperties: q => q.Include(r => r.User));

            var reviewDtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);

            return Ok(reviewDtos.OrderByDescending(r => r.CreatedAt));
        }

        // GET: api/Review/5
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ReviewDto>> GetReview(int id)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(id);

            if (review == null)
                return NotFound();

            var reviewDto = _mapper.Map<ReviewDto>(review);
            return Ok(reviewDto);
        }

        // POST: api/Review
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ReviewDto>> CreateReview(CreateReviewDto createDto)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            // Kiểm tra xem user đã review sản phẩm này chưa
            var existingReviews = await _unitOfWork.Reviews
                .GetAllAsync(r => r.UserId == userId && r.ProductId == createDto.ProductId);
            
            if (existingReviews.Any())
                return BadRequest("Bạn đã đánh giá sản phẩm này rồi.");

            // Kiểm tra xem user đã mua sản phẩm này chưa (tuỳ chọn)
            if (createDto.RequirePurchase)
            {
                var orders = await _unitOfWork.Orders
                    .GetAllAsync(o => o.UserId == userId && o.Status == OrderStatus.Delivered);
                
                var hasPurchased = false;
                foreach (var order in orders)
                {
                    var orderDetails = await _unitOfWork.OrderDetails
                        .GetAllAsync(od => od.OrderId == order.Id && od.ProductId == createDto.ProductId);
                    if (orderDetails.Any())
                    {
                        hasPurchased = true;
                        break;
                    }
                }

                if (!hasPurchased)
                    return BadRequest("Bạn cần mua sản phẩm này trước khi có thể đánh giá.");
            }

            var review = _mapper.Map<Review>(createDto);
            review.UserId = userId;

            await _unitOfWork.Reviews.AddAsync(review);
            await _unitOfWork.CompleteAsync();

            var reviewDto = _mapper.Map<ReviewDto>(review);
            return CreatedAtAction(nameof(GetReview), new { id = review.Id }, reviewDto);
        }

        // PUT: api/Review/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(int id, UpdateReviewDto updateDto)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var review = await _unitOfWork.Reviews.GetByIdAsync(id);
            if (review == null)
                return NotFound();

            if (review.UserId != userId)
                return Forbid();

            _mapper.Map(updateDto, review);
            review.UpdatedAt = DateTime.UtcNow;
            review.IsApproved = false; // Cần phê duyệt lại sau khi chỉnh sửa

            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // DELETE: api/Review/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var review = await _unitOfWork.Reviews.GetByIdAsync(id);
            if (review == null)
                return NotFound();

            if (review.UserId != userId && !User.IsInRole("Admin"))
                return Forbid();

            _unitOfWork.Reviews.Remove(review);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // PUT: api/Review/5/approve
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveReview(int id)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(id);
            if (review == null)
                return NotFound();

            review.IsApproved = true;
            review.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // PUT: api/Review/5/reject
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectReview(int id)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(id);
            if (review == null)
                return NotFound();

            review.IsApproved = false;
            review.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // POST: api/Review/5/helpful
        [HttpPost("{id}/helpful")]
        [Authorize]
        public async Task<IActionResult> MarkReviewHelpful(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var review = await _unitOfWork.Reviews.GetByIdAsync(id);
            if (review == null)
                return NotFound();

            // Kiểm tra xem user đã đánh dấu helpful chưa
            var existingHelpfuls = await _unitOfWork.ReviewHelpfuls
                .GetAllAsync(rh => rh.ReviewId == id && rh.UserId == userId);

            if (existingHelpfuls.Any())
                return BadRequest("Bạn đã đánh dấu review này là helpful rồi.");

            var reviewHelpful = new ReviewHelpful
            {
                ReviewId = id,
                UserId = userId
            };

            await _unitOfWork.ReviewHelpfuls.AddAsync(reviewHelpful);

            review.HelpfulCount++;
            _unitOfWork.Reviews.Update(review);

            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Đã đánh dấu review này là helpful." });
        }

        // DELETE: api/Review/5/helpful
        [HttpDelete("{id}/helpful")]
        [Authorize]
        public async Task<IActionResult> UnmarkReviewHelpful(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var review = await _unitOfWork.Reviews.GetByIdAsync(id);
            if (review == null)
                return NotFound();

            var existingHelpfuls = await _unitOfWork.ReviewHelpfuls
                .GetAllAsync(rh => rh.ReviewId == id && rh.UserId == userId);
            
            var existingHelpful = existingHelpfuls.FirstOrDefault();
            if (existingHelpful == null)
                return BadRequest("Bạn chưa đánh dấu review này là helpful.");

            _unitOfWork.ReviewHelpfuls.Remove(existingHelpful);

            review.HelpfulCount = Math.Max(0, review.HelpfulCount - 1);
            _unitOfWork.Reviews.Update(review);

            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Đã bỏ đánh dấu helpful cho review này." });
        }

        // GET: api/Review/product/5/stats
        [HttpGet("product/{productId}/stats")]
        public async Task<ActionResult<ReviewStatsDto>> GetProductReviewStats(int productId)
        {
            var reviews = await _unitOfWork.Reviews
                .GetAllAsync(r => r.ProductId == productId && r.IsApproved);

            var reviewList = reviews.ToList();
            
            if (!reviewList.Any())
            {
                return Ok(new ReviewStatsDto
                {
                    TotalReviews = 0,
                    AverageRating = 0,
                    RatingDistribution = new Dictionary<int, int>()
                });
            }

            var totalReviews = reviewList.Count;
            var averageRating = reviewList.Average(r => r.Rating);
            var ratingDistribution = reviewList
                .GroupBy(r => r.Rating)
                .ToDictionary(g => g.Key, g => g.Count());

            return Ok(new ReviewStatsDto
            {
                TotalReviews = totalReviews,
                AverageRating = Math.Round(averageRating, 2),
                RatingDistribution = ratingDistribution
            });
        }
    }
}