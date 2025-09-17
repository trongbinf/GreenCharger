using System;
using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models
{
    public class Cart
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public string UserId { get; set; } = string.Empty; // FK đến ApplicationUser
        public int ProductId { get; set; } // FK đến Product
        public int Quantity { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        // Navigation
        public ApplicationUser? User { get; set; }
        public Product? Product { get; set; }
    }
}
