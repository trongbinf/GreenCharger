using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenChargerAPI.Models
{
    public class Review
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Rating phải từ 1 đến 5")]
        public int Rating { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Comment { get; set; } = string.Empty;

        // Ảnh đánh giá (có thể có nhiều ảnh)
        public string? Images { get; set; } // JSON array của URLs

        public bool IsVerifiedPurchase { get; set; } = false; // Đã mua hàng hay chưa

        public bool IsApproved { get; set; } = false; // Admin duyệt hay chưa

        public int HelpfulCount { get; set; } = 0; // Số lượt "Hữu ích"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Keys
        [Required]
        public int ProductId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        public int? OrderId { get; set; } // Có thể null nếu chưa mua

        // Navigation Properties
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; } = null!;

        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }

        public virtual ICollection<ReviewHelpful> ReviewHelpfuls { get; set; } = new List<ReviewHelpful>();
    }

    // Bảng phụ để lưu người dùng đã click "Hữu ích" cho review nào
    public class ReviewHelpful
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ReviewId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("ReviewId")]
        public virtual Review Review { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; } = null!;
    }
}