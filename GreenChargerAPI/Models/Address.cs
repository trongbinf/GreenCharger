using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenChargerAPI.Models
{
    public class Address
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Province { get; set; } = string.Empty; // Tỉnh/Thành phố

        [Required]
        [StringLength(100)]
        public string District { get; set; } = string.Empty; // Quận/Huyện

        [Required]
        [StringLength(100)]
        public string Ward { get; set; } = string.Empty; // Phường/Xã

        [Required]
        [StringLength(500)]
        public string DetailAddress { get; set; } = string.Empty; // Địa chỉ cụ thể

        [StringLength(500)]
        public string? Note { get; set; } // Ghi chú

        public bool IsDefault { get; set; } = false; // Địa chỉ mặc định

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        [Required]
        public string UserId { get; set; } = string.Empty;

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; } = null!;

        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

        // Computed Property
        [NotMapped]
        public string FullAddress => $"{DetailAddress}, {Ward}, {District}, {Province}";
    }
}