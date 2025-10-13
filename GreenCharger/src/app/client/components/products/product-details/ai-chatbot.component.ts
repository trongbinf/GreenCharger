import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, ProductInfo } from '../../../../services/gemini.service';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [GeminiService],
  template: `
    <!-- Chat Toggle Button -->
    <div class="chat-toggle" (click)="toggleChat()" [class.active]="isOpen">
      <img src="https://res.cloudinary.com/ddkvhnj27/image/upload/v1758400063/z7019344847597_aa447955326b74efcd30844f0ddafb97_mcbqgu.jpg" alt="Green Charger" class="toggle-logo" *ngIf="!isOpen" />
      <i class="fas fa-times" *ngIf="isOpen"></i>
    </div>

    <!-- Chat Window -->
    <div class="chat-window" [class.open]="isOpen">
      <div class="chat-header">
        <div class="chat-title">
          <img src="https://res.cloudinary.com/ddkvhnj27/image/upload/v1758400063/z7019344847597_aa447955326b74efcd30844f0ddafb97_mcbqgu.jpg" alt="Green Charger" class="chat-logo" />
          <span>Green Charger AI</span>
        </div>
        <div class="chat-status" [class.online]="isOnline">
          <span class="status-dot"></span>
          {{ isOnline ? 'Đang hoạt động' : 'Đang kết nối...' }}
        </div>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div class="message" 
             *ngFor="let message of messages" 
             [class.user-message]="message.isUser"
             [class.bot-message]="!message.isUser">
          <div class="message-avatar" *ngIf="!message.isUser">
            <img src="https://res.cloudinary.com/ddkvhnj27/image/upload/v1758400063/z7019344847597_aa447955326b74efcd30844f0ddafb97_mcbqgu.jpg" alt="Green Charger AI" class="avatar-img" />
          </div>
               <div class="message-content">
                 <div class="message-text" [innerHTML]="message.content"></div>
                 <div class="message-time">{{ formatTime(message.timestamp) }}</div>
               </div>
        </div>

        <!-- Typing Indicator -->
        <div class="message bot-message" *ngIf="isTyping">
          <div class="message-avatar">
            <img src="https://res.cloudinary.com/ddkvhnj27/image/upload/v1758400063/z7019344847597_aa447955326b74efcd30844f0ddafb97_mcbqgu.jpg" alt="Green Charger AI" class="avatar-img" />
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <div class="input-container">
          <input 
            type="text" 
            [(ngModel)]="currentMessage" 
            (keyup.enter)="sendMessage()"
            placeholder="Hỏi về sản phẩm này..."
            [disabled]="isTyping"
            #messageInput>
          <button 
            class="send-button" 
            (click)="sendMessage()"
            [disabled]="!currentMessage.trim() || isTyping">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        <div class="quick-questions">
          <button 
            class="quick-question" 
            *ngFor="let question of quickQuestions"
            (click)="sendQuickQuestion(question)"
            [disabled]="isTyping">
            {{ question }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      background: #2c2c2c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
      z-index: 1000;
      border: 2px solid #404040;
    }

    .chat-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
      background: #333;
    }

    .chat-toggle.active {
      background: #333;
      transform: translateY(-2px);
    }

    .chat-toggle i {
      color: white;
      font-size: 24px;
    }

    .toggle-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    .chat-window {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 400px;
      height: 600px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      transform: translateY(100%) scale(0.9);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999;
      overflow: hidden;
    }

    .chat-window.open {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .chat-header {
      padding: 20px 24px;
      background: #2c2c2c;
      color: white;
      border-radius: 24px 24px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .chat-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 16px;
      position: relative;
      z-index: 1;
    }

    .chat-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.1);
      background: white;
      padding: 4px;
    }

    .chat-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      opacity: 0.8;
      position: relative;
      z-index: 1;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e74c3c;
      animation: pulse 2s infinite;
    }

    .status-dot.online {
      background: #27ae60;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .chat-messages {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #ffffff;
    }

    .chat-messages::-webkit-scrollbar {
      width: 4px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 2px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: rgba(46, 204, 113, 0.3);
      border-radius: 2px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover {
      background: rgba(46, 204, 113, 0.5);
    }

    .message {
      display: flex;
      gap: 12px;
      max-width: 85%;
      animation: messageSlideIn 0.3s ease-out;
    }

    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .user-message {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .bot-message {
      align-self: flex-start;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      flex-shrink: 0;
      overflow: hidden;
      border: 2px solid rgba(0, 0, 0, 0.1);
      padding: 2px;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .message-text {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
    }

    .user-message .message-text {
      background: #2c2c2c;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .bot-message .message-text {
      background: #f5f5f5;
      color: #333;
      border-bottom-left-radius: 4px;
    }

    .message-time {
      font-size: 11px;
      color: #999;
      padding: 0 4px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: #f1f3f4;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .chat-input {
      padding: 20px 24px;
      border-top: 1px solid #e0e0e0;
      background: #ffffff;
    }

    .input-container {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .input-container input {
      flex: 1;
      padding: 12px 16px;
      border: none;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
      background: #2c2c2c;
      color: white;
      transition: all 0.3s ease;
    }

    .input-container input::placeholder {
      color: #999;
    }

    .input-container input:focus {
      background: #333;
    }

    .send-button {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: #2c2c2c;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .send-button:hover:not(:disabled) {
      background: #333;
      transform: scale(1.05);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .quick-questions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .quick-question {
      padding: 10px 16px;
      background: #2c2c2c;
      border: none;
      border-radius: 12px;
      font-size: 12px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .quick-question:hover:not(:disabled) {
      background: #333;
      transform: translateY(-1px);
    }

    .quick-question:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 480px) {
      .chat-window {
        width: calc(100vw - 40px);
        right: 20px;
        left: 20px;
      }
    }
  `]
})
export class AiChatbotComponent implements OnInit {
  @Input() product: any = null;

  isOpen = false;
  isOnline = false;
  isTyping = false;
  currentMessage = '';
  messages: ChatMessage[] = [];

  quickQuestions = [
    'Sản phẩm này có gì đặc biệt?',
    'Giá có thể thương lượng không?',
    'Có bảo hành không?',
    
  ];

  constructor(private geminiService: GeminiService) {}

  ngOnInit() {
    this.initializeChat();
  }

  initializeChat() {
    this.isOnline = true;
    this.addBotMessage('Xin chào! Tôi là Green Charger AI, trợ lý tư vấn sản phẩm của bạn. Tôi có thể giúp bạn tìm hiểu về sản phẩm này. Bạn có câu hỏi gì không?');
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isTyping) return;

    const userMessage = this.currentMessage.trim();
    this.addUserMessage(userMessage);
    this.currentMessage = '';

    this.sendToGemini(userMessage);
  }

  sendQuickQuestion(question: string) {
    if (this.isTyping) return;
    this.addUserMessage(question);
    this.sendToGemini(question);
  }

  addUserMessage(content: string) {
    this.messages.push({
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    });
    this.scrollToBottom();
  }

  addBotMessage(content: string) {
    this.messages.push({
      id: Date.now().toString(),
      content,
      isUser: false,
      timestamp: new Date()
    });
    this.scrollToBottom();
    
    // Re-initialize global function after adding new message
    setTimeout(() => {
      (window as any).contactViaMessenger = function(productName: string, topic: string) {
        const message = `🛍️ Tư vấn sản phẩm Green Charger

📱 Sản phẩm: ${productName}
💬 Chủ đề quan tâm: ${topic}

Xin chào! Tôi quan tâm đến sản phẩm này và muốn được tư vấn thêm thông tin chi tiết.

Cảm ơn bạn! 🙏`;
        
        const facebookUrl = `https://web.facebook.com/GreenChargerVN/`;
        window.open(facebookUrl, '_blank');
      };
    }, 100);
  }

  async sendToGemini(userMessage: string) {
    this.isTyping = true;

    try {
      if (!this.product) {
        this.addBotMessage('Xin lỗi, tôi chỉ có thể tư vấn khi bạn đang xem chi tiết sản phẩm. Vui lòng chọn một sản phẩm để tôi có thể hỗ trợ bạn tốt hơn.\n\n- Green Charger AI');
        return;
      }

      const productInfo: ProductInfo = {
        name: this.product.name,
        price: this.product.price,
        finalPrice: this.product.finalPrice,
        categoryName: this.product.categoryName,
        description: this.product.description,
        quantityInStock: this.product.quantityInStock
      };

      console.log('Sending request to Gemini API...');
      
      this.geminiService.generateProductResponse(userMessage, productInfo).subscribe({
        next: (response: string) => {
          console.log('Gemini API Response:', response);
          this.addBotMessage(response);
        },
        error: (error: any) => {
          console.error('Gemini API Error:', error);
          const fallbackResponse = this.getFallbackResponse(userMessage);
          this.addBotMessage(fallbackResponse);
        }
      });

    } catch (error: any) {
      console.error('Error:', error);
      const fallbackResponse = this.getFallbackResponse(userMessage);
      this.addBotMessage(fallbackResponse);
    } finally {
      this.isTyping = false;
    }
  }

  getFallbackResponse(userMessage: string): string {
    if (!this.product) {
      return 'Xin lỗi, tôi chỉ có thể tư vấn khi bạn đang xem chi tiết sản phẩm. Vui lòng chọn một sản phẩm để tôi có thể hỗ trợ bạn tốt hơn.\n\n- Green Charger AI';
    }

    const message = userMessage.toLowerCase();

    if (message.includes('giá') || message.includes('price') || message.includes('cost')) {
      const price = this.product.finalPrice || this.product.price;
      return `Sản phẩm "${this.product.name}" có giá ${this.formatCurrency(price)}. ${this.product.finalPrice ? 'Đây là giá khuyến mãi đặc biệt!' : ''} Để được tư vấn chi tiết và ưu đãi tốt nhất, <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">liên hệ qua chúng tôi</a>.\n\n- Green Charger AI`;
    } else if (message.includes('bảo hành') || message.includes('warranty') || message.includes('guarantee')) {
      return `Sản phẩm "${this.product.name}" được bảo hành chính hãng. Thời gian bảo hành tùy thuộc vào từng sản phẩm cụ thể. <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">Liên hệ qua chúng tôi</a> để biết thêm chi tiết về chính sách bảo hành.\n\n- Green Charger AI`;
    } else if (message.includes('giao hàng') || message.includes('delivery') || message.includes('shipping')) {
      return `Chúng tôi cung cấp dịch vụ giao hàng nhanh chóng và an toàn trên toàn quốc cho sản phẩm "${this.product.name}". Thời gian giao hàng thường từ 1-3 ngày làm việc tùy theo khu vực. Miễn phí giao hàng cho đơn hàng trên 500.000đ. <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">Liên hệ qua chúng tôi</a> để được tư vấn chi tiết.\n\n- Green Charger AI`;
    } else if (message.includes('ưu điểm') || message.includes('advantage') || message.includes('tốt') || message.includes('đặc biệt')) {
      return `Sản phẩm "${this.product.name}" thuộc danh mục ${this.product.categoryName} có nhiều ưu điểm nổi bật: chất lượng cao, giá cả hợp lý, bảo hành chính hãng. ${this.product.description ? `Đặc biệt: ${this.product.description}` : ''} <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">Liên hệ qua chúng tôi</a> để được tư vấn thêm.\n\n- Green Charger AI`;
    } else if (message.includes('còn hàng') || message.includes('stock') || message.includes('có không')) {
      const status = this.product.quantityInStock > 0 ? 'Còn hàng' : 'Hết hàng';
      return `Sản phẩm "${this.product.name}" hiện tại ${status.toLowerCase()}. ${this.product.quantityInStock > 0 ? `Còn lại ${this.product.quantityInStock} sản phẩm.` : 'Vui lòng liên hệ để được thông báo khi có hàng mới.'} <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">Liên hệ qua chúng tôi</a> để đặt hàng.\n\n- Green Charger AI`;
    } else if (message.includes('quà tặng') || message.includes('gift') || message.includes('present')) {
      return `Sản phẩm "${this.product.name}" rất phù hợp làm quà tặng với thiết kế đẹp mắt và chất lượng cao. Chúng tôi cũng có dịch vụ đóng gói quà tặng chuyên nghiệp để tạo ấn tượng đặc biệt. <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">Liên hệ qua chúng tôi</a> để được tư vấn.\n\n- Green Charger AI`;
    } else if (message.includes('liên hệ') || message.includes('contact') || message.includes('tư vấn')) {
      return `Cảm ơn bạn đã quan tâm đến sản phẩm "${this.product.name}"! <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">Liên hệ qua chúng tôi</a> để được tư vấn chi tiết và chính xác nhất. Chúng tôi luôn sẵn sàng hỗ trợ bạn!\n\n- Green Charger AI`;
    } else {
      return `Cảm ơn bạn đã quan tâm đến sản phẩm "${this.product.name}"! Để được tư vấn chi tiết và chính xác nhất, <a href="https://web.facebook.com/GreenChargerVN/" target="_blank" rel="noopener" style="color: #2ecc71; text-decoration: underline; cursor: pointer;">liên hệ qua chúng tôi</a>. Chúng tôi luôn sẵn sàng hỗ trợ bạn!\n\n- Green Charger AI`;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  // Function to contact via Facebook
  contactViaMessenger(productName: string, topic: string): void {
    const message = `🛍️ Tư vấn sản phẩm Green Charger

📱 Sản phẩm: ${productName}
💬 Chủ đề quan tâm: ${topic}

Xin chào! Tôi quan tâm đến sản phẩm này và muốn được tư vấn thêm thông tin chi tiết.

Cảm ơn bạn! 🙏`;
    
    const facebookUrl = `https://web.facebook.com/GreenChargerVN/`;
    window.open(facebookUrl, '_blank');
  }
}

// Global function for onclick events
declare global {
  function contactViaMessenger(productName: string, topic: string): void;
}

// Make function available globally
(window as any).contactViaMessenger = function(productName: string, topic: string) {
  const message = `🛍️ Tư vấn sản phẩm Green Charger

📱 Sản phẩm: ${productName}
💬 Chủ đề quan tâm: ${topic}

Xin chào! Tôi quan tâm đến sản phẩm này và muốn được tư vấn thêm thông tin chi tiết.

Cảm ơn bạn! 🙏`;
  
  // Sử dụng Facebook Page
  const facebookUrl = `https://web.facebook.com/GreenChargerVN/`;
  window.open(facebookUrl, '_blank');
};
