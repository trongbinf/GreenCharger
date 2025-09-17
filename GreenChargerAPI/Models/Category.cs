using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models
{
    public class Category
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string Description { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? ImageUrl { get; set; }
        
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
     public class CategoryDto
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
            public string? ImageUrl { get; set; }
            public int ProductCount { get; set; }
        }
} 