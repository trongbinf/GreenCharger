using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenChargerAPI.Models
{
    public class Order
    {
        public int Id { get; set; }
        
        [Required]
        public required string CustomerName { get; set; }
        
        [Required]
        [EmailAddress]
        public required string CustomerEmail { get; set; }
        
        [Required]
        [Phone]
        public required string CustomerPhone { get; set; }
        
        [Required]
        public required string ShippingAddress { get; set; }
        
        public decimal TotalAmount { get; set; }
        
        public OrderStatus Status { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Foreign Keys for new models
        public string? UserId { get; set; }
        public int? AddressId { get; set; }
        
        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
        
        [ForeignKey("AddressId")]
        public virtual Address? Address { get; set; }
        
        public required ICollection<OrderDetail> OrderDetails { get; set; }
    }
    
    public enum OrderStatus
    {
        Pending,
        Processing,
        Shipped,
        Delivered,
        Cancelled
    }
}
