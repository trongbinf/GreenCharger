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
    public class CouponController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public CouponController(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _mapper = mapper;
        }

        // GET: api/Coupon
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<CouponDto>>> GetCoupons()
        {
            var coupons = await _unitOfWork.Coupons.GetAllAsync(
                includeProperties: q => q.Include(c => c.Product));

            var couponDtos = _mapper.Map<IEnumerable<CouponDto>>(coupons);

            return Ok(couponDtos.OrderByDescending(c => c.CreatedAt));
        }

        // GET: api/Coupon/active
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<CouponDto>>> GetActiveCoupons()
        {
            var now = DateTime.UtcNow;
            var coupons = await _unitOfWork.Coupons.GetAllAsync(
                filter: c => c.IsActive && 
                            c.StartDate <= now && 
                            c.EndDate >= now && 
                            c.CurrentUsageCount < c.MaxUsageCount,
                includeProperties: q => q.Include(c => c.Product));

            var couponDtos = _mapper.Map<IEnumerable<CouponDto>>(coupons);

            return Ok(couponDtos.OrderBy(c => c.EndDate));
        }

        // GET: api/Coupon/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CouponDto>> GetCoupon(int id)
        {
            var coupon = await _unitOfWork.Coupons.GetByIdAsync(id);

            if (coupon == null)
                return NotFound();

            var couponDto = _mapper.Map<CouponDto>(coupon);
            return Ok(couponDto);
        }

        // POST: api/Coupon
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CouponDto>> CreateCoupon(CreateCouponDto createDto)
        {
            // Kiểm tra mã coupon đã tồn tại chưa
            var existingCoupons = await _unitOfWork.Coupons
                .GetAllAsync(c => c.Code == createDto.Code);

            if (existingCoupons.Any())
                return BadRequest("Mã coupon đã tồn tại.");

            // Kiểm tra sản phẩm có tồn tại không (nếu có ProductId)
            if (createDto.ProductId.HasValue)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(createDto.ProductId.Value);
                if (product == null)
                    return BadRequest("Sản phẩm không tồn tại.");
            }

            var coupon = _mapper.Map<Coupon>(createDto);

            await _unitOfWork.Coupons.AddAsync(coupon);
            await _unitOfWork.CompleteAsync();

            var couponDto = _mapper.Map<CouponDto>(coupon);
            return CreatedAtAction(nameof(GetCoupon), new { id = coupon.Id }, couponDto);
        }

        // PUT: api/Coupon/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCoupon(int id, UpdateCouponDto updateDto)
        {
            var coupon = await _unitOfWork.Coupons.GetByIdAsync(id);
            if (coupon == null)
                return NotFound();

            // Kiểm tra mã coupon đã tồn tại chưa (ngoại trừ coupon hiện tại)
            if (updateDto.Code != coupon.Code)
            {
                var existingCoupons = await _unitOfWork.Coupons
                    .GetAllAsync(c => c.Code == updateDto.Code && c.Id != id);

                if (existingCoupons.Any())
                    return BadRequest("Mã coupon đã tồn tại.");
            }

            // Kiểm tra sản phẩm có tồn tại không (nếu có ProductId)
            if (updateDto.ProductId.HasValue)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(updateDto.ProductId.Value);
                if (product == null)
                    return BadRequest("Sản phẩm không tồn tại.");
            }

            _mapper.Map(updateDto, coupon);
            coupon.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Coupons.Update(coupon);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // DELETE: api/Coupon/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var coupon = await _unitOfWork.Coupons.GetByIdAsync(id);
            if (coupon == null)
                return NotFound();

            _unitOfWork.Coupons.Remove(coupon);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // POST: api/Coupon/validate
        [HttpPost("validate")]
        [Authorize]
        public async Task<ActionResult<CouponValidationDto>> ValidateCoupon(ValidateCouponRequestDto requestDto)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var coupons = await _unitOfWork.Coupons
                .GetAllAsync(c => c.Code == requestDto.Code);
            
            var coupon = coupons.FirstOrDefault();

            if (coupon == null)
            {
                return Ok(new CouponValidationDto
                {
                    IsValid = false,
                    Message = "Mã coupon không tồn tại."
                });
            }

            var now = DateTime.UtcNow;

            // Kiểm tra các điều kiện
            if (!coupon.IsActive)
            {
                return Ok(new CouponValidationDto
                {
                    IsValid = false,
                    Message = "Mã coupon đã bị vô hiệu hóa."
                });
            }

            if (coupon.StartDate > now)
            {
                return Ok(new CouponValidationDto
                {
                    IsValid = false,
                    Message = $"Mã coupon sẽ có hiệu lực từ {coupon.StartDate:dd/MM/yyyy}."
                });
            }

            if (coupon.EndDate < now)
            {
                return Ok(new CouponValidationDto
                {
                    IsValid = false,
                    Message = "Mã coupon đã hết hạn."
                });
            }

            if (coupon.CurrentUsageCount >= coupon.MaxUsageCount)
            {
                return Ok(new CouponValidationDto
                {
                    IsValid = false,
                    Message = "Mã coupon đã hết lượt sử dụng."
                });
            }

            // Kiểm tra xem user đã sử dụng coupon này chưa (nếu có giới hạn per user)
            if (coupon.MaxUsagePerUser > 0)
            {
                var userUsages = await _unitOfWork.CouponUsages
                    .GetAllAsync(cu => cu.CouponId == coupon.Id && cu.UserId == userId);

                if (userUsages.Count() >= coupon.MaxUsagePerUser)
                {
                    return Ok(new CouponValidationDto
                    {
                        IsValid = false,
                        Message = "Bạn đã sử dụng hết lượt cho mã coupon này."
                    });
                }
            }

            // Kiểm tra giá trị đơn hàng tối thiểu
            if (coupon.MinOrderAmount.HasValue && requestDto.OrderValue < coupon.MinOrderAmount.Value)
            {
                return Ok(new CouponValidationDto
                {
                    IsValid = false,
                    Message = $"Đơn hàng phải có giá trị tối thiểu {coupon.MinOrderAmount.Value:N0} VNĐ."
                });
            }

            // Kiểm tra sản phẩm cụ thể (nếu coupon chỉ áp dụng cho sản phẩm cụ thể)
            if (coupon.ProductId.HasValue && requestDto.ProductIds != null && requestDto.ProductIds.Any())
            {
                if (!requestDto.ProductIds.Contains(coupon.ProductId.Value))
                {
                    return Ok(new CouponValidationDto
                    {
                        IsValid = false,
                        Message = "Mã coupon không áp dụng cho các sản phẩm trong đơn hàng."
                    });
                }
            }

            // Tính toán discount
            decimal discountAmount = 0;
            if (coupon.Type == CouponType.Percentage)
            {
                discountAmount = requestDto.OrderValue * (coupon.Value / 100);
                if (coupon.MaxDiscountAmount.HasValue)
                {
                    discountAmount = Math.Min(discountAmount, coupon.MaxDiscountAmount.Value);
                }
            }
            else // Fixed amount
            {
                discountAmount = coupon.Value;
            }

            return Ok(new CouponValidationDto
            {
                IsValid = true,
                Message = "Mã coupon hợp lệ.",
                DiscountAmount = discountAmount,
                DiscountType = coupon.Type.ToString(),
                CouponCode = coupon.Code
            });
        }

        // POST: api/Coupon/apply
        [HttpPost("apply")]
        [Authorize]
        public async Task<ActionResult<CouponApplicationDto>> ApplyCoupon(ApplyCouponRequestDto requestDto)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            // Validate coupon trước
            var validationRequest = new ValidateCouponRequestDto
            {
                Code = requestDto.Code,
                OrderValue = requestDto.OrderValue,
                ProductIds = requestDto.ProductIds
            };

            var validationResult = await ValidateCoupon(validationRequest);
            var validationDto = (validationResult.Result as OkObjectResult)?.Value as CouponValidationDto;

            if (validationDto == null || !validationDto.IsValid)
            {
                return BadRequest(validationDto?.Message ?? "Lỗi xác thực coupon.");
            }

            // Lưu usage record
            var coupons = await _unitOfWork.Coupons
                .GetAllAsync(c => c.Code == requestDto.Code);
            var coupon = coupons.First();

            var couponUsage = new CouponUsage
            {
                CouponId = coupon.Id,
                UserId = userId,
                OrderId = requestDto.OrderId ?? 0, // Use 0 if OrderId is null
                DiscountAmount = validationDto.DiscountAmount
            };

            await _unitOfWork.CouponUsages.AddAsync(couponUsage);

            // Cập nhật usage count
            coupon.CurrentUsageCount++;
            _unitOfWork.Coupons.Update(coupon);

            await _unitOfWork.CompleteAsync();

            return Ok(new CouponApplicationDto
            {
                IsApplied = true,
                Message = "Áp dụng mã coupon thành công.",
                DiscountAmount = validationDto.DiscountAmount,
                CouponCode = coupon.Code,
                UsageId = couponUsage.Id
            });
        }

        // GET: api/Coupon/usage-history
        [HttpGet("usage-history")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<CouponUsageDto>>> GetUserCouponUsageHistory()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var usages = await _unitOfWork.CouponUsages.GetAllAsync(
                filter: cu => cu.UserId == userId,
                includeProperties: q => q.Include(cu => cu.Coupon));

            var usageDtos = _mapper.Map<IEnumerable<CouponUsageDto>>(usages);

            return Ok(usageDtos.OrderByDescending(u => u.UsedAt));
        }

        // GET: api/Coupon/{id}/statistics
        [HttpGet("{id}/statistics")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CouponStatisticsDto>> GetCouponStatistics(int id)
        {
            var coupon = await _unitOfWork.Coupons.GetByIdAsync(id);
            if (coupon == null)
                return NotFound();

            var usages = await _unitOfWork.CouponUsages.GetAllAsync(cu => cu.CouponId == id);
            var usageList = usages.ToList();

            var statistics = new CouponStatisticsDto
            {
                CouponId = id,
                CouponCode = coupon.Code,
                TotalUsages = usageList.Count,
                TotalDiscountAmount = usageList.Sum(u => u.DiscountAmount),
                UniqueUsers = usageList.Select(u => u.UserId).Distinct().Count(),
                RemainingUsages = coupon.MaxUsageCount - coupon.CurrentUsageCount,
                UsagePercentage = coupon.MaxUsageCount > 0 ? (double)coupon.CurrentUsageCount / coupon.MaxUsageCount * 100 : 0
            };

            return Ok(statistics);
        }
    }
}