using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models.DTOs
{
    // DTO để hiển thị wishlist item
    public class WishlistDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public ProductDto Product { get; set; } = null!;
    }

    // DTO để hiển thị item trong wishlist
    public class WishlistItemDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int ProductId { get; set; }
        
        // Thông tin Product
        public string ProductName { get; set; } = string.Empty;
        public string ProductSlug { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? SalePrice { get; set; }
        public string? MainImage { get; set; }
        public bool IsInStock { get; set; }
        public int StockQuantity { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }

    // DTO để thêm sản phẩm vào wishlist
    public class AddToWishlistDto
    {
        [Required(ErrorMessage = "Product ID là bắt buộc")]
        public int ProductId { get; set; }
    }

    // DTO để xóa sản phẩm khỏi wishlist
    public class RemoveFromWishlistDto
    {
        [Required(ErrorMessage = "Product ID là bắt buộc")]
        public int ProductId { get; set; }
    }

    // DTO để xóa nhiều item khỏi wishlist
    public class RemoveMultipleFromWishlistDto
    {
        [Required(ErrorMessage = "Danh sách Product IDs là bắt buộc")]
        [MinLength(1, ErrorMessage = "Phải có ít nhất 1 sản phẩm")]
        public List<int> ProductIds { get; set; } = new List<int>();
    }

    // DTO để tìm kiếm trong wishlist
    public class WishlistSearchDto
    {
        public string? Keyword { get; set; } // Tìm theo tên sản phẩm
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool? IsInStock { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 12;
        public string? OrderBy { get; set; } = "CreatedAt";
        public string? OrderDirection { get; set; } = "desc";
    }

    // DTO cho response danh sách wishlist
    public class WishlistResponseDto
    {
        public List<WishlistItemDto> Items { get; set; } = new List<WishlistItemDto>();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // DTO để kiểm tra sản phẩm có trong wishlist không
    public class CheckWishlistDto
    {
        [Required]
        public int ProductId { get; set; }
    }

    // DTO response khi kiểm tra wishlist
    public class CheckWishlistResponseDto
    {
        public int ProductId { get; set; }
        public bool IsInWishlist { get; set; }
        public int? WishlistId { get; set; }
        public DateTime? AddedDate { get; set; }
    }

    // DTO để lấy thống kê wishlist
    public class WishlistStatisticsDto
    {
        public int TotalItems { get; set; }
        public int InStockItems { get; set; }
        public int OutOfStockItems { get; set; }
        public decimal TotalValue { get; set; } // Tổng giá trị wishlist
        public decimal TotalSaleValue { get; set; } // Tổng giá trị khi có sale
        public decimal PotentialSavings { get; set; } // Tiết kiệm được nếu mua hết
        public int CategoriesCount { get; set; } // Số lượng category khác nhau
        public DateTime? OldestItemDate { get; set; }
        public DateTime? NewestItemDate { get; set; }
    }

    // DTO để move từ wishlist sang cart
    public class MoveToCartDto
    {
        [Required]
        public int ProductId { get; set; }
        
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; } = 1;
    }

    // DTO để move nhiều item từ wishlist sang cart
    public class MoveMultipleToCartDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "Phải có ít nhất 1 sản phẩm")]
        public List<MoveToCartItemDto> Items { get; set; } = new List<MoveToCartItemDto>();
    }

    public class MoveToCartItemDto
    {
        [Required]
        public int ProductId { get; set; }
        
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; } = 1;
    }

    // DTO response cho thao tác move to cart
    public class MoveToCartResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<int> SuccessfulProductIds { get; set; } = new List<int>();
        public List<int> FailedProductIds { get; set; } = new List<int>();
        public List<string> Errors { get; set; } = new List<string>();
    }
}