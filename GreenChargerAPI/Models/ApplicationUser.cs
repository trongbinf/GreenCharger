using Microsoft.AspNetCore.Identity;

namespace GreenChargerAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; }
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "The Email field is required.")]
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; }
        public bool IsLocked { get; set; }
        public bool EmailConfirmed { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string PhoneNumber { get; set; }
    }

    public class UserUpdateDto
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
    }

    public class RoleUpdateDto
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "The Role field is required.")]
        public string Role { get; set; }
    }
} 