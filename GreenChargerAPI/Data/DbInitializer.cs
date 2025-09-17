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
                                Name = "Sạc nhanh 20W",
                                Description = "Sạc nhanh cho điện thoại, công suất 20W.",
                                Price = 250000,
                                StockQuantity = 100,
                                MainImageUrl = "sacnhanh20w.jpg",
                                CategoryId = sacCategory?.Id ?? 0,
                                IsActive = true,
                                OrderDetails = new List<OrderDetail>()
                            },
                            new Product {
                                Name = "Tai nghe Bluetooth",
                                Description = "Tai nghe không dây, kết nối Bluetooth 5.0.",
                                Price = 350000,
                                StockQuantity = 50,
                                MainImageUrl = "tainghebluetooth.jpg",
                                CategoryId = taingheCategory?.Id ?? 0,
                                IsActive = true,
                                OrderDetails = new List<OrderDetail>()
                            },
                            new Product {
                                Name = "Dây sạc USB-C",
                                Description = "Dây sạc USB-C dài 1m, hỗ trợ sạc nhanh.",
                                Price = 80000,
                                StockQuantity = 200,
                                MainImageUrl = "daysacusbc.jpg",
                                CategoryId = daySacCategory?.Id ?? 0,
                                IsActive = true,
                                OrderDetails = new List<OrderDetail>()
                            }
                        };
                        context.Products.AddRange(products);
                        await context.SaveChangesAsync();
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