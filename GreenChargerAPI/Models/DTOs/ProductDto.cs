using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public decimal? DiscountPrice { get; set; }
        public decimal FinalPrice { get; set; }
        public int StockQuantity { get; set; }
        public int QuantityInStock { get; set; }
        public string? MainImageUrl { get; set; }
        public List<string>? DetailImageUrls { get; set; }
        public List<string>? ImageUrls { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsNew { get; set; }
        public bool IsOnSale { get; set; }
        public bool IsFeatured { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ProductCreateDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public decimal Price { get; set; }
        
        public decimal Discount { get; set; } = 0;
        
        public int StockQuantity { get; set; }
        
        // Ảnh chính - có thể null
        [StringLength(200)]
        public string? MainImageUrl { get; set; }
        
        // Ảnh phụ - có thể null
        public List<string>? DetailImageUrls { get; set; }
        
        [Required]
        public int CategoryId { get; set; }
        
        public bool IsActive { get; set; } = true;
    }

    public class ProductUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? Discount { get; set; }
        public int StockQuantity { get; set; }
        public string? MainImageUrl { get; set; }
        public List<string>? DetailImageUrls { get; set; }
        public int CategoryId { get; set; }
        public bool IsActive { get; set; }
    }

    public class ProductSearchDto
    {
        public string? Keyword { get; set; }
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool? IsActive { get; set; }
        public string SortBy { get; set; } = "Name"; // Name, Price, CreatedAt
        public string SortOrder { get; set; } = "ASC"; // ASC, DESC
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class ProductListResponseDto
    {
        public List<ProductDto> Products { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }

    // DTO riêng cho upload ảnh
    public class ProductImageUploadDto
    {
        public int ProductId { get; set; }
        public string? MainImageUrl { get; set; }
        public List<string>? DetailImageUrls { get; set; }
    }
}
