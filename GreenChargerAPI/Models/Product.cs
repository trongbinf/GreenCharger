using System;
using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models
{
    public class Product
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }
        
        
        [Required]
        public required string Description { get; set; }
        
        [Required]
        public decimal Price { get; set; }
        
        public decimal Discount { get; set; } = 0;
        
        public int StockQuantity { get; set; }
        
        [StringLength(200)]
        public required string MainImageUrl { get; set; }
        
        public List<string> DetailImageUrls { get; set; } = new List<string>();
        
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        
        public bool IsActive { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        public required ICollection<OrderDetail> OrderDetails { get; set; }
    }

    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; } = 0;
        public int StockQuantity { get; set; }
        public string MainImageUrl { get; set; }
        public List<string> DetailImageUrls { get; set; } = new List<string>();
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 