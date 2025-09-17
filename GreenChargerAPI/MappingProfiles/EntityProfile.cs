using AutoMapper;
using GreenChargerAPI.Models;

namespace GreenChargerAPI.MappingProfiles
{
    public class EntityProfile : Profile
    {
        public EntityProfile()
        {
            // Product <-> ProductDto
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.IsActive));
            CreateMap<ProductDto, Product>();

            // Category <-> CategoryDto
            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count : 0));
            CreateMap<CategoryDto, Category>();

            // ApplicationUser <-> UserDto
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => (src.FirstName + " " + src.LastName).Trim()))
                .ForMember(dest => dest.IsLocked, opt => opt.MapFrom(src => src.LockoutEnd != null && src.LockoutEnd > DateTime.UtcNow));
            CreateMap<UserDto, ApplicationUser>()
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => GetFirstName(src.FullName)))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => GetLastName(src.FullName)));
        }

        private static string GetFirstName(string fullName)
        {
            if (string.IsNullOrEmpty(fullName)) return string.Empty;
            var parts = fullName.Split(' ', 2);
            return parts[0];
        }
        private static string GetLastName(string fullName)
        {
            if (string.IsNullOrEmpty(fullName)) return string.Empty;
            var parts = fullName.Split(' ', 2);
            return parts.Length > 1 ? parts[1] : string.Empty;
        }
    }
} 