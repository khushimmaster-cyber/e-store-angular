import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface ChatMessage {
  sender: 'Bot' | 'You';
  text?: string;
  type?: 'text' | 'support-card' | 'info-card' | 'suggestions';
  infoCard?: InfoCard;
  suggestions?: Suggestion[];
  showBackToMenu?: boolean;
}

export interface InfoCard {
  icon: string;
  title: string;
  lines?: string[];
  sections?: { heading: string; items: string[] }[];
}

export interface Suggestion {
  label: string;
  icon: string;
  action: string;
}

// 3 contextual suggestions shown after each bot reply
const SUGGESTIONS: Record<string, Suggestion[]> = {
  default: [
    { icon: '📦', label: 'Track Order',     action: 'track'    },
    { icon: '📞', label: 'Support',         action: 'support'  },
    { icon: '🛍️', label: 'Browse Products', action: 'shop'     },
  ],
  track: [
    { icon: '↩️', label: 'Return & Refund', action: 'returns'  },
    { icon: '🚚', label: 'Delivery Info',   action: 'delivery' },
    { icon: '📞', label: 'Support',         action: 'support'  },
  ],
  support: [
    { icon: '📦', label: 'Track Order',     action: 'track'    },
    { icon: '↩️', label: 'Return & Refund', action: 'returns'  },
    { icon: '🏷️', label: 'Offers',          action: 'offers'   },
  ],
  returns: [
    { icon: '📦', label: 'Track Order',     action: 'track'    },
    { icon: '📞', label: 'Support',         action: 'support'  },
    { icon: '🚚', label: 'Delivery Info',   action: 'delivery' },
  ],
  delivery: [
    { icon: '📦', label: 'Track Order',     action: 'track'    },
    { icon: '🏷️', label: 'Offers',          action: 'offers'   },
    { icon: '📞', label: 'Support',         action: 'support'  },
  ],
  offers: [
    { icon: '🛍️', label: 'Browse Products', action: 'shop'     },
    { icon: '📦', label: 'Track Order',     action: 'track'    },
    { icon: '↩️', label: 'Return & Refund', action: 'returns'  },
  ],
  shop: [
    { icon: '❤️', label: 'Wishlist',        action: 'wishlist' },
    { icon: '🛒', label: 'My Cart',         action: 'cart'     },
    { icon: '🏷️', label: 'Offers',          action: 'offers'   },
  ],
};

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.html',
  imports: [FormsModule, NgFor, NgIf],
  styleUrls: ['./chatbot.css']
})
export class ChatbotComponent implements AfterViewChecked, OnDestroy {

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  isOpen           = false;
  userMessage      = '';
  hasInteracted    = false;   // grid shown only before first interaction
  unreadCount      = 0;
  messages: ChatMessage[] = [];

  private shouldScroll = false;
  private navTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private router: Router) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() { this.clearNavTimer(); }

  // ── OPEN / CLOSE — state persists, no reset ───────────────────
  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount  = 0;
      this.shouldScroll = true;
    }
  }

  // ── BACK TO MENU ──────────────────────────────────────────────
  backToMenu() {
    this.clearNavTimer();
    this.hasInteracted = false;
    this.messages      = [];
    this.shouldScroll  = true;
  }

  // ── QUICK ACTIONS ─────────────────────────────────────────────
  quickAction(type: string) {
    this.clearNavTimer();
    this.hasInteracted = true;

    switch (type) {

      case 'track':
        this.addUserMsg('Track my order');
        this.addBotMsg('Redirecting you to My Orders page...', false);
        this.addSuggestions('track');
        this.navTimer = setTimeout(() => { this.router.navigate(['/myorder']); }, 900);
        break;

      case 'shop':
        this.addUserMsg('Browse products');
        this.addBotMsg('Taking you to our Category page...', false);
        this.addSuggestions('shop');
        this.navTimer = setTimeout(() => { this.router.navigate(['/category']); }, 900);
        break;

      case 'wishlist':
        this.addUserMsg('My Wishlist');
        this.addBotMsg('Opening your Wishlist...', false);
        this.addSuggestions('shop');
        this.navTimer = setTimeout(() => { this.router.navigate(['/wishlist']); }, 900);
        break;

      case 'cart':
        this.addUserMsg('My Cart');
        this.addBotMsg('Opening your Cart...', false);
        this.addSuggestions('shop');
        this.navTimer = setTimeout(() => { this.router.navigate(['/cart']); }, 900);
        break;

      case 'profile':
        this.addUserMsg('My Profile');
        this.addBotMsg('Opening your Profile...', false);
        this.addSuggestions('default');
        this.navTimer = setTimeout(() => { this.router.navigate(['/profile']); }, 900);
        break;

      case 'support':
        this.addUserMsg('Contact support');
        this.messages.push({ sender: 'Bot', type: 'support-card' });
        this.addSuggestions('support');
        this.shouldScroll = true;
        break;

      case 'returns':
        this.addUserMsg('Return & Refund');
        this.messages.push({
          sender: 'Bot', type: 'info-card',
          infoCard: {
            icon: '↩️', title: 'Return & Refund Policy',
            sections: [
              { heading: 'Eligibility', items: [
                  '✅ Returns accepted within 30 days',
                  '✅ Item must be unused & in original packaging',
                  '✅ Tags and invoice must be intact',
                  '❌ Used or altered items not eligible'
              ]},
              { heading: 'Refund Process', items: [
                  '🔄 Refund initiated after item pickup',
                  '💳 Credited in 5–7 business days',
                  '🏦 Refund to original payment method',
                  '📧 Confirmation sent via email'
              ]},
              { heading: 'How to Initiate', items: [
                  '1️⃣ Go to My Orders',
                  '2️⃣ Select the item to return',
                  '3️⃣ Choose reason & submit',
                  '4️⃣ Our team will arrange pickup'
              ]}
            ]
          }
        });
        this.addSuggestions('returns');
        this.shouldScroll = true;
        break;

      case 'delivery':
        this.addUserMsg('Delivery info');
        this.messages.push({
          sender: 'Bot', type: 'info-card',
          infoCard: {
            icon: '🚚', title: 'Delivery Information',
            sections: [
              { heading: 'Delivery Options', items: [
                  '📦 Standard — 3 to 5 business days',
                  '⚡ Express — 1 to 2 business days',
                  '🎁 Same-day (select cities only)'
              ]},
              { heading: 'Charges', items: [
                  '🆓 Free delivery on orders above ₹999',
                  '💰 Standard: ₹49 below ₹999',
                  '💰 Express: ₹99 flat charge'
              ]},
              { heading: 'Coverage & Tracking', items: [
                  '🌍 Pan-India delivery available',
                  '🔔 SMS & email updates at every step',
                  '📍 Live tracking link sent after dispatch'
              ]}
            ]
          }
        });
        this.addSuggestions('delivery');
        this.shouldScroll = true;
        break;

      case 'offers':
        this.addUserMsg('Offers & Coupons');
        this.messages.push({
          sender: 'Bot', type: 'info-card',
          infoCard: {
            icon: '🏷️', title: 'Current Offers',
            lines: [
              '🔥 MOSKA10 — 10% off sitewide',
              '🎉 FIRST20 — 20% off first order',
              '🚚 FREESHIP — Free shipping',
              '💳 CARD15 — 15% off card payments',
              '✨ Check Explore page for more!'
            ]
          }
        });
        this.addSuggestions('offers');
        this.shouldScroll = true;
        break;
    }
  }

  // ── FREE TEXT ─────────────────────────────────────────────────
  sendMessage() {
    const text = this.userMessage.trim();
    if (!text) return;
    this.userMessage   = '';
    this.hasInteracted = true;
    this.addUserMsg(text);
    this.handleKeyword(text);
  }

  // ── KEYWORD ROUTING ───────────────────────────────────────────
  private handleKeyword(text: string) {
    const m = text.toLowerCase();
    if      (m.includes('order') || m.includes('track'))                              { this.quickAction('track'); }
    else if (m.includes('wishlist'))                                                   { this.quickAction('wishlist'); }
    else if (m.includes('cart'))                                                       { this.quickAction('cart'); }
    else if (m.includes('profile'))                                                    { this.quickAction('profile'); }
    else if (m.includes('product') || m.includes('shop') || m.includes('category'))  { this.quickAction('shop'); }
    else if (m.includes('support') || m.includes('contact') || m.includes('whatsapp')){ this.quickAction('support'); }
    else if (m.includes('return') || m.includes('refund'))                            { this.quickAction('returns'); }
    else if (m.includes('delivery') || m.includes('shipping'))                        { this.quickAction('delivery'); }
    else if (m.includes('coupon') || m.includes('discount') || m.includes('offer'))  { this.quickAction('offers'); }
    else if (m.includes('hi') || m.includes('hello') || m.includes('hey')) {
      this.addBotMsg('Hey there! 👋 How can I help you today?');
      this.addSuggestions('default');
    } else if (m.includes('help') || m.includes('menu')) {
      this.backToMenu();
    } else {
      this.addBotMsg('Not sure about that. Try asking about orders, products, delivery, returns, or coupons.');
      this.addSuggestions('default');
    }
  }

  // ── HELPERS ───────────────────────────────────────────────────
  private addSuggestions(key: string) {
    const list = SUGGESTIONS[key] ?? SUGGESTIONS['default'];
    this.messages.push({ sender: 'Bot', type: 'suggestions', suggestions: list });
    this.shouldScroll = true;
  }

  private clearNavTimer() {
    if (this.navTimer !== null) { clearTimeout(this.navTimer); this.navTimer = null; }
  }

  private addBotMsg(text: string, showBackToMenu = false) {
    this.messages.push({ sender: 'Bot', text, type: 'text', showBackToMenu });
    this.shouldScroll = true;
  }

  private addUserMsg(text: string) {
    this.messages.push({ sender: 'You', text, type: 'text' });
    this.shouldScroll = true;
  }

  private scrollToBottom() {
    try { this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight; } catch {}
  }
}
