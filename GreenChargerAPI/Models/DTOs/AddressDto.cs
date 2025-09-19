using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models.DTOs
{
    // DTO để hiển thị thông tin Address
    public class AddressDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Ward { get; set; } = string.Empty;
        public string DetailAddress { get; set; } = string.Empty;
        public string? Note { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
        public string FullAddress { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string UserId { get; set; } = string.Empty;
    }

    // DTO để tạo Address mới
    public class CreateAddressDto
    {
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [StringLength(200, ErrorMessage = "Họ tên không được vượt quá 200 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tỉnh/Thành phố là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tỉnh/Thành phố không được vượt quá 100 ký tự")]
        public string Province { get; set; } = string.Empty;

        [Required(ErrorMessage = "Quận/Huyện là bắt buộc")]
        [StringLength(100, ErrorMessage = "Quận/Huyện không được vượt quá 100 ký tự")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phường/Xã là bắt buộc")]
        [StringLength(100, ErrorMessage = "Phường/Xã không được vượt quá 100 ký tự")]
        public string Ward { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ cụ thể là bắt buộc")]
        [StringLength(500, ErrorMessage = "Địa chỉ cụ thể không được vượt quá 500 ký tự")]
        public string DetailAddress { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Note { get; set; }

        public bool IsDefault { get; set; } = false;
    }

    // DTO để cập nhật Address
    public class UpdateAddressDto
    {
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [StringLength(200, ErrorMessage = "Họ tên không được vượt quá 200 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tỉnh/Thành phố là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tỉnh/Thành phố không được vượt quá 100 ký tự")]
        public string Province { get; set; } = string.Empty;

        [Required(ErrorMessage = "Quận/Huyện là bắt buộc")]
        [StringLength(100, ErrorMessage = "Quận/Huyện không được vượt quá 100 ký tự")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phường/Xã là bắt buộc")]
        [StringLength(100, ErrorMessage = "Phường/Xã không được vượt quá 100 ký tự")]
        public string Ward { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ cụ thể là bắt buộc")]
        [StringLength(500, ErrorMessage = "Địa chỉ cụ thể không được vượt quá 500 ký tự")]
        public string DetailAddress { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Note { get; set; }

        public bool IsDefault { get; set; } = false;
        public bool IsActive { get; set; } = true;
    }

    // DTO để tìm kiếm Address
    public class AddressSearchDto
    {
        public string? Keyword { get; set; } // Tìm theo tên, sdt, địa chỉ
        public string? Province { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public bool? IsDefault { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? OrderBy { get; set; } = "CreatedAt";
        public string? OrderDirection { get; set; } = "desc";
    }

    // DTO cho response danh sách Address
    public class AddressListResponseDto
    {
        public List<AddressDto> Addresses { get; set; } = new List<AddressDto>();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // DTO để đặt làm địa chỉ mặc định
    public class SetDefaultAddressDto
    {
        [Required]
        public int AddressId { get; set; }
    }
}