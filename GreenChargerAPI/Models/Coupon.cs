using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenChargerAPI.Models
{
    public class Coupon
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string Code { get; set; } = string.Empty; // Mã coupon (VD: SUMMER2024)

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty; // Tên coupon

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public CouponType Type { get; set; } // Percentage hoặc FixedAmount

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Value { get; set; } // Giá trị giảm (% hoặc số tiền)

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MinOrderAmount { get; set; } // Đơn hàng tối thiểu để áp dụng

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaxDiscountAmount { get; set; } // Số tiền giảm tối đa (cho loại %)

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public int MaxUsageCount { get; set; } // Số lần sử dụng tối đa

        public int MaxUsagePerUser { get; set; } = 1; // Số lần 1 user có thể dùng

        public int CurrentUsageCount { get; set; } = 0; // Đã sử dụng bao nhiều lần

        public bool IsActive { get; set; } = true;

        public bool IsPublic { get; set; } = true; // Công khai hay chỉ gửi cho user cụ thể

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Keys (optional - nếu coupon chỉ áp dụng cho category/product cụ thể)
        public int? CategoryId { get; set; }
        public int? ProductId { get; set; }

        // Navigation Properties
        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
        public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();

        // Computed Properties
        [NotMapped]
        public bool IsExpired => DateTime.UtcNow > EndDate;

        [NotMapped]
        public bool IsNotStarted => DateTime.UtcNow < StartDate;

        [NotMapped]
        public bool IsUsageLimitReached => CurrentUsageCount >= MaxUsageCount;

        [NotMapped]
        public bool IsValidForUse => IsActive && !IsExpired && !IsNotStarted && !IsUsageLimitReached;
    }

    public enum CouponType
    {
        Percentage = 1,  // Giảm theo %
        FixedAmount = 2  // Giảm số tiền cố định
    }

    // Bảng lưu lịch sử sử dụng coupon
    public class CouponUsage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CouponId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public int OrderId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; } // Số tiền thực tế được giảm

        public DateTime UsedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("CouponId")]
        public virtual Coupon Coupon { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; } = null!;

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;
    }
}