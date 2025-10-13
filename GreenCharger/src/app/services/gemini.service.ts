import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GoogleGenAI } from '@google/genai';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface ProductInfo {
  name: string;
  price: number;
  finalPrice?: number;
  categoryName: string;
  description?: string;
  quantityInStock: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly apiKey = environment.geminiApiKey;
  private readonly modelId = 'gemini-2.5-flash';
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  generateProductResponse(userMessage: string, product: ProductInfo): Observable<string> {
    if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
      return throwError(() => new Error('API key not configured'));
    }

    const productContext = `
      Sản phẩm: ${product.name}
      Giá gốc: ${this.formatCurrency(product.price)}
      Giá khuyến mãi: ${product.finalPrice ? this.formatCurrency(product.finalPrice) : 'Không có'}
      Danh mục: ${product.categoryName}
      Mô tả: ${product.description || 'Chưa có mô tả chi tiết'}
      Tình trạng: ${product.quantityInStock > 0 ? 'Còn hàng' : 'Hết hàng'}
      Số lượng còn lại: ${product.quantityInStock} sản phẩm
    `;

    const systemPrompt = `Bạn là Green Charger AI, trợ lý tư vấn sản phẩm chuyên nghiệp. 
    CHỈ trả lời các câu hỏi liên quan đến sản phẩm này. KHÔNG trả lời các câu hỏi không liên quan.
    
    Thông tin sản phẩm:
    ${productContext}
    
    Quy tắc nghiêm ngặt:
    - CHỈ trả lời câu hỏi về sản phẩm này
    - Nếu câu hỏi không liên quan đến sản phẩm, trả lời: "Xin lỗi, tôi chỉ có thể tư vấn về sản phẩm này. Bạn có câu hỏi gì về sản phẩm không?"
    - Trả lời bằng tiếng Việt
    - Thân thiện và chuyên nghiệp
    - Cung cấp thông tin chính xác về sản phẩm
    - Giữ câu trả lời ngắn gọn, dễ hiểu
    - Với các câu hỏi LIÊN QUAN đến sản phẩm nhưng KHÔNG thuộc nhóm mua hàng/thanh toán, hãy trả lời bình thường dựa trên ngữ cảnh sản phẩm và kiến thức phù hợp.
    
    So sánh sản phẩm:
    - Nếu người dùng yêu cầu so sánh với một sản phẩm khác: KHÔNG dùng mẫu có sẵn; tự đọc hiểu câu hỏi và so sánh dựa trên thông tin của sản phẩm hiện tại và thông tin người dùng cung cấp về sản phẩm kia.
    - Nếu thiếu dữ liệu về sản phẩm kia: nêu rõ hạn chế, đề nghị người dùng cung cấp tên model/thông số chính (công suất, chuẩn sạc, độ bền cáp, giá...), hoặc cho tiêu chí so sánh chung để tự đối chiếu.
    - KHÔNG bịa đặt thông số. Chỉ nêu những gì chắc chắn từ ngữ cảnh và thông tin người dùng đưa ra.
    - Trình bày so sánh ngắn gọn theo gạch đầu dòng khi phù hợp.
    
    Xử lý câu hỏi mua hàng/thanh toán:
    - Nếu chứa từ khóa "bảo hành": trả lời rõ "Sản phẩm được bảo hành 2 năm kể từ ngày mua. Để được hỗ trợ xử lý bảo hành, vui lòng liên hệ Fanpage: https://web.facebook.com/GreenChargerVN/"
    - Nếu người dùng hỏi về: thanh toán, đặt hàng, mua, ship, giao hàng, phí ship, đổi/trả, hoàn tiền, khuyến mãi, cách mua
    - Trả lời rõ: "Hiện tại website chưa hỗ trợ mua hàng trực tuyến. Bạn vui lòng liên hệ Fanpage Facebook của Green Charger để được hỗ trợ đặt mua/thanh toán/ship: https://web.facebook.com/GreenChargerVN/"
    - Không yêu cầu thông tin nhạy cảm (số thẻ, OTP...)
    - Luôn nhắc người dùng có thể nhắn trực tiếp Fanpage để được hỗ trợ nhanh
    
    Kết thúc:
    - Luôn kết thúc bằng một dòng ngắn gọn kêu gọi liên hệ Fanpage
    - Luôn ký tên "Green Charger AI" ở cuối mỗi câu trả lời`;

    const contents = `${systemPrompt}\n\nKhách hàng hỏi: ${userMessage}`;

    return from(this.client.models.generateContent({
      model: this.modelId,
      contents,
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
        thinkingConfig: { thinkingBudget: 0 }
      }
    })).pipe(
      map((response: any) => {
        // SDK v2 returns response.text (function or string depending on version)
        const textVal = typeof response.text === 'function' ? response.text() : response.text;
        if (textVal) return textVal;
        const fallback = response?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (fallback) return fallback;
        throw new Error('Invalid response format');
      }),
      catchError(error => {
        console.error('Gemini API Error (SDK):', error);
        return throwError(() => error);
      })
    );
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  }
}
