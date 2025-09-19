using System.ComponentModel.DataAnnotations;
using GreenChargerAPI.Models;

namespace GreenChargerAPI.Models.DTOs
{
    // DTO để hiển thị thông tin Coupon
    public class CouponDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public CouponType Type { get; set; }
        public string TypeDisplay { get; set; } = string.Empty; // "Giảm theo %" hoặc "Giảm cố định"
        public decimal Value { get; set; }
        public string ValueDisplay { get; set; } = string.Empty; // "20%" hoặc "50,000đ"
        public decimal? MinOrderAmount { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxUsageCount { get; set; }
        public int MaxUsagePerUser { get; set; }
        public int CurrentUsageCount { get; set; }
        public int RemainingUsage { get; set; }
        public bool IsActive { get; set; }
        public bool IsPublic { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        
        // Status properties
        public bool IsExpired { get; set; }
        public bool IsNotStarted { get; set; }
        public bool IsUsageLimitReached { get; set; }
        public bool IsValidForUse { get; set; }
        public string Status { get; set; } = string.Empty; // "Còn hiệu lực", "Hết hạn", "Chưa bắt đầu", etc.
        
        // User-specific properties
        public int UserUsageCount { get; set; } = 0; // Số lần user hiện tại đã dùng
        public bool CanUserUse { get; set; } = true; // User hiện tại có thể dùng không
    }

    // DTO để tạo Coupon mới
    public class CreateCouponDto
    {
        [Required(ErrorMessage = "Mã coupon là bắt buộc")]
        [StringLength(20, ErrorMessage = "Mã coupon không được vượt quá 20 ký tự")]
        [RegularExpression(@"^[A-Z0-9]+$", ErrorMessage = "Mã coupon chỉ được chứa chữ hoa và số")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên coupon là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên coupon không được vượt quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Loại coupon là bắt buộc")]
        public CouponType Type { get; set; }

        [Required(ErrorMessage = "Giá trị coupon là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá trị coupon phải lớn hơn 0")]
        public decimal Value { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số tiền đơn hàng tối thiểu phải >= 0")]
        public decimal? MinOrderAmount { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số tiền giảm tối đa phải >= 0")]
        public decimal? MaxDiscountAmount { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc là bắt buộc")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Số lần sử dụng tối đa là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Số lần sử dụng tối đa phải >= 1")]
        public int MaxUsageCount { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lần sử dụng tối đa mỗi user phải >= 1")]
        public int MaxUsagePerUser { get; set; } = 1;

        public bool IsActive { get; set; } = true;

        public bool IsPublic { get; set; } = true;

        public int? CategoryId { get; set; }
        
        public int? ProductId { get; set; }
    }

    // DTO để cập nhật Coupon
    public class UpdateCouponDto
    {
        [Required(ErrorMessage = "Mã coupon là bắt buộc")]
        [StringLength(20, ErrorMessage = "Mã coupon không được vượt quá 20 ký tự")]
        [RegularExpression(@"^[A-Z0-9]+$", ErrorMessage = "Mã coupon chỉ được chứa chữ hoa và số")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên coupon là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên coupon không được vượt quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Loại coupon là bắt buộc")]
        public CouponType Type { get; set; }

        [Required(ErrorMessage = "Giá trị coupon là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá trị coupon phải lớn hơn 0")]
        public decimal Value { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số tiền đơn hàng tối thiểu phải >= 0")]
        public decimal? MinOrderAmount { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số tiền giảm tối đa phải >= 0")]
        public decimal? MaxDiscountAmount { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc là bắt buộc")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Số lần sử dụng tối đa là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Số lần sử dụng tối đa phải >= 1")]
        public int MaxUsageCount { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lần sử dụng tối đa mỗi user phải >= 1")]
        public int MaxUsagePerUser { get; set; } = 1;

        public bool IsActive { get; set; } = true;

        public bool IsPublic { get; set; } = true;

        public int? CategoryId { get; set; }
        
        public int? ProductId { get; set; }
    }

    // DTO để tìm kiếm Coupon
    public class CouponSearchDto
    {
        public string? Keyword { get; set; } // Tìm theo code, name
        public CouponType? Type { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsPublic { get; set; }
        public bool? IsExpired { get; set; }
        public bool? IsValidForUse { get; set; }
        public int? CategoryId { get; set; }
        public DateTime? StartFromDate { get; set; }
        public DateTime? StartToDate { get; set; }
        public DateTime? EndFromDate { get; set; }
        public DateTime? EndToDate { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? OrderBy { get; set; } = "CreatedAt";
        public string? OrderDirection { get; set; } = "desc";
    }

    // DTO cho response danh sách Coupon
    public class CouponListResponseDto
    {
        public List<CouponDto> Coupons { get; set; } = new List<CouponDto>();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // DTO để apply coupon
    public class ApplyCouponDto
    {
        [Required(ErrorMessage = "Mã coupon là bắt buộc")]
        public string CouponCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tổng tiền đơn hàng là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tổng tiền đơn hàng phải > 0")]
        public decimal OrderTotal { get; set; }

        public int? CategoryId { get; set; } // Để check coupon có áp dụng cho category này không
    }

    // DTO response khi apply coupon
    public class ApplyCouponResponseDto
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public CouponDto? Coupon { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }

    // DTO để lấy thống kê Coupon (cập nhật với thuộc tính mới)
    public class CouponStatisticsDto
    {
        public int CouponId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public int TotalUsages { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public int UniqueUsers { get; set; }
        public int RemainingUsages { get; set; }
        public double UsagePercentage { get; set; }
    }

    // DTO lịch sử sử dụng coupon
    public class CouponUsageDto
    {
        public int Id { get; set; }
        public int CouponId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string CouponName { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int OrderId { get; set; }
        public decimal DiscountAmount { get; set; }
        public DateTime UsedAt { get; set; }
    }

    // DTO response lịch sử sử dụng coupon
    public class CouponUsageListResponseDto
    {
        public List<CouponUsageDto> UsageHistory { get; set; } = new List<CouponUsageDto>();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // DTO để check coupon cho user cụ thể
    public class CheckCouponForUserDto
    {
        [Required]
        public string CouponCode { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal OrderTotal { get; set; }
        
        public int? CategoryId { get; set; }
    }

    // DTO để validate coupon
    public class ValidateCouponRequestDto
    {
        [Required]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal OrderValue { get; set; }
        
        public List<int>? ProductIds { get; set; }
    }

    public class CouponValidationDto
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public string DiscountType { get; set; } = string.Empty;
        public string CouponCode { get; set; } = string.Empty;
    }

    // DTO để apply coupon
    public class ApplyCouponRequestDto
    {
        [Required]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal OrderValue { get; set; }
        
        public List<int>? ProductIds { get; set; }
        
        public int? OrderId { get; set; }
    }

    public class CouponApplicationDto
    {
        public bool IsApplied { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public int UsageId { get; set; }
    }
}