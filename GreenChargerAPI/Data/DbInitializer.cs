using Microsoft.AspNetCore.Identity;
using GreenChargerAPI.Models;

namespace GreenChargerAPI.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Create roles if they don't exist
            string[] roleNames = { "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }
            // Seed Category and Product
            using (var scope = serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                // Seed Categories
                if (!context.Categories.Any())
                {
                    var categories = new List<Category>
                        {
                            new Category { Name = "Sạc điện thoại", Description = "Các loại sạc điện thoại" },
                            new Category { Name = "Tai nghe", Description = "Các loại tai nghe" },
                            new Category { Name = "Dây sạc", Description = "Các loại dây sạc" }
                        };
                    context.Categories.AddRange(categories);
                    await context.SaveChangesAsync();
                }


                // Seed Products
                if (!context.Products.Any())
                {
                    var sacCategory = context.Categories.FirstOrDefault(c => c.Name == "Sạc điện thoại");
                    var taingheCategory = context.Categories.FirstOrDefault(c => c.Name == "Tai nghe");
                    var daySacCategory = context.Categories.FirstOrDefault(c => c.Name == "Dây sạc");

                    var products = new List<Product>
    {
        new Product {
            Name = "Bộ sạc nhanh Hoco C109 PD18W+QC3.0",
            Description = "Sạc nhanh PD18W, QC3.0, kèm cáp dài 1m, chân dẹt.",
            Price = 120000,
            Discount = 0,
            StockQuantity = 100,
            MainImageUrl = "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lyunc46zdwv5e0",
            CategoryId = sacCategory?.Id ?? 0,
            IsActive = true,
            OrderDetails = new List<OrderDetail>()
        },
        new Product {
            Name = "Củ sạc Hoco C81 sạc nhanh 2.1A",
            Description = "Củ sạc Hoco 1 cổng USB, đầu vào AC 100-240V, an toàn chống cháy.",
            Price = 90000,
            Discount = 0,
            StockQuantity = 120,
            MainImageUrl = "https://down-vn.img.susercontent.com/file/vn-11134201-7ras8-m228mbf6yc2jc8",
            CategoryId = sacCategory?.Id ?? 0,
            IsActive = true,
            OrderDetails = new List<OrderDetail>()
        },
        new Product {
            Name = "Cáp sạc 2.4A Hoco X88 USB to IP",
            Description = "Cáp sạc nhanh 2.4A, dài 1m, dùng cho iPhone (Lightning).",
            Price = 70000,
            Discount = 0,
            StockQuantity = 200,
            MainImageUrl = "https://linhkienlammusic.com/wp-content/uploads/2025/02/vn-11134207-7r98o-lvr10pzakpga5f.jpg",
            CategoryId = daySacCategory?.Id ?? 0,
            IsActive = true,
            OrderDetails = new List<OrderDetail>()
        },
        new Product {
            Name = "Cáp sạc nhanh và truyền dữ liệu Hoco DU0 Type-C",
            Description = "Cáp USB sang Type-C, hỗ trợ sạc nhanh 3A và truyền dữ liệu, dài 1m.",
            Price = 85000,
            Discount = 0,
            StockQuantity = 150,
            MainImageUrl = "https://hoco.vn/data/Product/cap-du-lieu-sac-x104-source-60w-type-c-sang-type-cl-2m-n0lIVNcab9p6y6BU3il0.jpg",
            CategoryId = daySacCategory?.Id ?? 0,
            IsActive = true,
            OrderDetails = new List<OrderDetail>()
        },
        new Product {
            Name = "Bộ sạc nhanh PD10W Hoco C81 USB to IP",
            Description = "Bộ sạc gồm củ Hoco C81 + cáp Lightning, hỗ trợ PD10W, dài 1m.",
            Price = 100000,
            Discount = 0,
            StockQuantity = 80,
            MainImageUrl = "https://hoco.vn/data/Product/bo-sac-hoco-c81-micro-1-cong-usb-5v-2-1a-CAusL6nRnm0J8kv76Ykj.jpg",
            CategoryId = sacCategory?.Id ?? 0,
            IsActive = true,
            OrderDetails = new List<OrderDetail>()
        },
        new Product {
            Name = "Cáp sạc nhanh Type-C to IP PD20W 3.0A Hoco",
            Description = "Cáp bọc nylon, hỗ trợ sạc nhanh PD20W, dòng tối đa 3A, dài 1m.",
            Price = 110000,
            Discount = 0,
            StockQuantity = 180,
            MainImageUrl = "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lybqfpywkrpp4d",
            CategoryId = daySacCategory?.Id ?? 0,
            IsActive = true,
            OrderDetails = new List<OrderDetail>()
        }
    };


                }


            }

            // Create admin user
            var adminId = "A1B2C3D4"; // Short alphanumeric ID for admin
            var adminUser = await userManager.FindByIdAsync(adminId);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    Id = adminId,
                    UserName = "admin@mocviet.com",
                    Email = "admin@mocviet.com",
                    EmailConfirmed = true,
                    FirstName = "Admin",
                    LastName = "User",
                    PhoneNumber = "0123456789",
                    Address = "Admin Address",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // Create regular user
            var userId = "U1S2E3R4"; // Short alphanumeric ID for regular user
            var regularUser = await userManager.FindByIdAsync(userId);
            if (regularUser == null)
            {
                regularUser = new ApplicationUser
                {
                    Id = userId,
                    UserName = "user@mocviet.com",
                    Email = "user@mocviet.com",
                    EmailConfirmed = true,
                    FirstName = "Regular",
                    LastName = "User",
                    PhoneNumber = "0987654321",
                    Address = "User Address",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(regularUser, "User@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(regularUser, "User");
                }
            }
        }
    }
}