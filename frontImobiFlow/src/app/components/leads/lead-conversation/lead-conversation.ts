import { Component, Input, OnChanges, SimpleChanges, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Lead, ConversationMessage, LeadsService } from "../../../services/leads.service";
import { DatePipe, NgClass } from '@angular/common';
import {
  LucideMessageSquareText,
  LucideUser,
  LucideBot,
  LucideLoader2,
  LucideInbox,
} from '@lucide/angular';

@Component({
  selector: 'app-lead-conversation',
  imports: [
    DatePipe,
    NgClass,
    LucideMessageSquareText,
    LucideUser,
    LucideBot,
    LucideLoader2,
    LucideInbox,
  ],
  templateUrl: './lead-conversation.html',
})
export class LeadConversation implements OnChanges, OnInit, AfterViewChecked {
  @Input() lead: Lead | null = null;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages = signal<ConversationMessage[]>([]);
  loading = signal(false);

  private shouldScrollToBottom = false;

  constructor(private leadsService: LeadsService) {}

  ngOnInit() {
    if (this.lead) {
      this.loadConversation();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['lead'] && this.lead) {
      this.loadConversation();
    } else if (changes['lead'] && !this.lead) {
      this.messages.set([]);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  async loadConversation() {
    if (!this.lead) return;

    this.loading.set(true);
    const data = await this.leadsService.getConversationByTel(this.lead.tel);
    this.messages.set(data);
    console.log('[LeadConversation] Messages:', this.messages());

    this.loading.set(false);
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      console.warn('[LeadConversation] Scroll to bottom failed:', err);
    }
  }

  isUserMessage(role: string): boolean {
    const r = role.toLowerCase();
    return r.includes('user');
  }

  isAssistantMessage(role: string): boolean {
    const r = role.toLowerCase();
    return r.includes('assistant');
  }

  getWhatsAppUrl(): string {
    return this.lead ? this.leadsService.formatWhatsAppUrl(this.lead.tel) : '';
  }

  formatPhone(tel: number): string {
    let str = tel.toString();
    if (str.startsWith('55')) str = str.slice(2);
    if (str.length === 11) {
      return `(${str.slice(0, 2)}) ${str.slice(2, 7)}-${str.slice(7)}`;
    } else if (str.length === 10) {
      return `(${str.slice(0, 2)}) ${str.slice(2, 6)}-${str.slice(6)}`;
    }
    return str;
  }
}
