using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models.DTOs
{
    // DTO để hiển thị thông tin Review
    public class ReviewDto
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new List<string>();
        public bool IsVerifiedPurchase { get; set; }
        public bool IsApproved { get; set; }
        public int HelpfulCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserAvatar { get; set; } = string.Empty;
        public int? OrderId { get; set; }
        public bool IsHelpfulByCurrentUser { get; set; } = false; // User hiện tại đã click hữu ích chưa
    }

    // DTO để tạo Review mới
    public class CreateReviewDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Rating là bắt buộc")]
        [Range(1, 5, ErrorMessage = "Rating phải từ 1 đến 5")]
        public int Rating { get; set; }

        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tiêu đề không được vượt quá 100 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung đánh giá là bắt buộc")]
        [StringLength(1000, ErrorMessage = "Nội dung đánh giá không được vượt quá 1000 ký tự")]
        public string Comment { get; set; } = string.Empty;

        public List<string> Images { get; set; } = new List<string>();

        public int? OrderId { get; set; }

        public bool RequirePurchase { get; set; } = false;
    }

    // DTO để cập nhật Review
    public class UpdateReviewDto
    {
        [Required(ErrorMessage = "Rating là bắt buộc")]
        [Range(1, 5, ErrorMessage = "Rating phải từ 1 đến 5")]
        public int Rating { get; set; }

        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tiêu đề không được vượt quá 100 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung đánh giá là bắt buộc")]
        [StringLength(1000, ErrorMessage = "Nội dung đánh giá không được vượt quá 1000 ký tự")]
        public string Comment { get; set; } = string.Empty;

        public List<string> Images { get; set; } = new List<string>();
    }

    // DTO để tìm kiếm Review
    public class ReviewSearchDto
    {
        public int? ProductId { get; set; }
        public string? UserId { get; set; }
        public int? Rating { get; set; } // Lọc theo rating
        public int? MinRating { get; set; } // Rating tối thiểu
        public int? MaxRating { get; set; } // Rating tối đa
        public bool? IsVerifiedPurchase { get; set; }
        public bool? IsApproved { get; set; }
        public string? Keyword { get; set; } // Tìm trong title và comment
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? OrderBy { get; set; } = "CreatedAt";
        public string? OrderDirection { get; set; } = "desc";
    }

    // DTO cho response danh sách Review
    public class ReviewListResponseDto
    {
        public List<ReviewDto> Reviews { get; set; } = new List<ReviewDto>();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
        public ReviewStatisticsDto Statistics { get; set; } = new ReviewStatisticsDto();
    }

    // DTO thống kê Review
    public class ReviewStatisticsDto
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int FiveStarCount { get; set; }
        public int FourStarCount { get; set; }
        public int ThreeStarCount { get; set; }
        public int TwoStarCount { get; set; }
        public int OneStarCount { get; set; }
        public double FiveStarPercentage { get; set; }
        public double FourStarPercentage { get; set; }
        public double ThreeStarPercentage { get; set; }
        public double TwoStarPercentage { get; set; }
        public double OneStarPercentage { get; set; }
        public int VerifiedPurchaseCount { get; set; }
    }

    // DTO để approve/reject Review (dành cho Admin)
    public class ReviewApprovalDto
    {
        [Required]
        public int ReviewId { get; set; }
        
        [Required]
        public bool IsApproved { get; set; }
        
        public string? AdminNote { get; set; }
    }

    // DTO để mark review là helpful
    public class MarkReviewHelpfulDto
    {
        [Required]
        public int ReviewId { get; set; }
        
        [Required]
        public bool IsHelpful { get; set; } // true = mark helpful, false = unmark helpful
    }

    // DTO để lấy review theo sản phẩm
    public class ProductReviewSummaryDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public ReviewStatisticsDto Statistics { get; set; } = new ReviewStatisticsDto();
        public List<ReviewDto> RecentReviews { get; set; } = new List<ReviewDto>();
    }
}