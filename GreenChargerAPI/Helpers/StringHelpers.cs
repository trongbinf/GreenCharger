using System;
using System.Text;
using System.Globalization;
using System.Text.RegularExpressions;

namespace GreenChargerAPI.Helpers
{
    public static class StringHelpers
    {
        /// <summary>
        /// Removes Vietnamese diacritics from a string
        /// </summary>
        /// <param name="text">The text to normalize</param>
        /// <returns>Normalized text without diacritics</returns>
        public static string NormalizeVietnamese(this string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            string normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();

            foreach (char c in normalized)
            {
                UnicodeCategory category = CharUnicodeInfo.GetUnicodeCategory(c);
                if (category != UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(c);
                }
            }

            // Additional replacements for Vietnamese characters
            string result = sb.ToString().Normalize(NormalizationForm.FormC);
            result = Regex.Replace(result, "đ", "d", RegexOptions.IgnoreCase);
            
            return result.ToLowerInvariant();
        }

        /// <summary>
        /// Determines if a string contains another string, ignoring diacritics
        /// </summary>
        /// <param name="source">The source string</param>
        /// <param name="value">The string to find</param>
        /// <param name="comparison">String comparison options</param>
        /// <returns>True if the source contains the value</returns>
        public static bool ContainsIgnoreDiacritics(this string source, string value, StringComparison comparison = StringComparison.OrdinalIgnoreCase)
        {
            if (string.IsNullOrEmpty(source) || string.IsNullOrEmpty(value))
                return false;

            string normalizedSource = NormalizeVietnamese(source);
            string normalizedValue = NormalizeVietnamese(value);

            return normalizedSource.Contains(normalizedValue, comparison);
        }
    }
}
